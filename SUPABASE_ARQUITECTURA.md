# 🏗️ Arquitectura Backend — Pastry-Pro (Supabase)
## Sistema de Autenticación + Trial Gratuito + Suscripciones

---

## 📐 Visión General

```
┌─────────────────────────────────────────────────────┐
│                   PASTRY-PRO APP                    │
│                  (Expo / React Native Web)          │
└───────────────────┬─────────────────────────────────┘
                    │ supabase-js SDK
                    ▼
┌─────────────────────────────────────────────────────┐
│                    SUPABASE                         │
│                                                     │
│  ┌──────────────┐   ┌───────────────────────────┐  │
│  │  Auth        │   │  PostgreSQL Database       │  │
│  │  (email /    │   │                           │  │
│  │  Google /    │   │  • profiles               │  │
│  │  Apple)      │   │  • subscriptions          │  │
│  └──────────────┘   │  • subscription_events    │  │
│                     └───────────────────────────┘  │
│  ┌──────────────┐   ┌───────────────────────────┐  │
│  │  Row Level   │   │  Edge Functions           │  │
│  │  Security    │   │  • check-trial-status     │  │
│  │  (RLS)       │   │  • webhook-payment        │  │
│  └──────────────┘   └───────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                    │
                    ▼ (futuro)
┌─────────────────────────────────────────────────────┐
│          PASARELA DE PAGOS (Stripe / Wompi)         │
└─────────────────────────────────────────────────────┘
```

---

## PASO 1 — Crear el proyecto en Supabase

1. Ve a **https://supabase.com** → New Project
2. Nombre: `pastry-pro-prod`
3. Password de DB: genera uno fuerte y guárdalo
4. Región: **South America (São Paulo)** — la más cercana para Colombia/LATAM
5. Anota tus credenciales:
   - `Project URL`: `https://XXXX.supabase.co`
   - `anon key`: la clave pública para el cliente
   - `service_role key`: solo para Edge Functions (NUNCA en el cliente)

---

## PASO 2 — SQL: Estructura de Tablas

Ejecuta esto en el **SQL Editor** de Supabase (en orden):

```sql
-- ═══════════════════════════════════════════════════════════════
-- TABLA 1: profiles
-- Extiende auth.users con datos adicionales del panadero/pastelero
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  -- Referencia al usuario de Supabase Auth (UUID)
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos del perfil profesional
  full_name       TEXT,
  professional_title  TEXT,           -- "Panadero artesanal", "Chef pastelero"
  location        TEXT,               -- "Bogotá, Colombia"
  specialty       TEXT,               -- "panaderia" | "pasteleria" | "ambas"
  phone           TEXT,
  avatar_url      TEXT,
  bio             TEXT,
  
  -- Metadatos
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ═══════════════════════════════════════════════════════════════
-- TABLA 2: subscriptions
-- Estado de suscripción de cada usuario
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Estado actual: 'trial' | 'active' | 'expired' | 'cancelled'
  status          TEXT NOT NULL DEFAULT 'trial'
                  CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
  
  -- Plan: 'free' | 'pro' | 'premium'
  plan            TEXT NOT NULL DEFAULT 'free'
                  CHECK (plan IN ('free', 'pro', 'premium')),
  
  -- Periodo de trial (10 días desde el registro)
  trial_starts_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  trial_ends_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 days') NOT NULL,
  
  -- Periodo de suscripción paga (null si aún no ha pagado)
  subscription_starts_at  TIMESTAMPTZ,
  subscription_ends_at    TIMESTAMPTZ,
  
  -- Referencia al pago externo (Stripe customer ID, Wompi order ID, etc.)
  -- Se llena cuando el usuario paga
  payment_provider        TEXT,       -- 'stripe' | 'wompi' | 'paypal'
  external_customer_id    TEXT,       -- ID del cliente en la pasarela
  external_subscription_id TEXT,      -- ID de la suscripción en la pasarela
  
  -- Precio pagado (para historial)
  amount_paid     DECIMAL(10,2),
  currency        TEXT DEFAULT 'COP',
  
  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Un usuario solo puede tener UNA suscripción activa
  UNIQUE(user_id)
);

-- ═══════════════════════════════════════════════════════════════
-- TABLA 3: subscription_events
-- Log inmutable de todos los cambios de estado de suscripción
-- Útil para auditoría, soporte y debug
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.subscription_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  
  -- Tipo de evento
  event_type      TEXT NOT NULL,
  -- Valores posibles:
  --   'trial_started'       → usuario se registra
  --   'trial_expired'       → trial terminó sin pagar
  --   'subscription_created' → primer pago exitoso
  --   'subscription_renewed' → pago recurrente exitoso
  --   'subscription_cancelled' → el usuario cancela
  --   'subscription_expired' → venció sin renovar
  --   'payment_failed'      → pago rechazado
  
  -- Snapshot del estado anterior y nuevo (para debug)
  previous_status TEXT,
  new_status      TEXT,
  previous_plan   TEXT,
  new_plan        TEXT,
  
  -- Datos del pago si aplica
  amount          DECIMAL(10,2),
  currency        TEXT,
  payment_id      TEXT,               -- ID de transacción de la pasarela
  
  -- Metadata adicional (webhook data, etc.)
  metadata        JSONB DEFAULT '{}',
  
  -- Timestamp inmutable
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para queries rápidas
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_trial_ends ON public.subscriptions(trial_ends_at);
CREATE INDEX idx_sub_events_user_id ON public.subscription_events(user_id);
CREATE INDEX idx_sub_events_type ON public.subscription_events(event_type);
CREATE INDEX idx_sub_events_created ON public.subscription_events(created_at);
```

