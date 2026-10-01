# SPEC_GRAN_DASHBOARD_FULLSCREEN.md - Especificación Técnica del Gran Dashboard (Fullscreen Analytics Wall)

> **Estado:** PENDIENTE / BACKLOG ARQUITECTURAL (A la espera de ampliación de esquema de datos)  
> **Área:** Frontend (`web/`)  
> **Ruta proyectada:** `/analytics` o `/fullscreen`  
> **Tecnologías:** Next.js 16, Tailwind CSS v4, Recharts, Screen Wake Lock API, Fullscreen API  
> **Objetivo:** Diseñar una experiencia inmersiva a pantalla completa (100vw x 100vh, sin scroll) dedicada 100% a la visualización analítica avanzada de gastos, ideal para monitores secundarios, tablets de pared o Smart TVs en el hogar ("Kiosk Mode").

---

## 1. Visión y Justificación del Producto

### Propósito
Mientras que la pantalla principal del Dashboard (`/`) cumple un rol **operativo** (ver saldo neto inmediato, consultar la tabla de transacciones recientes y revisar pendientes del Muro Agyke), el **Gran Dashboard** está concebido como una **pantalla de visualización pura y centro de comando financiero**:
* **Cero Formularios y Cero Tablas Extensas:** Todo el espacio visual se destina a KPIs de gran impacto y gráficos analíticos interactivos.
* **Ajuste Perfecto a la Pantalla (100% Viewport Height):** El diseño se adapta de forma líquida a resoluciones 1080p, 2K y 4K sin generar barras de desplazamiento vertical.
* **Modo Kiosk / Smart TV Friendly:** Capacidad de mantenerse encendido en una pantalla secundaria o televisor mediante la *Screen Wake Lock API* de la Web Platform, con actualización de datos en tiempo real o sondeo periódico suave cada 60 segundos.

---

## 2. Análisis de Viabilidad con el Esquema Actual de Supabase

Actualmente, la tabla de transacciones de Agyke almacena un conjunto conciso y eficiente de datos contables:

```sql
-- Campos disponibles hoy en transactions:
id UUID,
user_id UUID,          -- Quién pagó la compra
amount NUMERIC(12,2),   -- Monto total
concept TEXT,           -- Descripción libre (ej: "Coto compras")
classification TEXT,    -- '50', '100', '-100', '0'
debt_impact NUMERIC,    -- Monto de impacto en saldo neto
created_at TIMESTAMP    -- Fecha y hora del registro
```

### Gráficas Factibles Inmediatamente (Fase 1 - Con datos actuales):
Con estos campos es posible construir de inmediato las siguientes 4 visualizaciones de alta calidad:

1. **KPI Bar Monumental Superior:**
   * Balance Neto Gigante (quién le debe a quién en tipografía de 48px).
   * Total del Mes Corriente vs Mes Anterior (% de variación).
   * Volumen de Transacciones registradas en el período.
2. **Gráfico de Evolución Temporal Acumulada (AreaChart Fullscreen):**
   * Gráfico de área extendido con gradiente índigo y selector de granularidad (Últimos 14 días / Mes actual / Histórico completo).
3. **Comparativa de Volumen de Aporte (User vs User BarChart):**
   * Gráfico de barras agrupadas o apiladas comparando el total aportado por el Usuario A versus el Usuario B para evaluar la paridad de desembolso.
4. **Distribución Monumental por Clasificación (Donut Chart Expandido):**
   * Visualización a gran escala del impacto de los 4 tipos de deuda (`50/50`, `Favor 100%`, `Deuda Mía`, `Personal`) con leyenda enriquecida.
5. **Velocidad de Gasto por Día de la Semana (Day-of-Week Velocity):**
   * Gráfico de barras verticales que agrupa los gastos según el día (Lunes a Domingo) para identificar patrones de consumo familiar/hogareño.

---

## 3. Limitaciones Actuales y Campos Futuros Requeridos

> [!IMPORTANT]
> **Decisión de Arquitectura:** Debido a que el esquema actual no almacena categorías normalizadas, medios de pago ni presupuestos mensuales, **el desarrollo de las funciones más sofisticadas de este Gran Dashboard queda pospuesto como tarea PENDIENTE** en el roadmap hasta que se apliquen las migraciones de base de datos correspondientes.

### Campos Necesarios para la Versión Definitiva del Gran Dashboard:

