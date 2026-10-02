# STATUS.md - Bitácora Viva del Proyecto Agyke

> **Propósito:** Este documento es la memoria técnica y el estado de situación en tiempo real de Agyke. En cada interacción o cambio en el repositorio, este archivo se consulta y actualiza para garantizar alineación absoluta con la metodología **Spec-Driven Development (SDD)**.

---

## 1. Identificación y Estado de Git
* **Fecha de corte:** 02 de Octubre de 2026.
* **Rama Activa:** `lab/multimodal-receipts` (laboratorio experimental derivado de `dev`).
* **Rama Base:** `dev` | **Rama de Producción:** `master`.
* **Último Commit:** `020e9cd` + merge de sincronización `dev`.

---

## 2. Semáforo de Componentes

| Componente | Estado | Cobertura / Tests | Notas |
| :--- | :---: | :---: | :--- |
| **Cálculo Financiero (`balance.ts`)** |  Listo | 10 tests unitarios | Invariante de `net_balance` y los 4 botones (`50`, `100`, `-100`, `0`). |
| **Parser Gemini Flash (`gemini.ts`)** |  Listo | 6 tests unitarios | Resiliencia multimodelo (`gemini-3.6-flash` -> `3.5-flash-lite` -> fallback local). |
| **Gestor de Sesiones (`session.ts`)** |  Listo | 4 tests unitarios | Manejo de borradores conversacionales paso a paso por usuario. |
| **Bot Handlers (`src/bot/`)** |  Listo | Validado en build | Comandos `/start`, `/gasto`, `/saldo`, `/help`, `/cancelar`, callbacks y flujo asistido. |
| **Serverless Webhook (`web/.../webhook`)** |  Listo | Compila en Next.js | Desacoplado de `bot.start()`, compatible con Vercel Serverless. |
| **Dashboard Frontend (`web/.../page.tsx`)** |  Listo | 0 errores ESLint | Tablas de transacciones, filtros, métricas de balance y gráficos Recharts. |
| **Autenticación Ligera PIN (`/login`)** |  Listo | 5 tests unitarios | Tokens HMAC-SHA256, cookies httpOnly y middleware Next.js. |
| **Tablero de Agente (`docs/board.json`)** |  Listo | Schema 2020-12 | Tablero JSON de 48 tareas, verificado con `npm run board`. |
| **Laboratorio Multimodal (`/lab`)** | 🔬 En Desarrollo | Tests unitarios passing | Playground experimental para comprobantes físicos, audio y facturas PDF. |
| **Calidad y CI (`.github/workflows/ci.yml`)** |  Listo | 30/30 tests OK | Typecheck estricto (0 errores) y linter limpio (0 warnings). |
| **Build y Despliegue en Vercel** |  Listo | Validado con ADR-005 a ADR-008 | Compilación Webpack explícita (`--webpack`) y módulos compartidos en Next.js 16. |

---

## 3. Decisiones de Arquitectura Registradas (ADRs)

