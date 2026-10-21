# SPEC_ANALYTICS_MONTHLY_AND_QUEUE_SEPARATION.md - Especificación Técnica de Analítica Mensual, Command Center y Desacople del Muro Agyke

> **Estado:** Aprobado / Listo para Planificación e Implementación  
> **Área:** Backend (`web/src/app/api/`) & Frontend (`web/src/app/`)  
> **Rama:** `feat/analytics-monthly-and-muro`  
> **Tecnologías:** Next.js 16 (App Router), Tailwind CSS v4, Recharts, Supabase PostgreSQL, Lucide Icons  
> **Objetivo:** 
> 1. Crear una pantalla dedicada a la visualización analítica pura (`/analytics`) con vista panorámica tipo Dashboard/Command Center para web y versión adaptada para mobile.
> 2. Implementar cortes temporales por mes con consultas SQL optimizadas (`/api/analytics?month=YYYY-MM`) para analizar gastos, aportes relativos, variación porcentual vs mes anterior y evolución diaria.
> 3. Desacoplar el Muro Agyke (`<QueueViewer />`) del fondo del Dashboard principal (`/`) y trasladarlo a su propia página dedicada (`/muro`), dejando un micro-aviso interactivo en la navegación principal.

---

## 1. Motivación y Diagnóstico de Arquitectura

### Diagnóstico Actual:
1. **Falta de Segmentación Temporal (Sin Cortes Mensuales):**
   * Actualmente `/api/dashboard` carga todas las transacciones históricas en memoria. No existe la posibilidad de responder preguntas financieras elementales como: *¿Cuánto gastamos en Octubre?*, *¿Quién puso más plata este mes?*, o *¿Gastamos más o menos que el mes pasado?*.
2. **Dashboard Operativo Sobrecargado:**
   * La página principal (`/`) mezcla KPIs generales, una tabla de transacciones de 6 columnas y, al fondo de todo, el visor de la cola de auditoría (`<QueueViewer />`).
   * Tener el Muro Agyke abajo de todo genera una mala experiencia: los usuarios deben scrollear toda la pantalla para ver si hay audios o tickets pendientes de confirmación.
3. **Ausencia de un Centro de Comando Analítico:**
   * No existe una vista limpia de pantalla completa donde se puedan apreciar múltiples métricas y gráficos combinados (evolución temporal acumulada, comparativa head-to-head de aportes, donut por clasificación e intensidad de gastos por día de la semana).

---

## 2. Principios de Diseño: "Auditoría Clara, Analítica Panorámica"

1. **Dashboard Operativo Limpio (`/`):**
   * El inicio se enfoca en lo inmediato: balance neto consolidado, métricas rápidas de impacto y la tabla/feed de transacciones recientes.
   * Si existen elementos pendientes en la cola, el Header y el Dock exhiben un micro-badge interactivo con contador que redirige a `/muro`.
2. **Página Dedicada a la Analítica (`/analytics`):**
   * Cero tablas y cero formularios: 100% enfocada en visualización gráfica y análisis comparativo.
   * Soporte dual: **Command Center Panorámico** para pantallas de escritorio/monitores/Smart TVs y **Mobile Analytics** para smartphones.
3. **Cortes Temporales Rigurosos (`?month=YYYY-MM`):**
   * Selector mensual navegable con flechas (`[ ‹ ] Octubre 2026 [ › ]`) y retorno instantáneo a "Mes Actual".
   * Agregaciones precisas calculadas a nivel de API: total gastado en el mes, variación porcentual contra el mes calendario inmediatamente anterior, paridad de aporte de cada usuario y velocidad de consumo.
4. **Página Dedicada al Muro Agyke (`/muro`):**
   * Espacio propio para auditar notas de voz, tickets y PDFs procesados por Gemini, con confirmación o descarte manual.

---

## 3. Especificación Técnica por Módulo

### A. Módulo Backend: Endpoint de Analítica con Cortes Mensuales (`/api/analytics`)

* **Ruta:** `GET /api/analytics?month=YYYY-MM` (si se omite `month`, se toma el mes UTC/local actual).
* **Parámetros:**
  * `month` (opcional): Cadena en formato `YYYY-MM` (ej. `2026-10`).
