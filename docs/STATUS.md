# STATUS.md - Bitácora Viva del Proyecto Agyke

> **Propósito:** Este documento es la memoria técnica y el estado de situación en tiempo real de Agyke. En cada interacción o cambio en el repositorio, este archivo se consulta y actualiza para garantizar alineación absoluta con la metodología **Spec-Driven Development (SDD)**.

---

## 1. Identificación y Estado de Git
* **Fecha de corte:** 28 de Septiembre de 2026.
* **Rama Activa:** `lab/multimodal-receipts` (laboratorio experimental derivado de `dev`).
* **Último Commit:** `0016eab` (*fix(gemini): update model to gemini-3.6-flash with resilient fallback chain*).
* **Rama Base:** `dev` | **Rama de Producción:** `master`.

---

## 2. Semáforo de Componentes

| Componente | Estado | Cobertura / Tests | Notas |
| :--- | :---: | :---: | :--- |
| **Cálculo Financiero (`balance.ts`)** |  Listo | 10 tests unitarios | Invariante de `net_balance` y los 4 botones (`50`, `100`, `-100`, `0`). |
| **Parser Gemini 1.5 Flash (`gemini.ts`)** |  Listo | 6 tests unitarios | Conexión real con `@google/generative-ai` + fallback regex local de alta precisión. |
| **Parser Multimodal Tickets (`receipt-parser.ts`)** |  Listo | 4 tests unitarios | Inferencia de comprobantes con Gemini Vision y sanitización de contrato canónico. |
| **Laboratorio Visual Web (`/lab`)** |  Listo | Validado en build | Playground interactivo en Next.js para carga y debug de comprobantes. |
| **Gestor de Sesiones (`session.ts`)** |  Listo | 4 tests unitarios | Manejo de borradores conversacionales paso a paso por usuario. |
| **Bot Handlers (`src/bot/`)** |  Listo | Validado en build | Comandos `/start`, `/gasto`, `/saldo`, `/help`, `/cancelar`, callbacks y flujo asistido. |
| **Serverless Webhook (`web/.../webhook`)** |  Listo | Compila en Next.js | Desacoplado de `bot.start()`, compatible con Vercel Serverless. |
| **Dashboard Frontend (`web/.../page.tsx`)** |  Listo | 0 errores ESLint | Tablas de transacciones, filtros, métricas de balance y gráficos Recharts. |
| **Calidad y CI (`.github/workflows/ci.yml`)** |  Listo | 37/37 tests OK | Typecheck estricto (0 errores) y linter limpio (0 warnings). |
| **Build y Despliegue en Vercel** |  Listo | Validado con ADR-005 a ADR-008 | Compilación Webpack explícita (`--webpack`) y módulos compartidos en Next.js 16. |

---

## 3. Decisiones de Arquitectura Registradas (ADRs)

