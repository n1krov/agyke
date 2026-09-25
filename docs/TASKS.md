# TASKS.md - Roadmap Detallado de Implementación

### [x] Tarea 1: Estructura del Proyecto y Supabase Setup
- [x] Inicializar proyecto Node.js con TypeScript (`npm init`, `tsconfig.json`).
- [x] Instalar dependencias: `grammY`, `@supabase/supabase-js`, `@google/generative-ai`, `dotenv`.
- [x] Crear `src/types/database.ts` con las interfaces explícitas.
- [x] Crear `src/lib/supabase.ts` para exportar el cliente inicializado con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- [x] Ejecutar el script SQL de `ARCHITECTURE.md` en el dashboard de Supabase.

### [x] Tarea 2: Inicialización del Bot y Middleware de Autenticación
- [x] Configurar el archivo de entrada `src/bot/index.ts` instanciando `new Bot(process.env.TELEGRAM_BOT_TOKEN)`.
- [x] Crear middleware `src/bot/middlewares/auth.ts`: verifica si el `ctx.from.id` existe en la tabla `users`.
- [x] Implementar comando `/start`: si el usuario no existe, lo inserta pidiéndole el nombre.

### [x] Tarea 3: Handler de Carga Directa
- [x] Crear listener para el comando `/gasto <monto> <concepto> <clasificacion>`.
- [x] Validar que la clasificación sea una de las permitidas (`50`, `100`, `-100`, `0`).
- [x] Crear función `src/services/balance.ts` -> `updateBalance()` que recalcula el `net_balance` en la tabla `balances`.
- [x] Guardar directo en `transactions` y responder en el chat con la confirmación.

### [x] Tarea 4: Pipeline Asistido con Gemini (Audios e Imágenes)
- [x] Integrar `src/services/gemini.ts`.
- [x] Crear listener en grammY para `ctx.message.voice`, `ctx.message.photo` y `ctx.message.document`.
- [x] Descargar el archivo desde los servidores de Telegram mediante `ctx.api.getFile()`.
- [x] Enviar el buffer a Gemini 1.5 Flash para extraer `{ amount, concept }`.
- [x] Guardar el resultado en `agyke_queue` con `status: 'PENDING'`.
- [x] Enviar el mensaje a Telegram con Inline Keyboard de 4 botones (`50`, `100`, `-100`, `0`), pasando el `id` de la cola en el `callback_data`.

### [x] Tarea 5: Handler de Botones Agyke (Inline Keyboards)
- [x] Crear listener `bot.on('callback_query:data')`.
- [x] Parsear el `callback_data` para obtener el `agyke_id` y el `tipo_clasificacion`.
- [x] Consultar el item en `agyke_queue`.
- [x] Insertar el registro correspondiente en `transactions`.
- [x] Actualizar el estado del item en `agyke_queue` a `'PROCESSED'`.
- [x] Ejecutar `updateBalance()`.
- [x] Editar el mensaje original de Telegram con `ctx.editMessageText()` confirmando el procesamiento.

### [x] Tarea 6: Dashboard Web en Next.js
- [x] Crear app de Next.js en la carpeta `/web` o raíz.
- [x] Crear página `/` (Dashboard): muestra tarjetas con el `net_balance` actual (quién le debe a quién).
- [x] Crear tabla con el historial de la tabla `transactions`.
- [x] Crear gráficos de barras/torta (usando Recharts o Chart.js) para mostrar los gastos personales vs. compartidos.

### [x] Tarea 7: Arnés de Simulación de Telegram Headless (Spec: LOCAL_TESTING_SPEC.md)
- [x] Implementar helper de `Update` sintéticos (`src/tests/telegram-mock.ts`).
- [x] Crear suite de tests de integración (`src/tests/integration.test.ts`) simulando `/gasto`, mensajes ambiguos y callbacks de botones.
- [x] Añadir script `npm run test:integration` en `package.json`.

### [x] Tarea 8: Entorno de Pruebas Local Completo y Verificación Integral
- [x] Crear script CLI interactivo de simulación (`scripts/simulate-flow.ts`) para ejecutar escenarios desde la terminal con salida formateada.
- [x] Añadir script `npm run simulate` a `package.json`.
- [x] Ejecutar el flujo completo de prueba local de punta a punta (alta de usuarios, comandos, callbacks, recálculo de balance) y verificar que ande todo.
- [x] Asegurar que toda la suite de calidad (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`) esté en verde.

### [x] Tarea 9: Preparación y Validación del Entorno de Deploy a Producción
- [x] Validar endpoint serverless y configuración de webhook (`/api/telegram/webhook`, `/api/telegram/setup-webhook`, `scripts/set-webhook.ts`).
- [x] Verificar la matriz de variables de entorno para Vercel y Supabase según `REQUIREMENTS_PROD.md`.
- [x] Documentar y verificar el checklist de paso a producción (`dev` -> `master`) con CI validado.