| Nuevo Campo / Tabla | Tipo | Propósito Analítico | Gráfica Desbloqueada |
| :--- | :--- | :--- | :--- |
| `category` | `VARCHAR(32)` o `ENUM` | Clasifica el gasto (`supermercado`, `alquiler`, `salidas`, `servicios`, `mascotas`, `salud`). | **Sunburst / Treemap** de desglose por categoría y **Radar Chart** de hábitos. |
| `payment_method` | `VARCHAR(32)` | Identifica el canal (`efectivo`, `tarjeta_debito`, `tarjeta_credito`, `transferencia`). | Gráfico de distribución de flujo de liquidez y fechas de vencimiento de tarjetas. |
| `tags` | `TEXT[]` | Etiquetas secundarias (ej: `["vacaciones", "cena-amigos", "mudanza"]`). | Agrupación analítica de eventos extraordinarios. |
| Tabla `budgets` | Relacional | Techo presupuestario mensual por categoría acordado entre ambos usuarios. | **Burn-down Chart** (quema de presupuesto) y barras de avance de límite de gasto. |

---

## 4. Arquitectura de Pantalla y Wireframe Mental (100vh)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [Top Bar Kiosk: Agyke Command Center]   ● En Vivo (60s)    [ ⛶ Pantalla Completa ]   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [KPI Strip: 4 Cifras Monumentales]                                                    │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────┐ ┌────────────┐ │
│  │ SALDO NETO ACTUAL    │ │ TOTAL MES EN CURSO   │ │ APORTE USUARIO A │ │ APORTE B   │ │
│  │ $ 15.000 (A favor A) │ │ $ 210.450 (+12%)     │ │ $ 120.000 (57%)  │ │ $ 90.450   │ │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────┘ └────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [Grid Principal 12 Columnas - Alto Fijo 65vh]                                         │
│  ┌──────────────────────────────────────────────┐ ┌──────────────────────────────────┐ │
│  │  Gráfico 1 (Col 1-7):                        │ │  Gráfico 2 (Col 8-12):           │ │
│  │  Evolución Temporal y Curva Acumulada        │ │  Distribución de Clasificaciones  │ │
│  │  (AreaChart HD con tooltips fluidos)         │ │  (Donut HD con KPI central vivo)  │ │
│  │                                              │ │                                  │ │
│  ├──────────────────────────────────────────────┤ ├──────────────────────────────────┤ │
│  │  Gráfico 3 (Col 1-7):                        │ │  Gráfico 4 (Col 8-12):           │ │
│  │  Comparativa de Aporte por Usuario           │ │  Intensidad por Día de la Semana │ │
│  │  (BarChart interactivo A vs B)               │ │  (Velocidad de Gasto Lun-Dom)    │ │
│  └──────────────────────────────────────────────┘ └──────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Especificaciones Técnicas y de Experiencia

1. **Gestión de Pantalla Completa:**
   * Botón interactivo en la esquina superior derecha con icono `Maximize2` / `Minimize2` que dispara la API nativa del navegador:
     ```typescript
     const toggleFullscreen = () => {
       if (!document.fullscreenElement) {
         document.documentElement.requestFullscreen().catch(console.error);
       } else {
         document.exitFullscreen().catch(console.error);
       }
     };
     ```
2. **Screen Wake Lock (Evitar Bloqueo de Pantalla):**
   * Uso de la API `navigator.wakeLock` para mantener activa la pantalla del televisor o tablet sin interrupción mientras la pestaña esté en primer plano.
3. **Auto-Refresco Silencioso (Data Freshness):**
   * Sondeo automático cada 60 segundos invocando `/api/dashboard` en segundo plano con actualización reactiva sin parpadeo de pantalla.
4. **Diseño Oscuro Anti-Quemado (OLED/AMOLED Safe):**
   * Fondo profundo `#080B11` con niveles controlados de brillo para prevenir retención de imagen en pantallas OLED continuas.

---

## 6. Estado en el Roadmap

* [ ] **Fase Futura 1:** Definir y migrar los nuevos campos (`category`, `payment_method`, `budgets`) en la base de datos Supabase.
* [ ] **Fase Futura 2:** Crear la ruta dedicada `web/src/app/analytics/page.tsx` con el layout 100vh.
* [ ] **Fase Futura 3:** Conectar la pantalla completa con widgets especializados y selector de rango temporal.
* [x] **Fase de Especificación:** Arquitectura formalizada y documentada en `docs/ui/SPEC_GRAN_DASHBOARD_FULLSCREEN.md`. Queda en **Pendiente / Backlog** hasta la expansión del esquema.