* **ADR-001 (Git Flow Estricto):** `master` es exclusivo para releases a producción (Vercel). Todo desarrollo, integración y testing previo ocurre en la rama `dev`.
* **ADR-002 (Unificación de Código en `/src`):** Se eliminó la carpeta duplicada `web/src/shared`. Next.js consume directamente `src/` mediante el path alias `@/shared/*` configurado en `web/tsconfig.json`.
* **ADR-003 (Desacoplamiento de Polling vs Webhook):** `src/bot/index.ts` solo exporta la instancia del bot sin iniciar listeners continuos. `src/bot/cli.ts` es el único punto de entrada para Long Polling (`npm run dev:bot`). El Webhook corre de forma stateless en `/api/telegram/webhook`.
* **ADR-004 (Testing Local sin Bot en Vivo):** En desarrollo local no se requiere conectar a Telegram con el celular. Las pruebas de flujos de gasto, parsing y recálculos se simulan con tests de integración automatizados.
* **ADR-005 (Resolución de Dependencias para Vercel):** Se ajustaron las versiones de `devDependencies` en el `package.json` raíz (`typescript@^5.7.2`, `@types/node@^22.10.0`, `tsx@^4.19.2`) para evitar errores 404 durante el paso `installCommand` en Vercel.
* **ADR-006 (Regla Mandatoria Pre-Commit SDD):** Ningún cambio de código se commitea sin haber actualizado previamente `docs/STATUS.md` y la documentación correspondiente en `docs/`.
* **ADR-007 (Resolución de Módulos Compartidos en Next.js):** Se añadió `webpack.resolve.modules` en `web/next.config.ts` referenciando `web/node_modules`. Esto resuelve los errores `module-not-found` (`grammy`, `dotenv`) al compilar código de `../src/` dentro de Vercel.
* **ADR-008 (Compatibilidad Next.js 16 con Webpack):** Next.js 16 activa Turbopack por defecto en `next build`, lo que genera conflicto si se detecta configuración de `webpack` sin `turbopack`. Se fijó `"build": "next build --webpack"` en `web/package.json` y se declaró `turbopack: {}` en `web/next.config.ts` para compilar directamente con Webpack.
* **ADR-009 (Respuesta Directa de Saldo en Lenguaje Natural sin IA):** Se implementó intercepción de frases clave ("ver saldo", "saldo", "balance", "cuanto debemos", "ayuda", "cancelar") en `assistedFlowHandler` para responder inmediatamente con la plantilla preconfigurada de `saldoCommandHandler` y `helpCommandHandler` sin invocar a Gemini ni enviar menús intermedios. Además, se sanitizan los nombres de usuario para prevenir errores de parsing en Markdown.
* **ADR-010 (Sistema de Diseño UI/UX y Carpeta docs/ui):** Se formalizó el estándar visual del frontend en la nueva subcarpeta `docs/ui/` (`DESIGN_SYSTEM_SPEC.md`, `TOKENS_AND_PALETTE.md`, `COMPONENTS_SPEC.md`, `ROADMAP_UI.md`). Establece la paleta *Obsidian Slate*, números tabulares para montos financieros, jerarquía de balance en 3 segundos y modularización de la interfaz en componentes limpios.
* **ADR-011 (Recálculo Bajo Demanda y Resiliencia en Callbacks):** Se blindó `saldoCommandHandler` para ejecutar automáticamente `updateBalance()` si la tabla `balances` en Supabase aún no tiene registros inicializados, evitando valores en $0 incorrectos. Se añadió fallback de texto plano si Telegram rechaza Markdown y se envolvió `answerCallbackQuery` con captura de excepciones para que ningún botón interactivo quede con el spinner trabado.
* **ADR-012 (Logging Estructurado y Blindaje de Markdown en Comandos):** Se incorporó `bot.catch` global en `src/bot/index.ts` y logs detallados en el endpoint `/api/telegram/webhook` para visibilidad de updates en Vercel. Se añadieron fallbacks a texto plano en los comandos `/gasto` y `/help` para garantizar entrega de mensajes aún si Telegram rechaza entidades Markdown.
* **ADR-013 (Desactivación de Webhook Reply y Entrega Multicapa en Serverless):** Se configuró `canUseWebhookReply: () => false` en la inicialización de `grammY` para garantizar que la función serverless en Vercel no cierre prematuramente la respuesta HTTP antes de completar los envíos de mensajes. Se añadió entrega multicapa en `/saldo`, `/help` y `/gasto` (`Markdown` -> texto plano -> `ctx.api.sendMessage(chatId, ...)`) con logs de trazabilidad en consola para cada callback query.
* **ADR-014 (Control de Acceso Ligero por PIN / Contraseña y Middleware):** Se especificó y construyó la protección del Dashboard Web mediante un sistema de PIN / Contraseña compartido (`docs/auth/AUTH_SPEC.md`). El módulo criptográfico reside en `src/lib/auth.ts` (alineado a `rootDir: "./src"` y ADR-002), utiliza tokens HMAC-SHA256 en cookies `httpOnly; Secure; SameSite=Lax`, e intercepta en `middleware.ts` las rutas `/` y `/api/dashboard`, excluyendo explícitamente el webhook de Telegram (`/api/telegram/webhook`).
* **ADR-015 (Identidad Visual, Metadatos de Navegador y Favicon Personalizado):** Se eliminaron los metadatos por defecto de Next.js ("Create Next App" / "create vercel app" y el favicon triangular de Vercel) para consolidar la marca Agyke en el navegador. Se configuró `metadata.title` con plantilla dinámica (`%s | Agyke`) y valor por defecto `"Agyke - Control de Gastos Compartidos"`, idioma en español (`lang="es"`), layout dedicado para `/login` (`"Iniciar Sesión | Agyke"`), y se generaron los paquetes completos de iconos de balanza Agyke con degradado índigo oficial en `web/src/app` y `web/public`: vector SVG (`icon.svg`), `.ico` multi-resolución (16x16 a 256x256 con antialiasing Lanczos) y `apple-icon.png` (180x180).
* **ADR-016 (Especificación de Ingestión Multimodal y Arnés Local Test-First):** Se formalizó en `docs/multimodal/` la arquitectura completa para el procesamiento inteligente de notas de voz (OGG/Opus), comprobantes físicos (JPEG/PNG) y facturas digitales (PDF). Se estableció como principio innegociable el Contrato Canónico JSON (`ExtractedExpenseDraft`) para desacoplar el formato binario de origen del motor financiero de Agyke. Se especificaron prompts dedicados para modismos argentinos ("lucas", "mitad y mitad", etc.), un arnés CLI local (`scripts/test-multimodal.ts`) para validación rápida sin depender del bot en vivo, y un modo de vista previa transparente en Telegram con cancelación inmediata con un toque (`[ ❌ Cancelar / Descartar ]`).
* **ADR-017 (Actualización a Gemini 3.6 Flash y Cadena de Resiliencia Multimodelo):** Debido al retiro de `gemini-1.5-flash` en la API v1beta de Google, se actualizaron los servicios `receipt-parser.ts` y `gemini.ts` a `gemini-3.6-flash`. Para blindar el sistema contra errores 404 (modelos discontinuados) o 503 (picos temporales de alta demanda), se implementó una cadena de fallback en cascada (`gemini-3.6-flash` -> `gemini-3.5-flash-lite` -> `gemini-flash-latest`), garantizando continuidad operativa en inferencias de comprobantes y texto sin interrupción de la interfaz.