* **Lógica de Consulta:**
  1. Calcular rango de fechas del mes seleccionado:
     * `startDate = YYYY-MM-01 00:00:00.000Z`
     * `endDate = primer día del mes siguiente a las 00:00:00.000Z`
  2. Calcular rango del mes previo (para comparativa MoM):
     * `prevStartDate = mes anterior 01 00:00:00.000Z`
     * `prevEndDate = startDate`
  3. Ejecutar consultas en paralelo contra Supabase:
     * `users`: listado de usuarios (`userA` y `userB`).
     * `currentMonthTx`: transacciones con `created_at >= startDate AND created_at < endDate`.
     * `prevMonthTx`: transacciones con `created_at >= prevStartDate AND created_at < prevEndDate` (para el total previo).
     * `allMonths`: `SELECT DISTINCT to_char(created_at, 'YYYY-MM') as month FROM transactions ORDER BY month DESC` para poblar el selector de meses disponibles.
* **Contrato de Respuesta JSON (`AnalyticsMonthPayload`):**
  ```typescript
  export interface AnalyticsMonthPayload {
    selectedMonth: string; // "2026-10"
    monthLabel: string; // "Octubre 2026"
    availableMonths: string[]; // ["2026-10", "2026-09", "2026-08", ...]
    kpis: {
      totalGastoMes: number;
      totalGastoMesAnterior: number;
      variacionPorcentual: number | null; // ej: +14.2 o -8.5 (null si mes anterior = 0)
      transaccionesCount: number;
      deudaGeneradaMes: number; // Balance neto generado exclusivamente en el mes
      aporteUserA: { id: string; name: string; total: number; percentage: number };
      aporteUserB: { id: string; name: string; total: number; percentage: number };
    };
    dailyTimeline: {
      day: number; // 1, 2, ..., 31
      date: string; // "10 oct"
      monto: number;
      acumulado: number;
      count: number;
    }[];
    classificationBreakdown: {
      key: '50' | '100' | '-100' | '0';
      name: string;
      value: number;
      count: number;
      percentage: number;
      color: string;
    }[];
    dayOfWeekIntensity: {
      dayName: string; // "Lunes", "Martes", ...
      total: number;
      count: number;
    }[];
    topExpenses: {
      id: string;
      concept: string;
      amount: number;
      userName: string;
      date: string;
      classification: string;
    }[];
  }
  ```

---

### B. Módulo Frontend: Página Dedicada `/analytics`

#### 1. Navegador de Período Superior:
* Píldora de vidrio con flechas para navegar meses: `[ ‹ ] Octubre 2026 [ › ]`.
* Desplegable con los meses disponibles con historial (`availableMonths`).
* Botón de acceso rápido a "Mes Actual" si se está visualizando un período pasado.
* Botón para alternar a pantalla completa (`Fullscreen API`).

#### 2. Vista Web / Desktop (Command Center Panorámico):
* **Fila Superior de KPIs (4 Tarjetas de Alto Impacto):**
  1. **Gasto Total del Mes:** Cifra destacada en pesos con pastilla de variación porcentual respecto al mes anterior (verde si bajó, ámbar/violeta si subió).
  2. **Paridad de Desembolso:** Barra comparativa horizontal con aporte de Usuario A vs Usuario B (montos y porcentajes exactos).
  3. **Deuda Generada en el Mes:** Cifra neta del período que indica quién financió más compras durante el mes.
  4. **Volumen de Operaciones:** Total de transacciones del mes y promedio por compra.
* **Grilla Principal 2x2 de Gráficos Recharts:**
  * **Gráfico 1: Evolución Acumulada del Mes (`AreaChart` HD):**
    * Días 1 al 31 del mes en el eje X. Curva fluida de gasto diario acumulado.
  * **Gráfico 2: Head-to-Head Aportes (`BarChart` Comparativo):**
    * Barras paralelas comparando los montos aportados por cada usuario en el mes seleccionado.
  * **Gráfico 3: Distribución por Clasificación del Mes (`DonutChart`):**
    * Donut interactivo con KPI central dinámico que desglosa el destino financiero del mes (`50/50`, `Favores 100%`, `Deuda`, `Personal`).
  * **Gráfico 4: Intensidad por Día de la Semana (`BarChart`):**
    * Visualización de Lunes a Domingo para identificar picos de consumo del hogar (ej. compras fuertes los sábados/domingos).