---

## PASO 3 — SQL: Row Level Security (RLS)

```sql
-- ═══════════════════════════════════════════════════════════════
-- Habilitar RLS en todas las tablas
-- (Sin esto, cualquiera podría leer/escribir datos de otros usuarios)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- ─── POLÍTICAS: profiles ────────────────────────────────────────
-- Un usuario solo puede ver y editar SU PROPIO perfil
CREATE POLICY "profiles: ver el propio" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: editar el propio" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles: crear el propio" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── POLÍTICAS: subscriptions ───────────────────────────────────
-- Un usuario solo puede ver SU PROPIA suscripción (no puede editarla)
-- Solo el service_role (Edge Functions) puede modificar suscripciones
CREATE POLICY "subs: ver la propia" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Solo service_role puede INSERT/UPDATE/DELETE (seguridad)
-- Las Edge Functions usan service_role key

-- ─── POLÍTICAS: subscription_events ─────────────────────────────
-- Solo lectura para el usuario, solo escritura para service_role
CREATE POLICY "sub_events: ver los propios" ON public.subscription_events
  FOR SELECT USING (auth.uid() = user_id);
```

---

## PASO 4 — SQL: Funciones y Triggers automáticos

```sql
-- ═══════════════════════════════════════════════════════════════
-- FUNCIÓN: auto-crear perfil y suscripción al registrarse
-- Se ejecuta automáticamente cuando un usuario hace signup
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- corre con permisos de superusuario (necesario para insertar)
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  -- Extraer nombre del metadata de Auth (Google/Apple lo proveen)
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)   -- fallback: parte antes del @
  );

  -- 1. Crear perfil del usuario
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (NEW.id, v_name, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- 2. Crear suscripción en modo TRIAL (10 días)
  INSERT INTO public.subscriptions (
    user_id,
    status,
    plan,
    trial_starts_at,
    trial_ends_at
  ) VALUES (
    NEW.id,
    'trial',
    'pro',                                -- trial da acceso completo (plan pro)
    NOW(),
    NOW() + INTERVAL '10 days'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Registrar el evento de inicio de trial
  INSERT INTO public.subscription_events (
    user_id,
    event_type,
    new_status,
    new_plan,
    metadata
  ) VALUES (
    NEW.id,
    'trial_started',
    'trial',
    'pro',
    jsonb_build_object('email', NEW.email, 'provider', NEW.app_metadata->>'provider')
  );

  RETURN NEW;
END;
$$;

-- Trigger que llama a la función en cada nuevo usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- FUNCIÓN: actualizar updated_at automáticamente
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- VISTA: estado de suscripción calculado en tiempo real
-- Detecta automáticamente si el trial expiró
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.subscription_status AS
SELECT
  s.user_id,
  s.plan,
  
  -- Estado calculado en tiempo real (no confiar en el campo status)
  CASE
    WHEN s.status = 'active' AND s.subscription_ends_at > NOW()
      THEN 'active'
    WHEN s.status = 'trial' AND s.trial_ends_at > NOW()
      THEN 'trial'
    WHEN s.status IN ('trial', 'expired') AND s.trial_ends_at <= NOW()
      THEN 'expired'
    ELSE s.status
  END AS current_status,
  
  -- Días restantes de trial
  GREATEST(0, EXTRACT(DAY FROM s.trial_ends_at - NOW()))::INT AS trial_days_remaining,
  
  -- Fechas clave
  s.trial_ends_at,
  s.subscription_ends_at,
  
  -- ¿Tiene acceso completo ahora mismo?
  CASE
    WHEN s.status = 'active' AND s.subscription_ends_at > NOW() THEN true
    WHEN s.status = 'trial' AND s.trial_ends_at > NOW() THEN true
    ELSE false
  END AS has_full_access

FROM public.subscriptions s;

-- RLS en la vista
ALTER VIEW public.subscription_status SET (security_invoker = true);
```