---

## 4. Estado de Tareas (Roadmap)

### Completadas
- [x] Tarea 1: Estructura del Proyecto y Supabase Setup (`docs/TASKS.md`).
- [x] Tarea 2: Inicialización del Bot y Middleware de Autenticación (`docs/TASKS.md`).
- [x] Tarea 3: Handler de Carga Directa `/gasto` (`docs/TASKS.md`).
- [x] Tarea 4: Pipeline Asistido con Gemini 1.5 Flash (`docs/TASKS.md`).
- [x] Tarea 5: Handler de Botones Agyke (Inline Keyboards) (`docs/TASKS.md`).
- [x] Tarea 6: Dashboard Web en Next.js (`docs/TASKS.md`).
- [x] Tarea 7: Arnés de Simulación de Telegram Headless (`docs/LOCAL_TESTING_SPEC.md`).
- [x] Tarea 8: Entorno de Pruebas Local Completo y Verificación Integral (`scripts/simulate-flow.ts`).
- [x] Tarea 9: Preparación y Validación del Entorno de Deploy a Producción (`docs/TASKS_PROD.md`).
- [x] Refactor Webhook Serverless y Buffer en memoria (`docs/TASKS_PROD.md` Tareas 1-3).
- [x] Suite de Pruebas Unitarias y CI Pipeline (`docs/WORKFLOW_DEV_CI.md`).
- [x] Corrección de dependencias y compatibilidad de build en Vercel.
- [x] Soporte para consulta de saldo en lenguaje natural directo sin IA.
- [x] Especificación formal del Sistema de Diseño UI/UX en `docs/ui/`.
- [x] Rediseño Visual Frontend completo (`docs/ui/ROADMAP_UI.md` Fases 1 a 5).
- [x] Especificación formal de Control de Acceso y Privacidad por PIN (`docs/auth/`).
- [x] Implementación completa de Autenticación Ligera por PIN ([`docs/auth/TASKS_AUTH.md`](./auth/TASKS_AUTH.md)):
  - [x] Tarea AUTH-1 a AUTH-3: Módulo criptográfico HMAC (`web/src/lib/auth.ts`), endpoints `/api/auth/login`, `/api/auth/logout` y `/api/auth/check`.
  - [x] Tarea AUTH-4: Next.js Middleware (`web/src/middleware.ts`) con bypass estricto a `/api/telegram/webhook` y `/login`.
  - [x] Tarea AUTH-5 a AUTH-6: Pantalla `web/src/app/login/page.tsx` estilo *Obsidian Slate* y botón de bloqueo en `HeaderBar.tsx`.
  - [x] Tarea AUTH-7 a AUTH-9: Suite de tests unitarios de autenticación (`src/tests/auth.test.ts` 5/5 pasando).
- [x] Identidad Visual y Favicon del Navegador (ADR-015): Reemplazo total del branding de Vercel/Next por Agyke (título dinámico, balanza SVG, favicon.ico multi-resolución y apple-icon).
- [x] Especificación de Ingestión Multimodal (ADR-016 en `docs/multimodal/`):
  - [x] Arquitectura y Contrato Canónico JSON (`ExtractedExpenseDraft`).
  - [x] Especificación de Notas de Voz y Audio (`SPEC_VOICE_AUDIO.md`).
  - [x] Especificación de Comprobantes Físicos e Imágenes (`SPEC_RECEIPTS_IMAGES.md`).
  - [x] Especificación de Facturas y Documentos PDF (`SPEC_DOCUMENTS_PDF.md`).
  - [x] Especificación del Arnés de Pruebas Local y Metodología Test-First (`SPEC_TESTING_HARNESS.md`).
  - [x] Roadmap y Checklist de Implementación (`TASKS_MULTIMODAL.md`).
- [x] **Laboratorio Experimental Multimodal (Rama `lab/multimodal-receipts`):**
  - [x] Formalización de tipos `ExtractedExpenseDraft` y `MultimodalProcessResponse` en `src/types/multimodal.ts`.
  - [x] Servicio desacoplado `parseReceiptImage` con Gemini 1.5 Flash Vision en `src/services/multimodal/receipt-parser.ts`.
  - [x] Suite de tests unitarios y sanitización en `src/tests/multimodal/receipt.test.ts` (4/4 pasando).
  - [x] Endpoint de inferencia `/api/lab/process-receipt` en Next.js con soporte multipart y telemetría.
  - [x] Vista interactiva `/lab` en el Dashboard con drag & drop, generador de tickets de prueba, inspector JSON y logs en vivo.
  - [x] Acceso directo desde `HeaderBar.tsx` (botón *Lab*).

---

## 5. Próxima Acción Inmediata
Iniciar el servidor de desarrollo local del Dashboard (`npm run dev:web`), abrir en el navegador `http://localhost:3000/lab` y realizar pruebas interactivas con comprobantes reales o con el botón *"Generar Ticket de Prueba"*. Verificar la extracción de montos y telemetría en pantalla y consola.
