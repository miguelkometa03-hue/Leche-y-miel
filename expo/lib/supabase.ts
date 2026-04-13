// ─────────────────────────────────────────────────────────────────────────────
// expo/lib/supabase.ts — Pastry-Pro
//
// Cliente de Supabase para la base de datos y autenticación.
//
// CONFIGURACIÓN:
//   En Cloudflare Pages → Settings → Environment Variables, agrega:
//     EXPO_PUBLIC_SUPABASE_URL  = https://xxxx.supabase.co
//     EXPO_PUBLIC_SUPABASE_KEY  = tu-anon-public-key
//
//   En desarrollo local (.env en la carpeta expo/):
//     EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
//     EXPO_PUBLIC_SUPABASE_KEY=tu-anon-public-key
//
// ESTADO ACTUAL: Cliente listo. Las tablas de Supabase se crean en el dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

// Leemos las variables de entorno inyectadas por Expo
// (el prefijo EXPO_PUBLIC_ las hace accesibles en el cliente web y nativo)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "";

// Verificación en desarrollo: aviso si las variables no están configuradas
if (!supabaseUrl || !supabaseKey) {
  if (__DEV__) {
    console.warn(
      "⚠️ Pastry-Pro: Variables de Supabase no configuradas.\n" +
        "Crea expo/.env con:\n" +
        "  EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co\n" +
        "  EXPO_PUBLIC_SUPABASE_KEY=tu-anon-key"
    );
  }
}

// Cliente de Supabase — úsalo importando este archivo en cualquier screen
// Ejemplo: import { supabase } from "@/lib/supabase";
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Persistir la sesión en el dispositivo (requerido para React Native)
    persistSession: true,
    // Detectar sesión desde la URL (para magic links y OAuth)
    detectSessionInUrl: false,
  },
});

// ── Funciones de utilidad ─────────────────────────────────────────────────────

// Sube una fórmula a Supabase (para backup o comunidad)
// Uso: await uploadFormula(formula, userId)
export async function uploadFormula(
  formula: Record<string, unknown>,
  userId: string
) {
  const { data, error } = await supabase
    .from("formulas")
    .upsert({ ...formula, user_id: userId, updated_at: new Date().toISOString() });

  if (error) throw new Error(`Error guardando fórmula: ${error.message}`);
  return data;
}

// Obtiene todas las fórmulas públicas de la comunidad
export async function fetchCommunityFormulas() {
  const { data, error } = await supabase
    .from("formulas")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(`Error cargando comunidad: ${error.message}`);
  return data ?? [];
}

// Verifica si Supabase está correctamente configurado
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl) && Boolean(supabaseKey);
}
