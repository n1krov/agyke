# TASKS_PROD.md - Checklist de Tareas para Despliegue en Producción

### [x] Tarea 1: Refactorización a Webhook de grammY
- [x] Crear el endpoint `/app/api/telegram/webhook/route.ts` usando `webhookCallback(bot, 'std/http')`.
- [x] Mover las definiciones de handlers y middlewares a un módulo reutilizable (`src/bot/`).
- [x] Asegurar que no existan llamadas activas a `bot.start()` en el código de producción.

### [x] Tarea 2: Adaptación de descarga de archivos en memoria (Buffers)
- [x] Refactorizar el descargador de archivos de Telegram (`ctx.api.getFile()`) para obtener directamente `ArrayBuffer` / `Buffer`.
- [x] Adaptar la llamada a Gemini para procesar el Buffer directamente con `inlineData`.

### [x] Tarea 3: Script y Endpoint de Configuración de Webhook
- [x] Crear el script `scripts/set-webhook.ts` para registrar la URL de Vercel en la API de Telegram.
- [x] Crear endpoint secundario de administración `/app/api/telegram/setup-webhook` para configuración on-demand.

### [x] Tarea 4: Configuración del Proyecto en Vercel
- [x] Crear el proyecto en el Dashboard de Vercel e importar el repositorio.
- [x] Cargar todas las variables de entorno (`TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).
- [x] Configurar los comandos de Build (`next build`).

### [ ] Tarea 5: Verificación y Testing de Producción
- [x] Ejecutar el registro del Webhook apuntando a la URL de Vercel (`https://agyke.vercel.app/api/telegram/webhook`).
- [ ] Enviar comando directo `/gasto` desde Telegram y verificar actualización en Supabase.
- [ ] Enviar una nota de voz y un comprobante en foto para validar Gemini 1.5 Flash en Vercel.
- [ ] Comprobar el tiempo de respuesta y verificar que no ocurran timeouts en los logs de Vercel.
- [ ] Validar que el Dashboard Web visualice el `net_balance` y el historial en tiempo real.
