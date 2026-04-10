# Cómo hacer deploy en Cloudflare Pages (GRATIS, sin límites)

## Paso 1 — Entrar a Cloudflare Pages
Ve a: https://pages.cloudflare.com
Crea cuenta gratuita con tu email.

## Paso 2 — Conectar GitHub
1. Click "Create a project"
2. Click "Connect to Git"
3. Autoriza acceso a GitHub
4. Selecciona el repo: pastry-pro

## Paso 3 — Configurar el build (EXACTAMENTE así)

| Campo                  | Valor                              |
|------------------------|------------------------------------|
| Framework preset       | None                               |
| Build command          | cd expo && npm install && npm run build:web |
| Build output directory | expo/dist                          |
| Root directory         | /  (dejar vacío o /)               |

## Paso 4 — Variables de entorno
En "Environment variables" agregar:
- NODE_VERSION = 18

## Paso 5 — Deploy
Click "Save and Deploy". Primera vez tarda ~3 minutos.
Tu app queda en: https://pastry-pro.pages.dev

## Actualizaciones futuras
Cada vez que hagas `git push` a GitHub,
Cloudflare redespliega automáticamente. Sin límites.

## Alternativa rápida: Deploy sin GitHub (arrastrar carpeta)
1. Haz `cd expo && npm install && npm run build:web`
2. Se crea la carpeta `expo/dist/`
3. En Cloudflare Pages → "Upload assets" → arrastra la carpeta dist/
