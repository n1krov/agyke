# STATUS.md - Bitácora Viva del Proyecto Agyke

> **Propósito:** Este documento es la memoria técnica y el estado de situación en tiempo real de Agyke. En cada interacción o cambio en el repositorio, este archivo se consulta y actualiza para garantizar alineación absoluta con la metodología **Spec-Driven Development (SDD)**.

---

## 1. Identificación y Estado de Git
* **Fecha de corte:** 27 de Octubre de 2026.
* **Rama Activa:** `feat/settings-tags-and-transaction-detail` (creada a partir de `dev`).
* **Rama Base:** `dev` (`e79a83c`) | **Rama de Producción:** `master` (`695211e`).
* **Último Commit:** `e79a83c` (Merge pull request #22 from n1krov/feat/analytics-fidelity-and-interaction-chart).

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
| **Tablero de Agente (`docs/board.json`)** |  Listo | Schema 2020-12 | Tablero JSON de 60 tareas completadas (88.2%), verificado con `npm run board`. |
| **Ingestión Multimodal Bot (`src/bot/`)** |  Listo | 13 tests (unit + int) | Canalización de Notas de Voz, Comprobantes e Imágenes y Facturas PDF en Telegram. |
| **Centro de Analítica (`/analytics`)** |  Listo | 4 gráficos Recharts | Cortes mensuales (?month=YYYY-MM), variación MoM, paridad A vs B y Command Center. |
| **Muro Agyke (`/muro`)** |  Listo | Auditoría Gemini | Desacoplado del Dashboard, filtros de estado/origen y micro-pill interactiva en Header. |
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
* **ADR-023 (Especificación Técnica de Adaptabilidad y Experiencia Mobile-First):** Se formalizó en [`docs/ui/SPEC_MOBILE_RESPONSIVE_REDESIGN.md`](./ui/SPEC_MOBILE_RESPONSIVE_REDESIGN.md) la arquitectura mobile-first para smartphones (360px a 430px) organizada en la Fase 9 (`UI-25` a `UI-31`).
* **ADR-024 (Implementación de Experiencia Mobile-First, Card Feed Híbrido y Dock Flotante Inferior):** Siguiendo `SPEC_MOBILE_RESPONSIVE_REDESIGN.md`, se ejecutó y validó la Fase 9 completa (`UI-25` a `UI-31`): tokens mobile, grilla 2x2 para métricas secundarias, feed de tarjetas híbrido, cápsula flotante inferior de navegación, adaptación de gráficos y login sin saltos por teclado con `100dvh`.
* **ADR-025 (Especificación de Analítica Mensual, Command Center y Desacople del Muro Agyke):** Se formalizó en [`docs/ui/SPEC_ANALYTICS_MONTHLY_AND_QUEUE_SEPARATION.md`](./ui/SPEC_ANALYTICS_MONTHLY_AND_QUEUE_SEPARATION.md) la arquitectura de la Fase 10 (`UI-32` a `UI-37`).
* **ADR-026 (Implementación de Analítica Mensual con Cortes Temporales, Command Center Panorámico, Muro Dedicado y Navegación Global Unificada):** Siguiendo `SPEC_ANALYTICS_MONTHLY_AND_QUEUE_SEPARATION.md`, se ejecutó y validó la Fase 10 completa (`UI-32` a `UI-37`):
  1. **Endpoint de Cortes Mensuales (`UI-32`):** Implementación de `GET /api/analytics?month=YYYY-MM` con filtrado estricto por fechas UTC, variación porcentual MoM frente al mes previo, paridad de desembolso Usuario A vs B, serie diaria acumulada (días 1 al 31) e intensidad de gasto por día de la semana.
  2. **Página Dedicada `/analytics` y Recharts Suite (`UI-33`, `UI-34`, `UI-35`):** Creación del Command Center con selector de períodos navegable `[ ‹ ] Mes [ › ]`, dropdown de historial, botón a mes actual y fullscreen. 4 KPIs monumentales de impacto financiero y 4 gráficos Recharts (AreaChart acumulado, BarChart head-to-head, Donut interactivo de clasificación con gauge central y BarChart de intensidad semanal), además del Top 5 de mayores gastos del mes.
  3. **Página Dedicada `/muro` y Desacople del Dashboard (`UI-36`):** Desincorporación de `<QueueViewer />` del pie de `page.tsx` para una experiencia limpia en `/`. Creación de `/muro` con vista completa de auditoría de `agyke_queue` de Gemini, métricas de cola (Total, Pendientes, Procesados, Descartados), filtros por estado y por origen (Audio, Foto/Ticket, Texto libre) y banner de guía hacia Telegram.
  4. **Navegación Global Unificada (`UI-37`):** Integración de navegación por pills en `HeaderBar.tsx` (`Inicio`, `Analítica`, `Muro`) con micro-pill pulsante ante ítems pendientes, y dock móvil táctil en `MobileBottomDock.tsx` con soporte de safe areas y estilos Obsidian Slate activos.
* **ADR-027 (Resolución de Reglas ESLint 9 / React 19 y Prevención de Cascading Renders en Hooks):** Para cumplir con el estándar de CI de cero advertencias y cero errores en Next.js 16 / React 19 (`react-hooks/set-state-in-effect`), se realizaron los siguientes ajustes arquitecturales:
  1. **Desacople de setState Síncrono en Efectos:** Se reemplazó la invocación directa de `fetchAnalytics()` y `fetchData()` dentro del cuerpo de `useEffect` en `/analytics` y `/muro`. Se implementaron runners asíncronos desacoplados (`initAnalytics` e `initMuro`) con bandera booleana `ignore` de descarte para evitar llamadas a `setLoading(true)` síncronas durante el ciclo de montaje y proteger contra condiciones de carrera al desmontar componentes.
  2. **Limpieza de Símbolos Huérfanos:** Se eliminó la constante `PIE_COLORS` no utilizada en `web/src/app/analytics/page.tsx` y los imports no utilizados `AlertCircle`, `RefreshCw` y `User` junto con el estado huérfano `users` en `web/src/app/muro/page.tsx`.
* **ADR-028 (Transición hacia Editorial Financial Craft, Dual Theme Claro/Oscuro y Purga de Anti-Patterns IA Dev):** Se formalizó en [`docs/ui/SPEC_EDITORIAL_DESIGN_SYSTEM_AND_DUAL_THEME.md`](./ui/SPEC_EDITORIAL_DESIGN_SYSTEM_AND_DUAL_THEME.md) la especificación arquitectural para una refundación visual profunda de Agyke:
  1. **Purga de Anti-Patterns "AI Dev":** Erradicación total de orbes de gradiente borrosos (`blur-[120px]`), mallas artificiales (`bg-grid-mesh`), cajas de iconos genéricos de colores pastel y glassmorphism plástico brillante.
  2. **Filosofía Editorial Financial Craft:** Inspirada en Linear, Stripe Press y Vercel Design System, basada en tipografía de alta jerarquía (`Geist Sans` y `Geist Mono` tabular), micro-bordes hairline de 1px y elevaciones limpias.
  3. **Sistema Dual Theme Nativo (Claro / Oscuro):** Implementación de variables semánticas CSS en `globals.css` para `:root` y `.dark`, persistencia de tema en `localStorage`, script inline en `<head>` para blindaje estricto Anti-FOUC (sin destellos al recargar) y componente `ThemeToggle` integrado en `HeaderBar` y `MobileBottomDock`.
  4. **Iconografía con Criterio de Autor:** Supresión de icon-spam en tarjetas métricas (`StatMetricCard`), reservando íconos exclusivamente para acciones funcionales e interactivas con trazo estilizado.
* **ADR-029 (Sincronización Estricta de Lockfile CI, Hashes de Integridad SHA-512 y useSyncExternalStore):** Para asegurar la ejecución en verde del pipeline de CI (`.github/workflows/ci.yml`), se realizaron las siguientes correcciones arquitecturales:
  1. **Prevención de Cascading Renders en ThemeToggle:** Se reemplazó el `useEffect` con `setMounted(true)` por `useSyncExternalStore` nativo de React 19, permitiendo suscripción segura a eventos de tema (`window.addEventListener('agyke-theme-change')`) y SSR sin descalibrar el render inicial. Se eliminó además el parámetro huérfano `index` en `AnalyticsSection.tsx`.
  2. **Sincronización de Lockfile y Checksums de Integridad:** Se corrigió la discrepancia en `package-lock.json` y `package.json`, realineando estrictamente `tsx` (`^4.23.1`), `typescript` (`^5.7.2`), `@types/node` (`^22.10.0`) y `undici-types` (`~6.20.0`) con sus checksums SHA-512 canónicos del registro de npm, erradicando los errores `EINTEGRITY` y `EUSAGE` durante el paso `npm ci`.
* **ADR-030 (Especificación de Fidelidad en Gráficos de Analítica, Desembolso Crudo Cara a Cara y Línea Temporal de Interacción):** Se formalizó en [`docs/ui/SPEC_ANALYTICS_CHARTS_AUDIT_AND_TEMPORAL_INTERACTION.md`](./ui/SPEC_ANALYTICS_CHARTS_AUDIT_AND_TEMPORAL_INTERACTION.md):
  1. **Clarificación Conceptual del Cara a Cara:** Se redefine la métrica para responder estrictamente *"Quién puso más plata este mes en gastos compartidos (50/50)"*, comparando montos en crudo sin fórmulas de deuda ni distorsiones de gastos personales (`0`) o favores (`-100`).
  2. **Nuevo Gráfico de Interacción Temporal (LineChart de 2 Líneas):** Se modela una serie temporal continua a lo largo del mes (días 1 al último día) que mide la actividad de carga y volumen total de dinero registrado en Agyke por cada usuario, abarcando todas las categorías para analizar la dinámica de uso con el bot.
  3. **Auditoría Integral de Gráficos:** Revisión y rotulado inequívoco de la velocidad de gasto acumulada, donut de clasificaciones, intensidad por día de la semana y top 5 compras.
* **ADR-031 (Especificación de Perfiles de Usuarios Vinculados con Alias Web, Detalle Expandido de Transacciones y Gestor ABM de Etiquetas en `/settings`):** Se formalizaron las 3 especificaciones que conforman la **Fase 13 (`UI-52` a `UI-58`)**:
  1. **Perfiles Vinculados, Última Actividad y Alias Web (`docs/ui/SPEC_USER_PROFILES_AND_ALIASES.md`):** Ampliación de la tabla `users` con `alias TEXT NULL`. Cálculo de última actividad de cada usuario a partir de su último gasto registrado en `transactions`. Regla estricta de alcance: el `alias` reemplaza al nombre en toda la interfaz Web (`getUserDisplayName`), manteniendo intacto el `name` original de Telegram dentro del bot.
  2. **Detalle Extra de Gasto y Etiquetado Múltiple en Vivo (`docs/ui/SPEC_TRANSACTION_DETAIL_AND_TAGGING.md`):** Componente `<TransactionDetailDrawer />` (Modal/Drawer lateral editorial sin recarga de página) que permite inspeccionar todos los campos auditados de un gasto y asignar/quitar múltiples etiquetas en vivo mediante relación `N:M` (`transaction_tags`).
  3. **Centro Unificado `/settings` y ABM de Etiquetas (`docs/ui/SPEC_SETTINGS_HUB_AND_TAGS_CRUD.md`):** Ruta unificada `/settings` con navegación por pestañas (`Usuarios y Perfiles` y `Etiquetas`), accesible desde `HeaderBar` y `MobileBottomDock`, con CRUD completo de etiquetas (`tags`: listar con `usage_count`, crear, editar nombre/color semántico y eliminar).

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
- [x] Especificación de Analítica Mensual, Command Center y Desacople del Muro (Fase 10 - ADR-025).
- [x] Implementación de Analítica Mensual, Command Center, Muro Dedicado y Navegación Global (Fase 10 - ADR-026).
- [x] Corrección de Reglas ESLint y Hooks en /analytics y /muro (UI-38 - ADR-027).
- [x] Especificación de Rediseño Editorial "Financial Craft", Dual Theme y Purga IA Dev (Fase 11 - ADR-028 en `docs/ui/SPEC_EDITORIAL_DESIGN_SYSTEM_AND_DUAL_THEME.md`).
- [x] Implementación Completa de Rediseño Editorial y Dual Theme (UI-39 a UI-46).
- [x] Sincronización Estricta de Lockfile CI y Hashes SHA-512 Oficiales (ADR-029).
- [x] Especificación e Implementación Completa de Fase 12: Fidelidad Analítica, Desembolso Crudo Cara a Cara y Gráfico Temporal de Interacción (UI-47 a UI-51 - ADR-030).
- [x] Especificación Técnica de Fase 13: Perfiles y Alias, Detalle de Gasto y Centro de Configuración / ABM de Etiquetas (UI-52 - ADR-031).
- [x] Implementación Completa de Fase 13 (`UI-53` a `UI-58` - ADR-031): Esquema SQL (`users.alias`, `tags`, `transaction_tags`), endpoints `/api/users`, `/api/tags`, `/api/transactions/[id]/tags`, componente `<TransactionDetailDrawer />`, `<TagBadge />`, página `/settings` y suite de tests `settings-and-tags.test.ts`.

### Pendientes del Roadmap
- [ ] Tareas Multimodales restantes (`MULTI-03` a `MULTI-06`: Timeouts, fixtures y script CLI).
- [ ] Backlog Arquitectural pospuesto (`UI-21` a `UI-24`).

---

## 5. Próxima Acción Inmediata
Realizar commit de la Fase 13 (`UI-52` a `UI-58`) en `feat/settings-tags-and-transaction-detail`, ejecutar la migración SQL de `alias`, `tags` y `transaction_tags` en Supabase y fusionar a `dev`.