* **Top 5 Gastos del Mes:**
  * Tira compacta con las 5 compras de mayor envergadura del mes seleccionado.

#### 3. Vista Mobile (`<sm`):
* Grilla 2x2 simétrica para los 4 KPIs superiores.
* Selector de mes táctil con botones de 44px.
* Gráficos apilados ordenadamente con Donut centralizado y scroll horizontal táctil para las barras.

---

### C. Módulo Frontend: Página Dedicada `/muro` y Desacople del Dashboard

#### 1. En el Dashboard Principal (`/`):
* Se **remueve** el componente `<QueueViewer />` del final de `page.tsx`.
* En la cabecera (`HeaderBar.tsx`), si existen elementos en la cola (`queueCount > 0`), se muestra una píldora viva:
  ```tsx
  <Link href="/muro" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-all animate-pulse">
    <Clock className="w-3.5 h-3.5" />
    <span>{queueCount} pendientes en el Muro</span>
    <ArrowRight className="w-3 h-3" />
  </Link>
  ```
* En el dock móvil (`MobileBottomDock.tsx`) se incluye acceso directo o indicador al Muro.

#### 2. En la Nueva Página `/muro` (`web/src/app/muro/page.tsx`):
* Página dedicada exclusivamente a la auditoría de la cola de gastos de Gemini.
* Filtros por estado: `Pendientes`, `Confirmados`, `Descartados`.
* Tarjetas completas con visualización de transcripción de voz, miniatura del comprobante, PDF procesado y botones de acción rápida para confirmar o descartar.
* Botón para volver al Dashboard principal (`/`).

---

## 4. Enlaces de Navegación Global (Header & Mobile Dock)

Para que el usuario pueda moverse intuitivamente entre las 3 pantallas del sistema:
* **HeaderBar (Desktop):**
  * `[ Dashboard ]` (`/`)
  * `[ Analítica & Métricas ]` (`/analytics`)
  * `[ Muro Agyke ]` (`/muro`) con badge dinámico si hay pendientes.
* **MobileBottomDock (Mobile):**
  * Acceso rápido a: `Dashboard (Inicio)`, `Analítica`, `Muro` y `Telegram`.

---

## 5. Plan de Ejecución SDD (Fase 10)

| Tarea | Título | Dominio | Criterio de Aceptación |
| :--- | :--- | :---: | :--- |
| **`CORE-05`** | Endpoint `GET /api/analytics` con Cortes Mensuales | `core` | Consultas SQL con rango `startDate`/`endDate`, cálculo de MoM vs mes anterior y agregaciones. |
| **`WEB-07`** | Página Dedicada `/analytics` con Selector de Mes | `web` | Layout panorámico con selector navegable `[ ‹ ] Mes [ › ]` y fetch dinámico por `?month=`. |
| **`UI-32`** | Suite de Gráficos Mensuales Recharts | `ui_ux` | AreaChart diario, BarChart Head-to-Head A vs B, Donut del mes e Intensidad Lunes-Domingo. |
| **`UI-33`** | Adaptabilidad Mobile-First para `/analytics` | `ui_ux` | KPIs 2x2, navegación táctil suave y cero scroll horizontal en 360px-430px. |
| **`WEB-08`** | Página Dedicada `/muro` y Desacople del Dashboard | `web` | Mover `<QueueViewer>` a `/muro`, retirar del fondo de `page.tsx` e integrar micro-badge en Header. |
| **`UI-34`** | Sincronización de Navegación Global (Header y Dock) | `ui_ux` | Enlaces coherentes entre `/`, `/analytics` y `/muro` en Desktop y Mobile. |

---

## 6. Verificación de Seguridad y Rendimiento
* [ ] No se alteran las tablas transaccionales existentes de Supabase.
* [ ] Las consultas mensuales filtran por índice en `created_at`.
* [ ] La autenticación por PIN (`agyke_session`) protege tanto `/analytics` como `/muro` mediante el middleware existente.
