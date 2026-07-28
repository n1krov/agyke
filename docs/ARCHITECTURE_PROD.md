# ARCHITECTURE_PROD.md - Especificación Técnica de Producción y Serverless Workflow

## 1. Visión General de Producción
En el entorno de producción (desplegado en **Vercel**), el sistema **Agyke** abandona el modelo de ejecución continua (*Long Polling*) y migra a un paradigma **100% Serverless basado en Webhooks**.

```
[ Telegram App ]
       │
       │ (HTTPS POST Webhook)
       ▼
[ Vercel Edge / Serverless Function ] ──> /api/telegram/webhook
       │
       ├─► Check Auth (Supabase `users`)
       ├─► Extract / Download Buffer (Voice / Photo / Document)
       ├─► Call Gemini 1.5 Flash API (@google/generative-ai)
       ├─► Write to `agyke_queue` (Supabase Postgres)
       └─► Reply Inline Keyboard via Telegram API
```

---

## 2. Puntos Finales de API (Next.js App Router)

### A. Webhook Handler (`/app/api/telegram/webhook/route.ts`)
* **Método:** `POST`
* **Mecanismo:** Adapta el motor de `grammY` a la Web API Standard usando `webhookCallback(bot, 'std/http')`.
* **Seguridad:**
  * Header de validación opcional: `x-telegram-bot-api-secret-token`.
  * Middleware de autenticación previo a la ejecución de handlers (`authMiddleware`).

### B. Healthcheck / Manual Webhook Setup (`/app/api/telegram/setup-webhook/route.ts`)
* **Método:** `GET` / `POST` (Protegido por clave de administración).
* **Propósito:** Configurar o consultar automáticamente el estado del Webhook en los servidores de Telegram mediante la API de Telegram `setWebhook`.

---

## 3. Estrategia de Timeouts y Resiliencia en Vercel

* **Límite de Tiempo (Timeout Limit):**
  * Vercel Hobby Plan: 10 segundos.
  * Vercel Pro Plan: 60 segundos.
* **Optimizaciones para Mantener Latencia < 3s:**
  * Uso del modelo ultra veloz `gemini-1.5-flash`.
  * Descarga directa en memoria (`Buffer`) sin guardar en sistema de archivos local (`fs` no persistente en Lambda).
  * Consultas indexadas en Supabase Postgres con `SUPABASE_SERVICE_ROLE_KEY`.

---

## 4. Configuración del Cliente Supabase en Producción

Para evitar problemas de Row Level Security (RLS) en los endpoints Serverless, el servidor utiliza una instancia administrativa con `SUPABASE_SERVICE_ROLE_KEY`.

```typescript
// src/lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
```

---

## 5. DDL Adicional y Políticas RLS Recomendadas
esto es una sugerencia
```sql
-- Índice para acelerar búsquedas de mensajes de Telegram
CREATE INDEX IF NOT EXISTS idx_agyke_queue_telegram_msg ON agyke_queue(telegram_message_id);

-- Índice para búsquedas por usuario y estado
CREATE INDEX IF NOT EXISTS idx_agyke_queue_user_status ON agyke_queue(user_id, status);

-- Habilitar RLS en las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agyke_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública para el Dashboard de la Web (ajustar según requerimientos)
CREATE POLICY "Permitir lectura en balances" ON balances FOR SELECT USING (true);
CREATE POLICY "Permitir lectura en transacciones" ON transactions FOR SELECT USING (true);
```
