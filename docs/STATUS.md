# STATUS.md - Bitácora Viva del Proyecto Agyke

> **Propósito:** Este documento es la memoria técnica y el estado de situación en tiempo real de Agyke. En cada interacción o cambio en el repositorio, este archivo se consulta y actualiza para garantizar alineación absoluta con la metodología **Spec-Driven Development (SDD)**.

---

## 1. Identificación y Estado de Git
* **Fecha de corte:** 25 de Septiembre de 2026.
* **Rama Activa:** `dev`.
* **Último Commit:** `f230df9` (*fix(build): configure webpack resolve modules in next.config.ts for shared src imports*).
* **Rama de Producción:** `master` (conectada a despliegues en Vercel).

---

## 2. Semáforo de Componentes

| Componente | Estado | Cobertura / Tests | Notas |
| :--- | :---: | :---: | :--- |
| **Cálculo Financiero (`balance.ts`)** |  Listo | 10 tests unitarios | Invariante de `net_balance` y los 4 botones (`50`, `100`, `-100`, `0`). |
| **Parser Gemini 1.5 Flash (`gemini.ts`)** |  Listo | 6 tests unitarios | Conexión real con `@google/generative-ai` + fallback regex local de alta precisión. |
| **Gestor de Sesiones (`session.ts`)** |  Listo | 4 tests unitarios | Manejo de borradores conversacionales paso a paso por usuario. |
| **Bot Handlers (`src/bot/`)** |  Listo | Validado en build | Comandos `/start`, `/gasto`, `/saldo`, `/help`, `/cancelar`, callbacks y flujo asistido. |
| **Serverless Webhook (`web/.../webhook`)** |  Listo | Compila en Next.js | Desacoplado de `bot.start()`, compatible con Vercel Serverless. |
| **Dashboard Frontend (`web/.../page.tsx`)** |  Listo | 0 errores ESLint | Tablas de transacciones, filtros, métricas de balance y gráficos Recharts. |
| **Calidad y CI (`.github/workflows/ci.yml`)** |  Listo | 26/26 tests OK | Typecheck estricto (0 errores) y linter limpio (0 warnings). |
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
- [x] Rediseño Visual Frontend completo (`docs/ui/ROADMAP_UI.md` Fases 1 a 5):
  - [x] Tokens y paleta *Obsidian Slate* en `web/src/app/globals.css`.
  - [x] `<BadgeClassification />`, `<UserAvatar />`, `<HeaderBar />`.
  - [x] `<MasterBalanceHero />` con visualización de flujo de deuda en 3 segundos.
  - [x] `<StatMetricCard />` (4 métricas financieras agregadas).
  - [x] `<TransactionsTable />` con búsqueda en vivo, chips de filtro y estado vacío.
  - [x] `<AnalyticsSection />` con gráficos Recharts (Área y Donut).
  - [x] `<QueueViewer />` para auditoría visual del pipeline de Gemini.
  - [x] Refactor modular de `web/src/app/page.tsx`.

---

## 5. Próxima Acción Inmediata
Pushear cambios a `dev` (`git push origin dev`), generar Pull Request hacia `master`, fusionar y verificar en el bot de Telegram en vivo y el dashboard en producción (`https://agyke.vercel.app`).
