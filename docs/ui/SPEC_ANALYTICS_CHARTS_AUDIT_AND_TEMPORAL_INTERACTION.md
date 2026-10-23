# SPEC_ANALYTICS_CHARTS_AUDIT_AND_TEMPORAL_INTERACTION.md - Auditoría y Fidelidad de Gráficos de Analítica, Desembolso Crudo Cara a Cara y Línea Temporal de Interacción

> **Estado:** Aprobado / Listo para Planificación e Implementación  
> **Área:** Backend (`web/src/app/api/analytics/`) & Frontend (`web/src/app/analytics/`)  
> **Rama de Desarrollo:** `dev` (o rama secundaria `feat/analytics-fidelity-and-interaction-chart`)  
> **Tecnologías:** Next.js 16 (App Router), Recharts, Tailwind CSS v4, TypeScript estricto, Supabase  
> **Objetivo:**  
> 1. Auditar integralmente los gráficos y métricas de `/analytics` para garantizar fidelidad matemática y conceptual exacta.
> 2. Rediseñar el cuadro **"Cara a Cara" (Head-to-Head)** para que refleje sin ambigüedades: **"Quién puso más plata este mes en gastos compartidos (50/50)"**, comparando números en crudo sin distorsiones de deuda.
> 3. Implementar un nuevo **Gráfico de Líneas Temporal Comparativo de Interacción**, con dos líneas independientes (una por usuario) en el eje temporal del mes (días 1 a 31) acumulando todo el volumen de dinero cargado a Agyke (sin importar la clasificación `0`, `50`, `100`, `-100`), midiendo la actividad de carga y dinámica de interacción de cada uno con el sistema.

---

## 1. Motivación y Diagnóstico de Fidelidad

### A. Diagnóstico del Cuadro "Cara a Cara" Actual:
* **Ambigüedad Conceptual:** En la implementación inicial, el gráfico se titulaba *"Comparativa de Aporte: Volumen neto aportado"* y sumaba todas las transacciones de cada usuario sin discriminar su naturaleza (incluyendo gastos personales `0` o movimientos `-100`).
* **Distorsión del Propósito:** En una pareja que comparte finanzas con Agyke, la pregunta primaria al ver un corte mensual no es una fórmula abstracta de balance, sino una verdad contable tangible:  
  **¿Quién fue el que pagó y puso más plata de su bolsillo para los gastos comunes este mes?**
* **Solución requerida:** Comparación directa del **desembolso en crudo en gastos 50/50**. Si Usuario A pagó \$150.000 en el súper y Usuario B pagó \$50.000 en delivery, Usuario A puso \$150.000 y Usuario B puso \$50.000; Usuario A puso \$100.000 más en crudo. La tarjeta debe expresar explícitamente quién lideró los pagos del mes y por cuánta diferencia.

### B. Diagnóstico de la Dinámica de Interacción Temporal:
* Actualmente existe un gráfico de área que muestra la curva acumulada de todos los gastos del mes (`acumulado`), pero no permite visualizar **el comportamiento individual de cada usuario en el tiempo**.
* **Solución requerida:** Un gráfico comparativo con **dos líneas (una por usuario)** que recorre los días del mes (1..31). En este gráfico **no importa la clasificación** (entran `0`, `50`, `100`, `-100`), porque su objetivo específico es medir el **volumen total y la frecuencia de carga al bot**: saber cuándo cargó cada uno, quién empezó el mes con más actividad y cómo creció el volumen acumulado cargado por cada parte a lo largo de las semanas.

---

## 2. Especificación Matemática y de Datos (Backend `/api/analytics`)

### A. Desembolso en Crudo Cara a Cara (Gastos Compartidos 50/50)
Para el corte mensual seleccionado (`startDate` a `endDate`):
1. Filtrar las transacciones compartidas: `t.classification === '50'`.
2. Para cada usuario (`userA` y `userB`):
   $$\text{rawPaidUserA} = \sum_{t \in \text{tx}_{50}, \, t.\text{user\_id} = \text{userA.id}} t.\text{amount}$$
   $$\text{rawPaidUserB} = \sum_{t \in \text{tx}_{50}, \, t.\text{user\_id} = \text{userB.id}} t.\text{amount}$$
   $$\text{totalSharedPaid} = \text{rawPaidUserA} + \text{rawPaidUserB}$$
