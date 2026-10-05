# ROADMAP_UI.md - Plan de Implementación del Rediseño Visual

Este documento desglosa el plan de ejecución atómico para implementar el sistema de diseño y las evoluciones visuales de **Agyke** bajo la metodología **Spec-Driven Development (SDD)**.

---

## Fases de Implementación

### Fase 1: Base de Tokens y Estilos Globales
- [x] **Tarea UI-1:** Actualizar `web/src/app/globals.css` con los tokens semánticos de `@theme` (paleta *Obsidian Slate*, radios, fuentes y utilidades glassmorphism).
- [x] **Tarea UI-2:** Validar fuentes y tipografía con variantes `tabular-nums` para montos financieros.

### Fase 2: Componentes Atómicos Reutilizables
- [x] **Tarea UI-3:** Crear `<BadgeClassification />` para renderizar con consistencia las 4 clasificaciones (`50`, `100`, `-100`, `0`).
- [x] **Tarea UI-4:** Crear componente `<UserAvatar />` con iniciales coloreadas dinámicamente según el ID del usuario.
- [x] **Tarea UI-5:** Crear `<StatCard />` para las 4 métricas del grid superior (`<StatMetricCard />`).

### Fase 3: Master Balance Hero (KPI Principal)
- [x] **Tarea UI-6:** Implementar `<MasterBalanceHero />` con visualización clara de quién le debe a quién, flujo de flechas y estados de balance (positivo, negativo o saldado).
- [x] **Tarea UI-7:** Añadir micro-indicador de estado en tiempo real del Webhook en la barra superior (`<HeaderBar />`).

### Fase 4: Tabla Interactiva y Filtros
- [x] **Tarea UI-8:** Implementar barra de búsqueda reactiva y chips de filtrado rápido por clasificación.
- [x] **Tarea UI-9:** Refactorizar la tabla de transacciones para mostrar montos tabulares, impacto financiero coloreado y fechas formateadas (`<TransactionsTable />`).
- [x] **Tarea UI-10:** Crear estado vacío ilustrado (`EmptyState`) cuando los filtros no arrojen resultados.

### Fase 5: Gráficos Recharts y Muro Agyke
- [x] **Tarea UI-11:** Rediseñar el gráfico de evolución temporal con gradientes suaves y tooltips oscuros personalizados (`<AnalyticsSection />`).
- [x] **Tarea UI-12:** Implementar donut chart para distribución de gastos por clasificación (`<AnalyticsSection />`).
- [x] **Tarea UI-13:** Integrar el visor de la cola de Agyke (`<QueueViewer />`) para audios y comprobantes de Gemini.

### Fase 6: Verificación Integral y Responsive
- [x] **Tarea UI-14:** Comprobar adaptabilidad mobile (iPhone / Android) y desktop.
- [x] **Tarea UI-15:** Modularizar completamente `web/src/app/page.tsx` sin deuda técnica.

---

### Fase 7: Interfaz Viva, Dinamismo de Fondo, Login Elevado y Gráfico de Tarta Interactivo (`SPEC_LIVING_UI_MOTION_AND_LOGIN.md`)
- [x] **Tarea UI-16:** Implementar orbes luminosos dinámicos multicapa y keyframes de deriva suave (`ambient-float-slow`, `ambient-float-reverse`) en `globals.css` y canvas principal.
- [x] **Tarea UI-17:** Rediseñar la pantalla `/login` con entrada animada, efecto de sacudida (`shake-x`) ante PIN incorrecto, haz de luz (*shimmer*) en botón de desbloqueo e isotipo con halo de respiración.
- [x] **Tarea UI-18:** Revolucionar el gráfico de tarta en `<AnalyticsSection />` a un **Donut Interactivo con KPI Central**:
  - Centro dinámico que exhibe el gasto total acumulado en reposo y muta a la clasificación activa con porcentaje en hover.
  - Expansión radial del segmento activo (`ActiveShape`).
  - Leyenda enriquecida con chips de porcentaje (`%`) calculados en tiempo real.
- [x] **Tarea UI-19:** Incorporar micro-animaciones en `<MasterBalanceHero />` (halo de respiración perimetral según saldo deudor/acreedor) y radar pulsante en `<HeaderBar />`.
- [x] **Tarea UI-20:** Pruebas de rendimiento y verificación visual (60 FPS, aceleración por hardware, cero saltos de layout).

---

### Fase 8: El Gran Dashboard Fullscreen (Command Center) (`SPEC_GRAN_DASHBOARD_FULLSCREEN.md`)
> **Estado:** ⏳ **PENDIENTE / BACKLOG ARQUITECTURAL** (A la espera de ampliación de esquema de datos en Supabase).
- [ ] **Tarea UI-21 (Pendiente):** Migración SQL para nuevos campos contables (`category`, `payment_method`, `tags` y tabla `budgets`).
- [ ] **Tarea UI-22 (Pendiente):** Creación de la vista dedicada a pantalla completa `/analytics` con layout 100vh / 100vw responsivo.
- [ ] **Tarea UI-23 (Pendiente):** Integración de Screen Wake Lock API y Fullscreen API para modo Kiosk / Smart TV continuo.
- [ ] **Tarea UI-24 (Pendiente):** Visualizaciones avanzadas: Treemap de categorías, Comparativa de volumen A vs B y Velocidad semanal de gasto.

---

### Fase 9: Adaptabilidad y Experiencia Mobile-First (`SPEC_MOBILE_RESPONSIVE_REDESIGN.md`)
- [x] **Tarea UI-25 (MOB-01):** Configuración de utilidades mobile, safe areas y `touch-action: manipulation` en `globals.css`.
- [x] **Tarea UI-26 (MOB-02):** Grilla 2x2 simétrica para métricas secundarias en smartphones (`StatMetricCard.tsx`, `page.tsx`).
- [x] **Tarea UI-27 (MOB-03):** Rediseño dual de `TransactionsTable.tsx` (Table en desktop vs Transaction Card Feed en smartphones).
- [x] **Tarea UI-28 (MOB-04):** Cápsula flotante inferior de navegación táctil en mobile (`MobileBottomDock.tsx`, `page.tsx`).
- [x] **Tarea UI-29 (MOB-05):** Adaptabilidad táctil en `AnalyticsSection.tsx` (Donut móvil, targets táctiles de 44px en desglose y eje X elástico).
- [x] **Tarea UI-30 (MOB-06):** Optimización de autenticación mobile con altura dinámica `100dvh` e `inputMode="numeric"` en `/login`.
- [x] **Tarea UI-31 (MOB-07):** Verificación integral de responsividad y touch ergonomics en viewports de 360px a 430px.
