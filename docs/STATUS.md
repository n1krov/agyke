# STATUS.md - Bitácora Viva del Proyecto Agyke

> **Propósito:** Este documento es la memoria técnica y el estado de situación en tiempo real de Agyke. En cada interacción o cambio en el repositorio, este archivo se consulta y actualiza para garantizar alineación absoluta con la metodología **Spec-Driven Development (SDD)**.

---

## 1. Identificación y Estado de Git
* **Fecha de corte:** 24 de Septiembre de 2026.
* **Rama Activa:** `dev`.
* **Último Commit:** `0b536cd` (*feat(simulate): add --live flag support to populate real supabase database on demand*).
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
| **Build y Despliegue en Vercel** |  Listo | Validado con ADR-005 | Corrección de versiones de dependencias para `npm install` limpio en Vercel. |

---

## 3. Decisiones de Arquitectura Registradas (ADRs)

* **ADR-001 (Git Flow Estricto):** `master` es exclusivo para releases a producción (Vercel). Todo desarrollo, integración y testing previo ocurre en la rama `dev`.
* **ADR-002 (Unificación de Código en `/src`):** Se eliminó la carpeta duplicada `web/src/shared`. Next.js consume directamente `src/` mediante el path alias `@/shared/*` configurado en `web/tsconfig.json`.
* **ADR-003 (Desacoplamiento de Polling vs Webhook):** `src/bot/index.ts` solo exporta la instancia del bot sin iniciar listeners continuos. `src/bot/cli.ts` es el único punto de entrada para Long Polling (`npm run dev:bot`). El Webhook corre de forma stateless en `/api/telegram/webhook`.
* **ADR-004 (Testing Local sin Bot en Vivo):** En desarrollo local no se requiere conectar a Telegram con el celular. Las pruebas de flujos de gasto, parsing y recálculos se simulan con tests de integración automatizados.
* **ADR-005 (Resolución de Dependencias para Vercel):** Se ajustaron las versiones de `devDependencies` en el `package.json` raíz (`typescript@^5.7.2`, `@types/node@^22.10.0`, `tsx@^4.19.2`) para evitar errores 404 durante el paso `installCommand` en Vercel.
* **ADR-006 (Regla Mandatoria Pre-Commit SDD):** Ningún cambio de código se commitea sin haber actualizado previamente `docs/STATUS.md` y la documentación correspondiente en `docs/`.

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

---

## 5. Próxima Acción Inmediata
Hacer push de los cambios de `dev` a GitHub (`git push origin dev`) para que el preview deployment de Vercel compile exitosamente, y posteriormente crear/aprobar el Pull Request de `dev` a `master` para publicar en producción. Una vez publicado en `master`, ejecutar `scripts/set-webhook.ts` o consultar `/api/telegram/setup-webhook` para validar la conexión en vivo con Telegram.
