# STATUS.md - Bitácora Viva del Proyecto Agyke

> **Propósito:** Este documento es la memoria técnica y el estado de situación en tiempo real de Agyke. En cada interacción o cambio en el repositorio, este archivo se consulta y actualiza para garantizar alineación absoluta con la metodología **Spec-Driven Development (SDD)**.

---

## 1. Identificación y Estado de Git
* **Fecha de corte:** 05 de Octubre de 2026.
* **Rama Activa:** `feat/mobile-responsive-ui` (creada a partir de `dev`).
* **Rama Base:** `dev` | **Rama de Producción:** `master`.
* **Último Commit:** Sincronizado con `2976871` en `dev`.

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
| **Tablero de Agente (`docs/board.json`)** |  Listo | Schema 2020-12 | Tablero JSON de 54 tareas, verificado con `npm run board`. |
| **Ingestión Multimodal Bot (`src/bot/`)** |  Listo | 13 tests (unit + int) | Canalización de Notas de Voz, Comprobantes e Imágenes y Facturas PDF en Telegram. |
| **Calidad y CI (`.github/workflows/ci.yml`)** |  Listo | 46/46 tests OK | Typecheck estricto (0 errores) y linter limpio (0 warnings). |
| **Build y Despliegue en Vercel** |  Listo | Validado con ADR-005 a ADR-008 | Compilación Webpack explícita (`--webpack`) y módulos compartidos en Next.js 16. |

---

## 3. Decisiones de Arquitectura Registradas (ADRs)

* **ADR-001 a ADR-015:** Consultar historial de releases para Git Flow, unificación en `/src`, webhook desacoplado, testing local sin bot en vivo, compatibilidad Next.js 16/Webpack, respuesta rápida sin IA, Sistema de Diseño Obsidian Slate, resiliencia en callbacks, autenticación ligera por PIN e identidad visual oficial.
* **ADR-016 (Especificación de Ingestión Multimodal y Arnés Local Test-First):** Se formalizó en `docs/multimodal/` la arquitectura completa para el procesamiento inteligente de notas de voz (OGG/Opus), comprobantes físicos (JPEG/PNG) y facturas digitales (PDF). Se estableció como principio innegociable el Contrato Canónico JSON (`ExtractedExpenseDraft`) para desacoplar el formato binario de origen del motor financiero de Agyke.
* **ADR-017 (Living UI, Dinamismo de Fondo, Rediseño de Login y Gráfico de Tarta Interactivo):** Se formalizó en `docs/ui/SPEC_LIVING_UI_MOTION_AND_LOGIN.md` el estándar para dotar de vida a la interfaz web sin penalizaciones de rendimiento (Pure CSS GPU con `ambient-float-slow` y `ambient-float-reverse`), micro-animación `shake-x` en `/login` y Donut Chart interactivo con KPI central dinámico en `AnalyticsSection.tsx`.
* **ADR-018 (Especificación Arquitectural del Gran Dashboard Fullscreen en Backlog):** Se formalizó en `docs/ui/SPEC_GRAN_DASHBOARD_FULLSCREEN.md` la visión de la vista de pantalla completa (100vh / 100vw sin scroll) estilo Kiosk / Command Center para Smart TVs y monitores secundarios, manteniéndola en estado **PENDIENTE / BACKLOG** en el roadmap hasta que se apliquen migraciones con campos analíticos extendidos.
* **ADR-019 (Tablero Operativo de Tareas en JSON para el Agente de IA):** Se formalizó e implementó un tablero estructurado en [`docs/board.json`](./board.json) validado mediante esquema estricto [`docs/schemas/board.schema.json`](./schemas/board.schema.json), con visualizador CLI `npm run board` y reglas de sincronización mandatorias en [`GEMINI.md`](../GEMINI.md).
* **ADR-020 (Actualización a Gemini 3.6 Flash y Cadena de Resiliencia Multimodelo):** Debido al retiro de `gemini-1.5-flash` en la API v1beta de Google, se actualizaron los servicios `receipt-parser.ts`, `audio-parser.ts`, `pdf-parser.ts` y `gemini.ts` a `gemini-3.6-flash`. Para blindar el sistema contra errores 404 (modelos discontinuados) o 503 (picos temporales de alta demanda), se implementó una cadena de fallback en cascada (`gemini-3.6-flash` -> `gemini-3.5-flash-lite` -> `gemini-flash-latest`), garantizando continuidad operativa en inferencias de comprobantes y texto sin interrupción de la interfaz.
* **ADR-021 (Integración de Ingestión Multimodal en Telegram y Botón de Descarte):** Se canalizaron en `src/bot/handlers/assisted.ts` las 3 fuentes de comprobantes (`parseAudioMessage`, `parseReceiptImage`, `parsePdfDocument`) hacia el contrato `ExtractedExpenseDraft`. Se diseñó la tarjeta de previsualización en Telegram con transcripción literal, datos comerciales, monto formateado en ARS y resaltado de clasificación sugerida. Se incorporó el botón `[ ❌ Descartar Gasto ]` (`MULTI-18`) con handler dedicado en `callback.ts` para cancelar ítems de `agyke_queue` a estado `DISCARDED` sin impacto contable, y se limpiaron las rutas temporales del laboratorio para mantener el árbol de producción pulcro y libre de código de prueba.
* **ADR-022 (Implementación de Interfaz Viva, Dinamismo de Fondo, Login Elevado y Donut Chart Interactivo):** Siguiendo `SPEC_LIVING_UI_MOTION_AND_LOGIN.md`, se implementó la Fase 7 completa (`UI-16` a `UI-20`):
  1. **Atmósfera Viva:** Orbes dinámicos de luz con aceleración por hardware (`ambient-float-slow` 18s y `ambient-float-reverse` 22s), pulso central (`mesh-pulse-subtle` 10s) y patrón de micro-malla (`bg-grid-mesh`) montados en el Dashboard principal (`page.tsx`) y pantalla de autenticación (`/login`).
  2. **Login Elevado:** Micro-animación de rechazo `shake-x` (400ms) ante clave errónea, borde de advertencia carmesí transitorio, isotipo con halo de respiración armónica (`animate-halo-breathe`), indicadores táctiles de longitud de PIN y botón de desbloqueo con efecto haz de luz diagonal (*shimmer*).
  3. **Interactive Donut Chart:** Transformación de la tarta estática en `<AnalyticsSection />` a un centro de comando financiero interactivo con KPI central dinámico (total acumulado + conteo de transacciones en reposo mutando a clasificación activa, monto y porcentaje exacto en hover), terminaciones redondeadas (`cornerRadius={6}`, `paddingAngle={4}`), expansión de sector activo con `renderActiveShape` (Recharts) y leyenda interactiva bidireccional enriquecida con pastillas de porcentaje precalculado.
  4. **Micro-Dinamismo:** Halo perimetral pulsante en `<MasterBalanceHero />` (esmeralda, carmesí o cian según balance neto), deslizamiento pulsante en flecha de dirección financiera y doble anillo radar (`animate-ping`) en el indicador de Webhook en `<HeaderBar />`.
