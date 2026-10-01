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
6. [`ROADMAP_UI.md`](./ROADMAP_UI.md):
   * Plan de ejecución estructurado en fases atómicas bajo la metodología Spec-Driven Development (SDD).
