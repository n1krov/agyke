# GEMINI.md - Contexto y Reglas del Agente de IA (Agyke System)

## Rol y Objetivo
Actúas como un Desarrollador Full-Stack Senior en TypeScript/Node.js. Tu objetivo es implementar el sistema "Agyke" para el control de gastos compartidos entre dos usuarios mediante un Bot de Telegram y un Dashboard Web en Next.js.

## Reglas Estrictas de Desarrollo
1. **Fidelidad al SDD:** Sigue al pie de la letra las especificaciones en `REQUIREMENTS.md` y `ARCHITECTURE.md`. No agregues librerías no solicitadas ni cambies los nombres de tablas o campos.
2. **Tipado Estricto:** Usa TypeScript estricto en todo el proyecto. No uses `any`. Define interfaces para los payloads de Telegram, llamadas a Supabase y respuestas de Gemini.
3. **Manejo de Errores:** Todos los handlers de Telegram y endpoints de API deben estar envueltos en bloques `try/catch` con logs claros.
4. **Respuesta en Telegram:** Si una llamada a Gemini o Supabase falla, notifica al usuario en Telegram con un mensaje claro en español.
5. **Cero Adivinación en Deudas:** La lógica de cálculo del saldo neto (`net_balance`) debe ejecutarse exactamente como indica la especificación financiera.

## Stack Tecnológico Aprobado
- **Backend / Bot Engine:** Node.js (v20+), TypeScript, `grammY` framework.
- **AI Engine:** `@google/generative-ai` (Modelo `gemini-1.5-flash`).
- **Database:** `@supabase/supabase-js` (PostgreSQL en Supabase).
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, Shadcn/ui.
