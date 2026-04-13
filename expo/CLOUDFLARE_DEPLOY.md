# Deploy Pastry-Pro en Cloudflare Pages (100% Gratis)

## Paso 1 — Configurar el repositorio en GitHub
Asegúrate de que tu repo tenga estos archivos clave:
  - expo/package.json  (con script "build:web")
  - expo/metro.config.js  (sin withRorkMetro)
  - expo/app/(tabs)/agent.tsx  (pestaña Agente IA)
  - expo/utils/geminiAgent.ts  (servicio de IA)
  - expo/lib/supabase.ts  (cliente de base de datos)

## Paso 2 — Crear proyecto en Cloudflare Pages
1. Ir a https://pages.cloudflare.com
2. Crear cuenta gratuita (o iniciar sesión)
3. "Create a project" → "Connect to Git" → tu repo de GitHub
4. Autorizar acceso

## Paso 3 — Configuración del Build (EXACTAMENTE así)
| Campo                  | Valor                                      |
|------------------------|--------------------------------------------|
| Framework preset       | None (ninguno)                             |
| Build command          | cd expo && npm install && npm run build:web |
| Build output directory | expo/dist                                  |
| Root directory         | / (dejar vacío)                            |

## Paso 4 — Variables de entorno en Cloudflare
En "Settings" → "Environment variables" del proyecto, agrega:

| Variable                        | Valor                          |
|---------------------------------|--------------------------------|
| EXPO_PUBLIC_GEMINI_API_KEY      | AIza... (tu clave de Google)   |
| EXPO_PUBLIC_SUPABASE_URL        | https://xxxx.supabase.co       |
| EXPO_PUBLIC_SUPABASE_KEY        | eyJ... (tu anon key)           |
| NODE_VERSION                    | 18                             |

IMPORTANTE: Sin estas variables, la IA y Supabase no funcionarán en producción.
Aplicar para AMBOS entornos: Production y Preview.

## Paso 5 — Deploy
Clic en "Save and Deploy". La primera vez tarda ~3-4 minutos.
Tu app quedará disponible en: https://pastry-pro.pages.dev

## Paso 6 — Actualizar origin en app.json
Edita expo/app.json y cambia:
  "origin": "https://pastry-pro.pages.dev/"
Por tu URL real de Cloudflare (puede ser diferente si el nombre está tomado).

## Actualizaciones automáticas
Cada `git push` a la rama main redespliega automáticamente. Sin límites.

## Solución de errores comunes
- "build command failed" → Verifica que expo/metro.config.js no tenga withRorkMetro
- "API Key inválida" → Revisa que EXPO_PUBLIC_GEMINI_API_KEY esté configurada en Cloudflare
- "supabaseUrl is required" → Verifica EXPO_PUBLIC_SUPABASE_URL en Cloudflare
- Pantalla en blanco → Revisa los logs de build en Cloudflare Dashboard
