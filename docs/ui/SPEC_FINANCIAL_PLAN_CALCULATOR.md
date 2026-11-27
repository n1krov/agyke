# SPEC_FINANCIAL_PLAN_CALCULATOR.md - Especificación de la Calculadora de Plan Financiero (`/plan`)

> **Estado:** Aprobado / Listo para Implementación (Fase 14)  
> **Área:** Core (`src/services/financial-plan.ts`, `src/types/financial-plan.ts`), Base de Datos (`supabase/schema.sql`), Backend (`web/src/app/api/plan/`) & Frontend (`web/src/app/plan/`, `web/src/components/plan/`)  
> **Rama de Desarrollo:** `feat/salary-calculator`  
> **Tecnologías:** Next.js 16 (App Router), TypeScript estricto, Supabase PostgreSQL, Tailwind CSS v4 (Dual Theme Editorial), Node Test Runner (`node:test`)  
> **Objetivo:**  
> Integrar en Agyke la calculadora interactiva de planificación financiera salarial (originada en `plan-financiero.html`) como una vista dedicada **`/plan`**, 100% standalone (independiente de las transacciones compartidas), respetando con exactitud el motor matemático real en pesos de hoy, adaptándola al sistema visual **Editorial Financial Craft (Claro/Oscuro)** con micro-animaciones fluidas y persistencia híbrida (**Supabase + caché `localStorage`**) sincronizada entre escritorio y móvil.

---

## 1. Principios de Diseño y Alcance

1. **Fidelidad Matemática Absoluta (Pesos Reales de Hoy):**
   * Todos los cálculos se expresan en pesos de poder adquisitivo actual, utilizando rendimiento **real** anual (por encima de la inflación).
   * El motor matemático reside como módulo puro y sin dependencias de DOM en [`src/services/financial-plan.ts`](../../src/services/financial-plan.ts) y es consumido tanto por la suite de pruebas (`npm test`) como por la app web vía `@/shared/services/financial-plan`.
2. **Operación Standalone:**
   * La vista `/plan` no cruza datos ni modifica `transactions`, `balances` ni `agyke_queue`. Su dominio de datos es completamente independiente.
3. **Persistencia Híbrida Sincronizada (Supabase + `localStorage`):**
   * Hidratación instantánea desde `localStorage` (`agyke:plan-financiero:v1`) para render inmediato sin parpadeo.
   * Sincronización bidireccional contra Supabase (`GET /api/plan` y `PUT /api/plan` con debounce de `700ms`) para compartir el plan entre computadora y smartphone.
   * Resiliencia ante tabla no migrada (`42P01` / `PGRST205`) o modo sin conexión: la calculadora sigue funcionando al 100% con almacenamiento local y exhibe un indicador discreto del estado de sincronización.
4. **Identidad Editorial + Animaciones con Criterio:**
   * Adopta los tokens semánticos de Agyke (`--canvas`, `--surface`, `--surface-subtle`, `--border-hairline`, `Geist Sans`, `Geist Mono` con `tabular-nums`, modo Claro/Oscuro).
   * Suma animaciones sobrias aceleradas por GPU (entrada escalonada, interpolación suave de montos, barra de reparto elástica con highlight cruzado, pulso sutil en hito activo, acordeón fluido y scrubber táctil a 60 FPS), desactivables automáticamente bajo `prefers-reduced-motion: reduce`.

---

## 2. Evolución del Esquema de Base de Datos (`supabase/schema.sql`)

Se incorpora la tabla `financial_plans` con migración idempotente:

```sql
-- Configuración Persistente del Plan Financiero (/plan)
CREATE TABLE IF NOT EXISTS financial_plans (
    id TEXT PRIMARY KEY DEFAULT 'default',
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

* **`id`**: Clave de texto con valor `'default'` para el plan activo (estructura extensible a múltiples escenarios o planes por usuario en el futuro sin cambios destructivos).
* **`config`**: Objeto JSON validado que almacena `FinancialPlanInputs`.
* **`updated_at`**: Marca temporal UTC utilizada para mostrar última sincronización y resolver precedencia entre caché local y nube.

---

## 3. Contratos TypeScript y Motor Matemático (`src/types/financial-plan.ts` y `src/services/financial-plan.ts`)

### 3.1 Tipos de Entrada y Salida

```ts
export type PlanBase = 'sueldo' | 'gastos';
export type HitoId = 'colchon' | 'fondo' | 'libertad';
export type HitoState = 'done' | 'active' | 'locked';