3. Cálculo de porcentajes sobre el total desembolsado en común:
   $$\text{pctUserA} = \text{totalSharedPaid} > 0 ? \text{round}\left(\frac{\text{rawPaidUserA}}{\text{totalSharedPaid}} \times 100\right) : 0$$
   $$\text{pctUserB} = \text{totalSharedPaid} > 0 ? \text{round}\left(\frac{\text{rawPaidUserB}}{\text{totalSharedPaid}} \times 100\right) : 0$$
4. Veredicto del mes:
   $$\text{diff} = |\text{rawPaidUserA} - \text{rawPaidUserB}|$$
   $$\text{leader} = \begin{cases} \text{userA.name} & \text{si } \text{rawPaidUserA} > \text{rawPaidUserB} \\ \text{userB.name} & \text{si } \text{rawPaidUserB} > \text{rawPaidUserA} \\ \text{"Empate"} & \text{si } \text{rawPaidUserA} = \text{rawPaidUserB} \end{cases}$$

### B. Serie Temporal de Interacción y Carga Total (`userInteractionTimeline`)
Para los días $d \in [1, \text{daysInMonth}]$:
1. Agrupar todas las transacciones (sin importar clasificación) por día de creación y usuario creador:
   $$\text{dailyUserA}[d] = \sum_{t \in \text{tx}, \, t.\text{user\_id} = \text{userA.id}, \, \text{day}(t) = d} t.\text{amount}$$
   $$\text{dailyUserB}[d] = \sum_{t \in \text{tx}, \, t.\text{user\_id} = \text{userB.id}, \, \text{day}(t) = d} t.\text{amount}$$
2. Calcular la progresión acumulada acumulando día tras día:
   $$\text{accumUserA}[d] = \sum_{i=1}^d \text{dailyUserA}[i]$$
   $$\text{accumUserB}[d] = \sum_{i=1}^d \text{dailyUserB}[i]$$
3. Cada punto de datos para Recharts contendrá:
   ```json
   {
     "day": 14,
     "date": "14 oct",
     "userAAccum": 185000,
     "userBAccum": 120000,
     "userADaily": 25000,
     "userBDaily": 0,
     "userACount": 3,
     "userBCount": 1
   }
   ```

---

## 3. Interfaces de Tipado TypeScript (`web/src/types/database.ts`)

```typescript
export interface AnalyticsHeadToHeadUser {
  id: string;
  name: string;
  rawPaid: number;      // Dinero en crudo pagado en gastos 50/50
  percentage: number;   // Porcentaje del total compartido
  count: number;        // Cantidad de pagos 50/50 realizados
}

export interface AnalyticsHeadToHead {
  userA: AnalyticsHeadToHeadUser;
  userB: AnalyticsHeadToHeadUser;
  totalSharedPaid: number;
  difference: number;
  leaderName: string;   // Nombre del que puso más plata o "Empate"
}

export interface AnalyticsInteractionTimelineItem {
  day: number;
  date: string;
  userAAccum: number;
  userBAccum: number;
  userADaily: number;
  userBDaily: number;
  userACount: number;
  userBCount: number;
}

// Extensión de AnalyticsMonthPayload
export interface AnalyticsMonthPayload {
  selectedMonth: string;
  monthLabel: string;
  availableMonths: string[];
  kpis: AnalyticsKPIs;
  headToHead: AnalyticsHeadToHead;
  interactionTimeline: AnalyticsInteractionTimelineItem[];
  dailyTimeline: AnalyticsDailyTimeline[];
  classificationBreakdown: AnalyticsClassificationItem[];
  dayOfWeekIntensity: AnalyticsDayOfWeekItem[];
  topExpenses: AnalyticsTopExpense[];
}
```

---

## 4. Especificación Visual y de Componentes (`web/src/app/analytics/page.tsx`)

### A. Rediseño del Cuadro Cara a Cara (BarChart + Banner Editorial de Veredicto)
* **Encabezado:**
  * Título: `CARA A CARA: QUIÉN PUSO MÁS PLATA` (con tipografía mono, uppercase, tracking-wider).
  * Subtítulo: `Desembolso en crudo sobre gastos compartidos (50/50) en {monthLabel}`.
