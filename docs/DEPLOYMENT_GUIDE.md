# DEPLOYMENT_GUIDE.md - Guía Paso a Paso para Desplegar en Vercel

Esta guía detalla el procedimiento completo para publicar la aplicación **Agyke** en producción.

---

## Paso 1: Preparar las Variables de Entorno
Asegúrate de contar con los valores de las siguientes llaves:
1. **Telegram Bot Token:** Proporcionado por [@BotFather](https://t.me/BotFather).
2. **Gemini API Key:** Generada desde [Google AI Studio](https://aistudio.google.com/).
3. **Supabase Credentials:** URL del proyecto, Anon Key y Service Role Key obtenidas de la configuración del proyecto en Supabase (`Settings -> API`).

---

## Paso 2: Crear el Proyecto en Vercel
1. Conecta tu cuenta de GitHub/GitLab con Vercel.
2. Selecciona **Import Project** y elige el repositorio de Agyke.
3. En la sección **Environment Variables**, añade todas las llaves descritas en `REQUIREMENTS_PROD.md`.
4. Haz clic en **Deploy**.

---

## Paso 3: Configurar el Webhook de Telegram

Una vez completado el despliegue y obtenido el dominio de Vercel (por ejemplo `https://agyke.vercel.app`), debes notificar a Telegram la ubicación del webhook.

### Opción A: Mediante Script Local
Ejecuta en tu terminal local:
```bash
TELEGRAM_BOT_TOKEN="tu_token" WEBHOOK_URL="https://agyke.vercel.app/api/telegram/webhook" npx tsx scripts/set-webhook.ts
```

### Opción B: Mediante cURL
```bash
curl -X POST "https://api.telegram.org/bot<TU_TELEGRAM_BOT_TOKEN>/setWebhook?url=https://agyke.vercel.app/api/telegram/webhook"
```

---

## Paso 4: Verificación
1. **Verificar Webhook en Telegram:**
   ```bash
   curl "https://api.telegram.org/bot<TU_TELEGRAM_BOT_TOKEN>/getWebhookInfo"
   ```
2. **Probar el Bot:** Abre Telegram y envía una foto o un mensaje como `/gasto 5000 Coto 50`.
3. **Revisar Logs:** Ingresa a Vercel -> Tu Proyecto -> **Logs** para verificar la entrada de peticiones `POST /api/telegram/webhook` con código HTTP 200.
