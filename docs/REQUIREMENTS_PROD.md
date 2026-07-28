# REQUIREMENTS_PROD.md - Especificaciones para Despliegue en Producción

## 1. Requerimientos de Infraestructura
* **Plataforma de Hosting:** Vercel (Next.js 14+ App Router).
* **Base de Datos:** Supabase PostgreSQL (Managed Cloud).
* **Motor de Inteligencia Artificial:** Google Gemini API (`gemini-1.5-flash`).
* **Bot Engine:** Telegram Bot API vía Webhooks (`grammY` framework).

---

## 2. Matriz de Variables de Entorno

| Variable | Tipo | Ámbito | Descripción | Ejemplo / Valor |
| :--- | :--- | :--- | :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | Secreto | Servidor | Token obtenido desde BotFather | `123456789:ABCdefGhIJKlmNoPQ...` |
| `TELEGRAM_SECRET_TOKEN` | Secreto | Servidor | Token opcional para validar el webhook | `agyke_prod_secret_token_2026` |
| `GEMINI_API_KEY` | Secreto | Servidor | API Key de Google AI Studio | `AIzaSyB...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Público | Servidor / Cliente | URL base de la instancia de Supabase | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público | Cliente | API Key anónima para lecturas del frontend | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secreto | Servidor | Key con privilegios elevados para bypass de RLS | `eyJhbGciOi...` |
| `VERCEL_URL` | Sistema | Servidor | Proporcionada automáticamente por Vercel | `agyke-app.vercel.app` |

---

## 3. Requerimientos Operativos de Producción

1. **Persistencia Efímera:**
   * No se permite el guardado de archivos multimedia en disco local (`/tmp` temporal).
   * Los buffers de audio y fotos obtenidos de Telegram se deben enviar en memoria directamente a Gemini.
2. **Respuesta Rápida a Telegram:**
   * Telegram requiere que el servidor responda con estado `HTTP 200 OK` en menos de 5 segundos.
   * Si una tarea pesada toma más tiempo, el procesamiento debe estructurarse de forma eficiente para evitar que Telegram reintente el envío del evento (`webhook retry loop`).
3. **Manejo de Errores y Logs:**
   * En caso de fallo en la extracción de Gemini o Supabase, el sistema debe responder en Telegram con un mensaje amistoso en español.
   * Los errores críticos deben registrarse en `console.error` para que sea
