# COMPONENTS_SPEC.md - Especificación Anatómica de Componentes UI

Este documento especifica la estructura, estados visuales y comportamiento de cada componente de la nueva interfaz de **Agyke**.

---

## 1. Top Navbar (`<HeaderBar />`)
Componente superior fijo o pegajoso (*sticky*) que brinda contexto de aplicación y estado del sistema.

### Elementos Visuales:
* **Brand Logo:** Icono minimalista con isotipo de balanza/flechas en gradiente índigo + texto `"Agyke"` con badge `"v1.0"`.
* **Webhook Live Indicator:** Pill con micro-punto parpadeante verde (`animate-pulse`) que indica que el webhook de Telegram está conectado y activo.
* **Acciones:**
  * Botón de **Refrescar Datos:** Icono `RefreshCw` que rota durante la recarga (`animate-spin`).
  * Enlace al Bot de Telegram: Botón secundario con icono de Telegram para abrir directamente el bot.

---

## 2. Master Balance Hero (`<MasterBalanceHero />`)
El **componente estrella** de la pantalla. Comunica el estado de la deuda en un golpe de vista sin ambigüedades.

### Anatomía:
```text
┌────────────────────────────────────────────────────────────────────────┐
│  ESTADO DE SALDO NETO CONSOLIDADO                   [ Chip: Saldado ] │
│                                                                        │
│   $ 15.000,00                                                          │
│   🔴 Cholo le debe a Lautaro                                           │
│                                                                        │
│  [ Avatar Lautaro (+$15.000) ] ───────► [ Avatar Cholo (-$15.000) ]    │
│                                                                        │
│  ℹ️ Impacto calculado sobre 14 transacciones compartidas               │
└────────────────────────────────────────────────────────────────────────┘
```

### Estados Condicionales del Hero Card:
1. **Estado "B le debe a A" (Saldo Positivo):**
   * Borde sutil verde esmeralda (`#10B981`) con resplandor suave.
   * Texto explicativo: `🔴 [Nombre B] le debe a [Nombre A]: $ X.XXX`.
   * Flecha de flujo visual desde el deudor hacia el acreedor.
2. **Estado "A le debe a B" (Saldo Negativo):**
   * Borde sutil carmesí/rosa (`#F43F5E`) con resplandor suave.
   * Texto explicativo: `🔴 [Nombre A] le debe a [Nombre B]: $ X.XXX`.
3. **Estado "Cuentas Saldadas" ($0):**
   * Borde sutil cian (`#06B6D4`).
   * Icono de balanza equilibrada `CheckCircle2` y mensaje de cuentas en cero.

---

## 3. Grid de Métricas Secundarias (`<StatMetricCard />`)
Grid responsivo de 4 columnas (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) con información financiera agregada:

1. **Total Registrado:** Suma absoluta de todas las transacciones históricas registradas.
2. **Gastos Compartidos (50 / 100):** Monto total de compras que impactan en la relación mutua.
3. **Gastos Personales (0):** Gastos cargados por los usuarios que no generan deuda entre sí.
4. **Muro Agyke (Pendientes):** Cantidad de comprobantes, audios o textos pendientes en la cola (`agyke_queue`).

### Microinteracciones:
* Icono temático dentro de un contenedor circular con fondo translúcido.
* Hover con elevación (`translate-y-[-2px]`) y borde brillante tenue.

---

## 4. Gráficos de Analítica (`<AnalyticsSection />`)
Diseño en 2 columnas con Recharts estilizado:

1. **Gráfico Temporal (Evolución de Saldos):**
   * Tipo: `AreaChart` con curva suave (`type="monotone"`).
   * Gradiente vertical: de `rgba(99, 102, 241, 0.4)` a `rgba(99, 102, 241, 0)`.
   * Tooltip personalizado con fondo glassmorphism oscuro y valores tabulares.
2. **Distribución por Clasificación:**
   * Tipo: `PieChart` / `DonutChart` con radio interior del 65%.
   * Segmentos en los 4 colores semánticos (`50` índigo, `100` esmeralda, `-100` rose, `0` slate).
   * Leyenda interactiva con porcentajes calculados.

---

## 5. Tabla de Transacciones y Feed (`<TransactionsTable />`)
La sección operativa donde los usuarios consultan el desglose de sus compras.

### Funcionalidades y Usabilidad:
* **Buscador en Vivo:** Input con icono `Search` para filtrar instantáneamente por concepto o persona sin recarga.
* **Chips de Clasificación (Filtro Rápido):**
  * Botones tipo píldora: `[Todos]` `[50/50]` `[Favor 100%]` `[Deuda -100%]` `[Personal]`.
* **Columnas de la Tabla:**
  1. **Usuario:** Avatar con iniciales coloreadas + Nombre.
  2. **Concepto:** Nombre de la compra (ej: *"Coto compras semanales"*).
  3. **Fecha:** Formato relativo amigable (ej: *"Hoy, 14:30"* o *"24 Sep"*).
  4. **Clasificación:** Badge con color y etiqueta formal.
  5. **Monto Original:** Cifra completa (`$ 15.000,00`).
  6. **Impacto en Saldo:** Cifra calculada (`+$ 7.500,00` en verde o `-$ 7.500,00` en rojo).
* **Empty State:** Cuando un filtro no devuelve resultados, se muestra un mensaje claro con ilustración ligera y botón para limpiar filtros.

---

## 6. Cola de Mensajes del Muro Agyke (`<QueueDrawer />`)
Sección colapsable o tarjeta dedicada para inspeccionar lo que Gemini procesó automáticamente:
* Lista de tickets pendientes o procesados con etiquetas `audio`, `foto` o `texto`.
* Indicador de estado `PENDING`, `PROCESSED` o `DISCARDED`.