* **ADR-001 a ADR-015:** Consultar historial de releases para Git Flow, unificación en `/src`, webhook desacoplado, testing local sin bot en vivo, compatibilidad Next.js 16/Webpack, respuesta rápida sin IA, Sistema de Diseño Obsidian Slate, resiliencia en callbacks, autenticación ligera por PIN e identidad visual oficial.
* **ADR-016 (Especificación de Ingestión Multimodal y Arnés Local Test-First):** Se formalizó en `docs/multimodal/` la arquitectura completa para el procesamiento inteligente de notas de voz (OGG/Opus), comprobantes físicos (JPEG/PNG) y facturas digitales (PDF). Se estableció como principio innegociable el Contrato Canónico JSON (`ExtractedExpenseDraft`) para desacoplar el formato binario de origen del motor financiero de Agyke.
* **ADR-017 (Living UI, Dinamismo de Fondo, Rediseño de Login y Gráfico de Tarta Interactivo):** Se formalizó en `docs/ui/SPEC_LIVING_UI_MOTION_AND_LOGIN.md` el estándar para dotar de vida a la interfaz web sin penalizaciones de rendimiento (Pure CSS GPU con `ambient-float-slow` y `ambient-float-reverse`), micro-animación `shake-x` en `/login` y Donut Chart interactivo con KPI central dinámico en `AnalyticsSection.tsx`.
* **ADR-018 (Especificación Arquitectural del Gran Dashboard Fullscreen en Backlog):** Se formalizó en `docs/ui/SPEC_GRAN_DASHBOARD_FULLSCREEN.md` la visión de la vista de pantalla completa (100vh / 100vw sin scroll) estilo Kiosk / Command Center para Smart TVs y monitores secundarios, manteniéndola en estado **PENDIENTE / BACKLOG** en el roadmap hasta que se apliquen migraciones con campos analíticos extendidos.
* **ADR-019 (Tablero Operativo de Tareas en JSON para el Agente de IA):** Se formalizó e implementó un tablero estructurado en [`docs/board.json`](./board.json) validado mediante esquema estricto [`docs/schemas/board.schema.json`](./schemas/board.schema.json), con visualizador CLI `npm run board` y reglas de sincronización mandatorias en [`GEMINI.md`](../GEMINI.md).
* **ADR-020 (Actualización a Gemini 3.6 Flash y Cadena de Resiliencia Multimodelo):** Debido al retiro de `gemini-1.5-flash` en la API v1beta de Google, se actualizaron los servicios `receipt-parser.ts` y `gemini.ts` a `gemini-3.6-flash`. Para blindar el sistema contra errores 404 (modelos discontinuados) o 503 (picos temporales de alta demanda), se implementó una cadena de fallback en cascada (`gemini-3.6-flash` -> `gemini-3.5-flash-lite` -> `gemini-flash-latest`), garantizando continuidad operativa en inferencias de comprobantes y texto sin interrupción de la interfaz.

---

## 4. Estado de Tareas (Roadmap)

### Completadas
- [x] Tareas Core 1 a 9 completadas (`docs/TASKS.md` y `docs/TASKS_PROD.md`).
- [x] Autenticación Ligera por PIN (Fases 1 a 4 completadas en `docs/auth/TASKS_AUTH.md`).
- [x] Identidad Visual y Favicon del Navegador (ADR-015).
- [x] Especificación de Ingestión Multimodal (ADR-016 en `docs/multimodal/`).
- [x] Especificación de Interfaz Viva, Dinamismo y Rediseño de Login (`docs/ui/SPEC_LIVING_UI_MOTION_AND_LOGIN.md` - ADR-017).
- [x] Especificación Arquitectural del Gran Dashboard Fullscreen en Backlog (`docs/ui/SPEC_GRAN_DASHBOARD_FULLSCREEN.md` - ADR-018).
- [x] Actualización Integral del `README.md` alineado a Next.js 16, Autenticación PIN y SDD.
- [x] Implementación del Tablero Operativo de Tareas en JSON (`docs/board.json`, `docs/schemas/board.schema.json`, `npm run board` - ADR-019).
- [x] **Laboratorio Experimental Multimodal (Fase Comprobantes / Tickets):**
  - [x] Formalización de tipos `ExtractedExpenseDraft` y `MultimodalProcessResponse` en `src/types/multimodal.ts`.
  - [x] Servicio desacoplado `parseReceiptImage` con Gemini Visión en `src/services/multimodal/receipt-parser.ts`.
  - [x] Suite de tests unitarios y sanitización en `src/tests/multimodal/receipt.test.ts` (4/4 pasando).
  - [x] Endpoint de inferencia `/api/lab/process-receipt` en Next.js con soporte multipart y telemetría.
  - [x] Vista interactiva `/lab` en el Dashboard para comprobantes físicos.

---

## 5. Próxima Acción Inmediata
Ampliar el Playground del Laboratorio (`/lab`) para convertirlo en un banco de pruebas multimodal unificado 3-en-1:
1. Implementar el motor de Audio (`src/services/multimodal/audio-parser.ts`) y endpoint `/api/lab/process-audio`.
2. Implementar el motor de Facturas PDF (`src/services/multimodal/pdf-parser.ts`) y endpoint `/api/lab/process-pdf`.
3. Integrar las 3 pestañas interactivas en `web/src/app/lab/page.tsx` (Comprobantes, Notas de Voz y Facturas PDF) para pruebas en vivo en el navegador.