---

## PASO 5 — Instalación del SDK en el proyecto Expo

```bash
# En la carpeta expo/
bun add @supabase/supabase-js

# Para AsyncStorage (persistencia de sesión)
# Ya está instalado: @react-native-async-storage/async-storage
```

**Agregar al `.env` (o en Cloudflare Pages → Settings → Environment Variables):**

```env
EXPO_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...tu-anon-key-aqui
```

---

## PASO 6 — Código: Cliente de Supabase

**Crear el archivo `expo/utils/supabase.ts`:**

```typescript
// expo/utils/supabase.ts
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Supabase] ❌ Faltan variables de entorno EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // En web usamos localStorage, en nativo AsyncStorage
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

// ── Tipos de la DB ────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  professional_title: string | null;
  location: string | null;
  specialty: "panaderia" | "pasteleria" | "ambas" | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled";
export type SubscriptionPlan = "free" | "pro" | "premium";

export interface SubscriptionStatusView {
  user_id: string;
  plan: SubscriptionPlan;
  current_status: SubscriptionStatus;
  trial_days_remaining: number;
  trial_ends_at: string;
  subscription_ends_at: string | null;
  has_full_access: boolean;
}

// ── Helper: obtener estado de suscripción ─────────────────────────────────────

export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatusView | null> {
  const { data, error } = await supabase
    .from("subscription_status")         // Vista calculada en tiempo real
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("[Supabase] Error obteniendo suscripción:", error);
    return null;
  }
  return data as SubscriptionStatusView;
}
```

---

## PASO 7 — Código: Hook de Autenticación

**Crear `expo/hooks/useAuth.ts`:**

```typescript
// expo/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { supabase, type SubscriptionStatusView, getSubscriptionStatus } from "@/utils/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  subscription: SubscriptionStatusView | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasFullAccess: boolean;
  trialDaysRemaining: number;
}

export function useAuth(): AuthState & {
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatusView | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual al montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadSubscription(session.user.id);
      }
      setIsLoading(false);
    });

    // Escuchar cambios de sesión (login, logout, token refresh)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Auth] Evento:", event);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadSubscription(session.user.id);
        } else {
          setSubscription(null);
        }
        setIsLoading(false);
      }
    );

    return () => authSub.unsubscribe();
  }, []);

  const loadSubscription = async (userId: string) => {
    const sub = await getSubscriptionStatus(userId);
    setSubscription(sub);
  };

  // ── Registro de nuevo usuario ──────────────────────────────────────────────
  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },          // Se pasa al trigger handle_new_user()
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    // El trigger SQL crea el perfil y la suscripción de trial automáticamente
  };

  // ── Inicio de sesión ───────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // ── Cierre de sesión ───────────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscription(null);
  };

  return {
    user,
    session,
    subscription,
    isLoading,
    isAuthenticated: !!user,
    hasFullAccess: subscription?.has_full_access ?? false,
    trialDaysRemaining: subscription?.trial_days_remaining ?? 0,
    signUp,
    signIn,
    signOut,
  };
}
```

