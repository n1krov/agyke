# ROADMAP_UI.md - Plan de Implementación del Rediseño Visual

Este documento desglosa el plan de ejecución atómico para implementar el nuevo sistema de diseño de **Agyke** bajo la metodología **Spec-Driven Development (SDD)**.

---

## Fases de Implementación

### Fase 1: Base de Tokens y Estilos Globales
- [ ] **Tarea UI-1:** Actualizar `web/src/app/globals.css` con los tokens semánticos de `@theme` (paleta *Obsidian Slate*, radios, fuentes y utilidades glassmorphism).
- [ ] **Tarea UI-2:** Validar fuentes y tipografía con variantes `tabular-nums` para montos financieros.

### Fase 2: Componentes Atómicos Reutilizables
- [ ] **Tarea UI-3:** Crear `<BadgeClassification />` para renderizar con consistencia las 4 clasificaciones (`50`, `100`, `-100`, `0`).
- [ ] **Tarea UI-4:** Crear componente `<UserAvatar />` con iniciales coloreadas dinámicamente según el ID del usuario.
- [ ] **Tarea UI-5:** Crear `<StatCard />` para las 4 métricas del grid superior.

### Fase 3: Master Balance Hero (KPI Principal)
- [ ] **Tarea UI-6:** Implementar `<MasterBalanceHero />` con visualización clara de quién le debe a quién, flujo de flechas y estados de balance (positivo, negativo o saldado).
- [ ] **Tarea UI-7:** Añadir micro-indicador de estado en tiempo real del Webhook en la barra superior (`<HeaderBar />`).

### Fase 4: Tabla Interactiva y Filtros
- [ ] **Tarea UI-8:** Implementar barra de búsqueda reactiva y chips de filtrado rápido por clasificación.
- [ ] **Tarea UI-9:** Refactorizar la tabla de transacciones para mostrar montos tabulares, impacto financiero coloreado y fechas formateadas.
- [ ] **Tarea UI-10:** Crear estado vacío ilustrado (`EmptyState`) cuando los filtros no arrojen resultados.

### Fase 5: Gráficos Recharts y Muro Agyke
- [ ] **Tarea UI-11:** Rediseñar el gráfico de evolución temporal con gradientes suaves y tooltips oscuros personalizados.
- [ ] **Tarea UI-12:** Implementar donut chart para distribución de gastos por clasificación.
- [ ] **Tarea UI-13:** Integrar el visor de la cola de Agyke (`<QueueSection />`) para audios y comprobantes de Gemini.

### Fase 6: Verificación Integral y Responsive
- [ ] **Tarea UI-14:** Comprobar adaptabilidad mobile (iPhone / Android) y desktop.
- [ ] **Tarea UI-15:** Correr `npm run lint` y `npm run build` para garantizar cero errores de TypeScript y compilación en verde.