* **Banner de Veredicto Rápido:**
  * Insignia destacada:  
    `🏆 Este mes [Usuario] puso más plata: +$ [Diferencia] respecto a [Otro Usuario]`  
    *(O badge neutro si están igualados en $0 o monto idéntico).*
* **Gráfico de Barras Cara a Cara:**
  * Eje X: Nombre de cada usuario.
  * Eje Y: Monto desembolsado en pesos (`$150k`).
  * Barras con esquinas redondeadas y colores de contraste semántico según el tema (Claro / Oscuro).
  * Tooltip interactivo indicando monto exacto en ARS y porcentaje del pozo compartido.

### B. Nuevo Gráfico de Líneas: Evolución de Carga e Interacción Temporal
* **Encabezado:**
  * Título: `INTERACCIÓN CON AGYKE EN EL TIEMPO`
  * Subtítulo: `Volumen acumulado de dinero cargado al bot por usuario (días 1 al {daysInMonth})`
* **Visualización Recharts (`LineChart` / `ResponsiveContainer`):**
  * Eje X: Días del mes (ej. `1 oct`, `5 oct`, `10 oct`, `15 oct`, `20 oct`, `25 oct`, `31 oct`).
  * Eje Y: Monto acumulado en formato tabular `$0`, `$50k`, `$100k`, `$200k`.
  * **Dos Líneas (`Line`):**
    * Línea 1 (Usuario A): Color temático primario (Azul Indigo en light / Celeste eléctrico en dark), `strokeWidth={2.5}`, `dot={false}`, `activeDot={{ r: 5 }}`.
    * Línea 2 (Usuario B): Color temático secundario (Esmeralda en light / Verde menta en dark), `strokeWidth={2.5}`, `dot={false}`, `activeDot={{ r: 5 }}`.
  * **Tooltip Multilínea Flotante:**
    * Fecha: `Día {d} de {mes}`.
    * Desglose por usuario:
      - Nombre User A: Monto acumulado y cantidad de cargas acumuladas.
      - Nombre User B: Monto acumulado y cantidad de cargas acumuladas.
* **Badge de Leyenda Interactivo:**
  * Mini pills con el color de cada línea indicando el nombre de cada usuario y el total final acumulado al corte del mes.

### C. Auditoría y Ajuste de los Otros Gráficos de `/analytics`:
1. **Velocidad de Gastos Acumulada (AreaChart):**
   * Aclarar en el subtítulo: *"Evolución del total acumulado de todos los gastos del período"*.
2. **Donut de Clasificaciones (PieChart):**
   * Validar que la leyenda y tooltips distingan claramente:
     - `50/50 Mitad` (impacto balance)
     - `Favor 100%` (adelanto total)
     - `Deuda Mía (-100%)` (deuda directa)
     - `Personal (0%)` (sin impacto en balance compartido)
3. **Intensidad por Día de la Semana (BarChart):**
   * Indicar claramente el día pico de compras de la semana y el volumen total de ese día.
4. **Top 5 Mayores Gastos:**
   * Mostrar monto, concepto, quién pagó y la píldora de clasificación.

---

## 5. Plan de Pruebas y Validación (Test-First)

1. **Pruebas de Cálculo Backend (`src/tests/analytics.test.ts` o simulación):**
   * Verificar que `rawPaidUserA` y `rawPaidUserB` consideren **exclusivamente** transacciones `classification === '50'`.
   * Verificar que transacciones de `0` o `-100` **no alteren** el cálculo de desembolso compartido en el Cara a Cara.
   * Verificar que en la serie temporal de interacción (`userInteractionTimeline`), **sí se sumen todas las clasificaciones** (`50`, `100`, `-100`, `0`).
   * Verificar que la serie temporal cubra exactamente los días del mes correspondiente (28 para febrero regular, 29 para bisiesto, 30 o 31 según el mes).
2. **Pruebas de Calidad Estática:**
   * `npx tsc --noEmit` y `npx tsc --noEmit --project web/tsconfig.json` (0 errores).
   * `npm run lint --prefix web` (0 warnings de ESLint).
   * `npm run board` (validación de esquema JSON).