---

## PASO 8 — Edge Function: Webhook de Pagos (Futuro)

**Crear `supabase/functions/webhook-payment/index.ts`:**

```typescript
// supabase/functions/webhook-payment/index.ts
// Esta función recibe el webhook de Stripe/Wompi cuando hay un pago
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!  // ← service_role para bypass RLS
  );

  const body = await req.json();

  // Ejemplo para Stripe (adaptar según pasarela)
  if (body.type === "checkout.session.completed") {
    const userId = body.data.object.metadata.user_id;
    const customerId = body.data.object.customer;

    // Actualizar suscripción a "active"
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        plan: "pro",
        payment_provider: "stripe",
        external_customer_id: customerId,
        subscription_starts_at: new Date().toISOString(),
        subscription_ends_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),  // +30 días
        amount_paid: body.data.object.amount_total / 100,
        currency: body.data.object.currency.toUpperCase(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error actualizando suscripción:", error);
      return new Response("Error", { status: 500 });
    }

    // Registrar el evento
    await supabase.from("subscription_events").insert({
      user_id: userId,
      event_type: "subscription_created",
      previous_status: "trial",
      new_status: "active",
      new_plan: "pro",
      payment_id: body.data.object.payment_intent,
      metadata: body.data.object,
    });
  }

  return new Response("OK", { status: 200 });
});
```

---

## PASO 9 — Integración con el Store Zustand existente

Agrega esto al `useAppStore.ts` para sincronizar el estado de suscripción con Supabase:

```typescript
// En useAppStore.ts — agregar estos campos al interface AppState:

import { supabase, type SubscriptionStatusView } from "@/utils/supabase";
import type { User } from "@supabase/supabase-js";

// Nuevos campos en AppState:
interface AppState {
  // ... campos existentes ...
  
  // Auth state
  supabaseUser: User | null;
  supabaseSubscription: SubscriptionStatusView | null;
  isAuthLoading: boolean;
  
  // Auth actions
  setSupabaseUser: (user: User | null) => void;
  setSupabaseSubscription: (sub: SubscriptionStatusView | null) => void;
  
  // Check de acceso a features premium
  canAccessFeature: (feature: "formulas_ilimitadas" | "agente_ia" | "club") => boolean;
}

// Implementación del canAccessFeature:
canAccessFeature: (feature) => {
  const sub = get().supabaseSubscription;
  if (!sub) return false;
  if (!sub.has_full_access) return false;
  
  // Todas las features disponibles en trial y plan pro+
  return true;
},
```

---

## 📋 Resumen — Orden de implementación

| Semana | Paso | Descripción |
|--------|------|-------------|
| 1 | 1-4 | Crear proyecto Supabase + tablas + RLS + triggers |
| 1 | 5-7 | Instalar SDK + cliente + hook useAuth |
| 2 | — | Crear pantallas de Login/Register en la app |
| 2 | — | Guard de rutas: redirigir a login si no autenticado |
| 2 | — | Banner de trial: "X días restantes de prueba" |
| 3 | — | Integrar pasarela de pagos (Stripe o Wompi para Colombia) |
| 3 | 8 | Desplegar Edge Function del webhook |
| 4 | — | Pantalla de suscripción (plans + checkout) |

---

## 🔒 Seguridad — Reglas de oro

1. **Nunca** pongas `service_role_key` en el cliente/app. Solo en Edge Functions y tu backend.
2. La `anon key` es pública — RLS es tu primera línea de defensa.
3. Siempre valida el estado de suscripción **server-side** en la Edge Function, no solo en el cliente.
4. El trigger `handle_new_user()` es **SECURITY DEFINER** — corre con permisos de superusuario, por eso puede insertar en `auth.users` relacionado.
