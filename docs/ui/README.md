# Carpeta docs/ui/ - Especificaciones de Interfaz de Usuario y Experiencia (UI/UX)

Esta carpeta contiene la documentación oficial, modelado y especificaciones técnicas para el diseño e innovaciones visuales del sistema **Agyke** (Next.js 16 + Tailwind CSS v4).

---

## Índice de Documentos de UI/UX

1. [`DESIGN_SYSTEM_SPEC.md`](./DESIGN_SYSTEM_SPEC.md):
   * Visión de diseño, filosofía *Fintech Premium*, wireframe mental y principios UX (legibilidad en 3 segundos).
2. [`TOKENS_AND_PALETTE.md`](./TOKENS_AND_PALETTE.md):
   * Paleta cromática semántica (*Obsidian Dark Canvas*), tokens de balance, badges para los 4 botones (`50`, `100`, `-100`, `0`), escala tipográfica y números tabulares.
3. [`COMPONENTS_SPEC.md`](./COMPONENTS_SPEC.md):
   * Anatomía y estados de cada componente: `<HeaderBar />`, `<MasterBalanceHero />`, `<StatMetricCard />`, `<AnalyticsSection />`, `<TransactionsTable />`, `<QueueViewer />` y tarjeta `/login`.
4. [`SPEC_LIVING_UI_MOTION_AND_LOGIN.md`](./SPEC_LIVING_UI_MOTION_AND_LOGIN.md):
   * Especificación de fondo animado con orbes dinámicos de baja frecuencia (Pure CSS GPU), elevación táctil de la pantalla de login con micro-animaciones (efecto de sacudida ante error) y revolución del gráfico de tarta a Donut Interactivo con KPI central dinámico y leyenda con porcentajes.
5. [`SPEC_GRAN_DASHBOARD_FULLSCREEN.md`](./SPEC_GRAN_DASHBOARD_FULLSCREEN.md):
   * Especificación técnica del **Gran Dashboard** a pantalla completa (100vh / 100vw, Kiosk Mode para Smart TV o monitores de alta densidad). *Estado: Pendiente / Backlog arquitectural a la espera de ampliación de esquema de datos*.
6. [`SPEC_MOBILE_RESPONSIVE_REDESIGN.md`](./SPEC_MOBILE_RESPONSIVE_REDESIGN.md):
   * Arquitectura Mobile-First (360px-430px), feed híbrido de tarjetas y cápsula flotante inferior (`MobileBottomDock`).
7. [`SPEC_ANALYTICS_MONTHLY_AND_QUEUE_SEPARATION.md`](./SPEC_ANALYTICS_MONTHLY_AND_QUEUE_SEPARATION.md):
   * Cortes mensuales (`?month=YYYY-MM`), Command Center `/analytics` y página dedicada `/muro`.
8. [`SPEC_EDITORIAL_DESIGN_SYSTEM_AND_DUAL_THEME.md`](./SPEC_EDITORIAL_DESIGN_SYSTEM_AND_DUAL_THEME.md):
   * Filosofía *Editorial Financial Craft*, sistema Dual Theme (Claro/Oscuro) con script Anti-FOUC y purga de anti-patterns IA Dev.
9. [`SPEC_ANALYTICS_CHARTS_AUDIT_AND_TEMPORAL_INTERACTION.md`](./SPEC_ANALYTICS_CHARTS_AUDIT_AND_TEMPORAL_INTERACTION.md):
   * Desembolso en crudo Cara a Cara (50/50) y gráfico temporal de interacción de 2 líneas.
10. [`SPEC_USER_PROFILES_AND_ALIASES.md`](./SPEC_USER_PROFILES_AND_ALIASES.md):
   * Perfiles de usuarios vinculados, cálculo de última actividad a partir del último gasto y sistema de Alias con alcance Web exclusivo.
11. [`SPEC_TRANSACTION_DETAIL_AND_TAGGING.md`](./SPEC_TRANSACTION_DETAIL_AND_TAGGING.md):
   * Drawer/Modal lateral editorial de detalle extra de gasto y asignación en vivo de múltiples etiquetas (`N:M`).
12. [`SPEC_SETTINGS_HUB_AND_TAGS_CRUD.md`](./SPEC_SETTINGS_HUB_AND_TAGS_CRUD.md):
   * Centro unificado de configuración (`/settings`) con pestañas y gestor ABM completo de etiquetas (`Tags`).
13. [`ROADMAP_UI.md`](./ROADMAP_UI.md):
   * Plan de ejecución estructurado en fases atómicas bajo la metodología Spec-Driven Development (SDD).