export interface FinancialPlanInputs {
  sueldo: number;       // Sueldo neto mensual en ARS (default: 2_250_000)
  gustosPct: number;    // % del sueldo para gustos (0..60, clamped a 100 - invPct; default: 20)
  invPct: number;       // % del sueldo para inversión (0..50; default: 10)
  sobrantePct: number;  // % extra del sueldo ahorrado desde sobrante (0..30; default: 10)
  base: PlanBase;       // 'sueldo' | 'gastos' (default: 'sueldo')
  mesesColchon: number; // Hito 1 (1..24, clamped <= mesesFondo; default: 3)
  mesesFondo: number;   // Hito 2 (1..36; default: 6)
  mesesMeta: number;    // Hito 3 (12..600; default: 300 = regla del 4%)
  rend: number;         // Rendimiento real anual % (UI 0..12, motor -5..30; default: 5)
  anios: number;        // Horizonte en años (UI 5..50, motor 1..80; default: 38)
  fondoActual: number;  // Capital ya acumulado en fondo de emergencia (default: 0)
  investActual: number; // Capital ya invertido a largo plazo (default: 0)
}
```

### 3.2 Reglas e Invariantes del Motor (`calculatePlan`)

1. **Reparto Mensual:**
   * `invPct = clamp(invPct, 0, 100)`
   * `gustosPct = clamp(gustosPct, 0, 100 - invPct)`
   * `fijosPct = 100 - invPct - gustosPct` (invariante: `fijosPct + gustosPct + invPct === 100`)
   * `fijos = sueldo * fijosPct / 100`, `gustos = sueldo * gustosPct / 100`, `inversion = sueldo * invPct / 100`, `sobrante = sueldo * sobrantePct / 100`
   * `aporte = inversion + sobrante` (ahorro mensual total)
   * `gastos = fijos + gustos`
   * `baseMonto = base === 'gastos' ? gastos : sueldo`
2. **Objetivos Financieros:**
   * `colchonTarget = mesesColchon * baseMonto`
   * `fondoTarget = mesesFondo * baseMonto`
   * `meta = mesesMeta * baseMonto`
3. **Simulación Mes a Mes (`simulatePlan`, hasta `80 * 12 = 960` meses):**
   * Tasa mensual equivalente: `g = Math.pow(1 + rend / 100, 1 / 12)`.
   * En cada mes `m = 1..months`:
     1. El capital invertido capitaliza: `inv *= g`.
     2. Si `fondo < fondoTarget - 0.5`, se asigna `add = Math.min(aporte, fondoTarget - fondo)` al fondo de emergencia (`fondo += add`).
     3. El remanente `aporte - add` ingresa a inversión (`inv += aporte - add`).
     4. Se registran los primeros meses `mColchon`, `mFondo`, `mMeta` en que se supera cada objetivo.
   * La serie anual `yearly` toma `series[i * 12]` para `i = 0..anios`.
4. **Aporte Necesario (`aporteNecesario`):**
   * Si `meta <= 0`: `null`.
   * Si con aporte `0` el capital inicial capitalizado ya alcanza `meta` en `anios * 12` meses: `0`.
   * En caso contrario, búsqueda binaria (bisección de 50 iteraciones) sobre `simulatePlan` hasta hallar el aporte mensual mínimo necesario.
5. **Máquina de Estados de Hitos:**
   * `colchon`: `'done'` si `fondoActual >= colchonTarget - 0.5`, si no `'active'`.
   * `fondo`: `'done'` si `fondoActual >= fondoTarget - 0.5`, `'active'` si `doneColchon`, si no `'locked'`.
   * `libertad`: `'done'` si `meta > 0 && investActual >= meta`, `'active'` si `doneFondo`, si no `'locked'`.
6. **Validación y Sanitización (`validateAndSanitizePlanInputs`):**
   * Recibe un payload `unknown`, verifica tipos numéricos/finitos y aplica rangos permitidos para blindar `PUT /api/plan` y `localStorage`.

---

## 4. Especificación de Endpoints Backend (`/api/plan`)

La ruta `/api/plan` queda automáticamente protegida por [`web/src/middleware.ts`](../../web/src/middleware.ts) mediante cookie `agyke_session` (retorna `401` si no está autenticado).

### A. `GET /api/plan`
Obtiene la configuración guardada del plan financiero desde `financial_plans` (`id = 'default'`).
* **Respuesta `200 OK` (con datos en Supabase):**
  ```json
  {
    "config": { "sueldo": 2250000, "gustosPct": 20, "...": "..." },
    "updated_at": "2026-11-27T14:20:00.000Z",
    "source": "supabase"
  }
  ```
* **Respuesta `200 OK` (sin registro previo o tabla pendiente de migración `42P01`/`PGRST205`):**
  ```json
  {
    "config": { "sueldo": 2250000, "...": "..." },
    "updated_at": null,
    "source": "default",
    "migration_pending": true
  }
  ```

### B. `PUT /api/plan`
Valida, sanitiza y persiste la configuración completa del plan financiero mediante `upsert` sobre `id = 'default'`.
* **Body JSON:** `{ "config": FinancialPlanInputs }`
* **Validación:** rechaza payloads no-objeto o con campos corruptos (`400 Bad Request`).
* **Respuesta `200 OK`:**
  ```json
  {
    "config": { "...": "..." },
    "updated_at": "2026-11-27T14:25:00.000Z",
    "persisted": true
  }
  ```
* Si la tabla aún no fue creada en Supabase (`42P01`/`PGRST205`), responde `200 OK` con `persisted: false` y `migration_pending: true` para que el cliente mantenga persistencia local sin errores visibles bloqueantes.

---

## 5. Arquitectura Visual, Navegación y Animaciones (`/plan`)

### 5.1 Navegación Global
* **`<HeaderBar />` (Desktop):** Se agrega la pestaña **`Plan`** (icono `Calculator` de `lucide-react`) entre `Analítica` y `Muro`:
  `Inicio` · `Analítica` · `Plan` · `Muro` · `Ajustes`.
* **`<MobileBottomDock />` (Smartphones):** Se incorpora el acceso táctil **`Plan`** manteniendo el diseño equilibrado, compactación de padding y target táctil ≥44px sin desborde horizontal en viewports de 360px+.
* **Protección:** `/plan` queda protegida por `web/src/middleware.ts` sin necesidad de configuración adicional.

### 5.2 Anatomía de Componentes (`web/src/components/plan/`)

1. **`PlanHero.tsx` (Hero de Sueldo y Reparto):**
   * Cabecera editorial con título **"Plan financiero"**, pill discreto de estado de sincronización (`Sincronizado` / `Guardando…` / `Solo local`) y botón **`Restablecer`**.
   * Input monumental de **Sueldo neto mensual** (`Geist Mono`, `tabular-nums`, tamaño fluido `clamp(2.5rem, 7vw, 4.75rem)`) con formateo de miles argentino (`es-AR`) en vivo preservando la posición exacta del cursor.
   * **Barra de reparto segmentada animada** (3 segmentos con `flex-basis` animado via `cubic-bezier(0.22, 1, 0.36, 1)`):
     * **Gastos fijos:** Pizarra editorial (`--plan-fijos`, contrastado en Claro y Oscuro).
     * **Gustos:** Ámbar solar (`--plan-gustos`).
     * **Inversión:** Índigo/Azul celeste editorial (`--plan-inv`).
   * **Interacción cruzada (Cross-Highlight):** Al pasar el cursor o enfocar cualquiera de los 3 segmentos o sus tarjetas inferiores, se resalta el rubro activo y se atenúan suavemente los restantes.
   * **Banner contextual de destino del ahorro:** Explica con claridad cuánto se ahorra por mes (`inversión + sobrante`) y si hoy alimenta el fondo de emergencia o la inversión de largo plazo.

2. **`PlanControls.tsx` (Panel Lateral Sticky de Controles):**
   * Columna izquierda sticky en desktop (`lg:sticky lg:top-20`), organizada en 4 bloques hairline:
     * **Reparto:** Sliders de `Gustos (%)`, `Inversión (%)`, fila calculada `Gastos fijos (el resto)` y slider `Sobrante que también ahorrás (%)`.
     * **Supuestos:** Sliders de `Rendimiento real anual (%)` y `Horizonte (años)`, más segmented control táctil `Sueldo` vs `Gastos` con transición suave.
     * **Dónde estás hoy:** Inputs monetarios con formato de miles en vivo para `Ya tengo en el fondo de emergencia` y `Ya tengo invertido`.
     * **Ajustes avanzados:** Acordeón animado (`grid-template-rows: 0fr -> 1fr`) para `Colchón inicial`, `Fondo de emergencia completo` y `Meta de libertad financiera`.
   * Sliders estilizados con pista de relleno dinámico (`--p`), thumb editorial de alto contraste y micro-escala táctil en `:active`.

3. **`PlanMilestones.tsx` (Timeline Vertical de Hitos):**
   * 3 hitos secuenciales (`Colchón inicial`, `Fondo de emergencia completo`, `Libertad financiera`).
   * Conector vertical que cambia de hairline a acento al completarse un hito.
   * Nodos circulares con transición fluida entre `Check` (completado), número activo con anillo respiratorio sutil (`animate-plan-pulse`), y `Lock` (bloqueado).
   * Barras de progreso animadas (`width` con easing suave), marcas de 25% / 50% / 75% en Libertad financiera, montos formateados (`$ X de $ Y`) y ETA con fecha estimada (`≈ X años y Y meses (mes año)`).

4. **`PlanProjectionChart.tsx` (Gráfico Interactivo, KPIs y Veredicto):**
   * Titular dinámico: *"Con **$ X por mes**, en N años tendrías **$ Y**, el Z% de tu meta."*
   * **Gráfico SVG editorial a 60 FPS** (sin lag al arrastrar sliders ni dependencias pesadas):
     * Curva de capital proyectado con gradiente vertical suave adaptable a Claro/Oscuro.
     * Línea punteada horizontal de **Meta** con etiqueta alineada.
     * Marcador vertical de **Fondo completo** cuando ocurre dentro del horizonte.
     * **Scrubber interactivo (mouse + touch):** al mover el cursor o arrastrar el dedo sobre el gráfico muestra línea guía, punto activo con halo y caption/tooltip en vivo con año, capital proyectado y % de la meta.
   * **Grilla de 3 KPIs** (`Meta de capital`, `Llegás a la meta`, `Aporte necesario`) con montos tabulares animados suavemente (`useAnimatedNumber`).
   * **Banner de Veredicto:** estilo positivo (`--color-positive`) cuando el aporte alcanza la meta dentro del horizonte, o guía accionable indicando la brecha mensual cuando falta aporte.
   * Nota metodológica al pie aclarando que las estimaciones están en pesos reales de hoy y no constituyen asesoramiento financiero.

### 5.3 Micro-Animaciones y Accesibilidad
* **Entrada escalonada (`plan-fade-up`):** Hero (`0ms`), Controles (`60ms`), Hitos (`100ms`), Proyección (`140ms`).
* **Interpolación de números (`useAnimatedNumber`):** Transición suave de ~200ms con `requestAnimationFrame` y easing cúbico al cambiar sliders, sin bloquear la escritura manual.
* **`prefers-reduced-motion: reduce`:** Respeta estrictamente la preferencia del sistema desactivando animaciones CSS e interpolación numérica.

---

## 6. Plan de Pruebas y Criterios de Aceptación (CI en Verde)

1. **Tests Unitarios (`src/services/financial-plan.test.ts`):**
   * Verificación de valores por defecto (`DEFAULTS`), invariante `fijosPct + gustosPct + invPct = 100` y normalización cuando `gustosPct + invPct > 100`.
   * Verificación de cascada de simulación: el ahorro primero completa el fondo de emergencia antes de pasar a inversión, y el remanente del mes de cruce entra a inversión el mismo mes.
   * Verificación de estados de hitos (`locked`, `active`, `done`) ante distintos valores de `fondoActual` e `investActual`.
   * Verificación de `aporteNecesario` por bisección (incluyendo caso ya cubierto `= 0`, `sueldo = 0`, `rend = 0%`, y confirmación de que simular con `aporteNecesario` alcanza `>= meta` en `anios * 12`).
   * Verificación de `base: 'sueldo'` vs `base: 'gastos'` (la meta con `'gastos'` debe ser menor cuando `invPct > 0`).
   * Verificación de `validateAndSanitizePlanInputs` frente a inputs inválidos/extremos.
2. **Validación Técnica Integral:**
   * `npm test` (100% en verde).
   * `npm run typecheck` (`0` errores, cero `any`).
   * `npm run lint` (`0` warnings / `0` errores en Next.js 16 / React 19).
   * `npm run build` compilando `/plan` y `/api/plan`.
   * Limpieza del archivo temporal `plan-financiero.html` de la raíz antes del cierre de la rama.