* **ADR-023 (Especificación Técnica de Adaptabilidad y Experiencia Mobile-First):** Se formalizó en [`docs/ui/SPEC_MOBILE_RESPONSIVE_REDESIGN.md`](./ui/SPEC_MOBILE_RESPONSIVE_REDESIGN.md) la arquitectura mobile-first para smartphones (360px a 430px) organizada en la Fase 9 (`UI-25` a `UI-31`):
  1. **Table-to-Card Feed Híbrido:** En pantallas `<sm`, sustitución completa del scroll horizontal de `TransactionsTable` por un feed de tarjetas de transacciones táctiles.
  2. **Grilla 2x2 para Métricas:** Reducción del vertical sprawl mediante grilla simétrica de 2x2 para las métricas secundarias.
  3. **Cápsula Flotante Inferior (`MobileBottomDock`):** Barra fija de acciones en la zona del pulgar (`Sync`, `Telegram`, `Lock`) con `pb-28`.
  4. **Optimización de Login:** Altura dinámica con `100dvh` para evitar saltos con el teclado virtual e `inputMode="numeric"`.
  5. **Touch Ergonomics y Safe Areas:** Utilidades `pb-safe`, `touch-action: manipulation` y `overflow-x: hidden`.

* **ADR-024 (Implementación de Experiencia Mobile-First, Card Feed Híbrido y Dock Flotante Inferior):** Siguiendo `SPEC_MOBILE_RESPONSIVE_REDESIGN.md`, se ejecutó y validó la Fase 9 completa (`UI-25` a `UI-31`):
  1. **Tokens y Safe Areas (`UI-25`):** Inclusión de `touch-action: manipulation`, utilidades `.pb-safe` y `.pt-safe`, y bloqueo estricto de desborde horizontal (`overflow-x: hidden`).
  2. **Grilla 2x2 para Métricas (`UI-26`):** Reorganización de las 4 tarjetas secundarias en `grid-cols-2 lg:grid-cols-4` con padding compacto (`p-3.5 sm:p-5`) y tipografía tabular elástica.
  3. **Table-to-Card Feed Híbrido (`UI-27`):** En `<sm`, `TransactionsTable` muta automáticamente a una lista de tarjetas táctiles de gastos (`block sm:hidden`), eliminando el scroll horizontal mientras mantiene la tabla completa de 6 columnas en desktop (`hidden sm:block`).
  4. **Cápsula Flotante Inferior de Navegación (`UI-28`):** Montaje de `MobileBottomDock` (`fixed bottom-4 inset-x-4 sm:hidden z-40 pb-safe`) con botones táctiles de 44px para Actualizar saldo, acceso al bot de Telegram y Bloqueo de sesión. Separación de pantalla con `pb-28 sm:pb-20` en el contenedor principal.
  5. **Touch Ergonomics en Analítica (`UI-29`):** Adaptabilidad proporcional en Donut Chart (`w-24 h-24 sm:w-28 sm:h-28`, innerRadius 58, outerRadius 78), intervalo elástico en eje X de `AreaChart` y filas de desglose con altura táctil mínima de 44px y soporte de tap directo.
  6. **Login Mobile sin Saltos (`UI-30`):** Reemplazo de `min-h-screen` por `min-h-[100dvh]` y activación de teclado numérico nativo con `inputMode="numeric"` y `pattern="[0-9]*"`.
  7. **Verificación Integral (`UI-31`):** Validación en viewports de 360px a 430px (iPhone SE, iPhone 14 Pro, Samsung Galaxy) con cero desborde horizontal.

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
- [x] Actualización de Motor a Gemini 3.6 Flash y Cadena de Resiliencia Multimodelo (ADR-020).
- [x] Ingestión Multimodal Telegram Completa (Fase 6 - ADR-021).
- [x] Living UI, Atmósfera Dinámica, Login Elevado y Donut Chart Interactivo (Fase 7 - ADR-022).
- [x] Especificación e Implementación Mobile-First y Card Feed Híbrido (Fase 9 - ADR-023 y ADR-024).

---

## 5. Próxima Acción Inmediata
Fase 9 concluida al 100%. El siguiente sprint operativo corresponde a las tareas de arnés de pruebas multimodal local en terminal (`MULTI-03` a `MULTI-06`), o revisión / merge de la rama `feat/mobile-responsive-ui` hacia `dev`.
