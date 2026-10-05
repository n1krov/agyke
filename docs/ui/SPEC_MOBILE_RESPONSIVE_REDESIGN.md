# SPEC_MOBILE_RESPONSIVE_REDESIGN.md - Especificación Técnica de Adaptabilidad y Experiencia Mobile-First

> **Estado:** Aprobado / Listo para Planificación e Implementación  
> **Área:** Frontend (`web/`)  
> **Rama:** `feat/mobile-responsive-ui`  
> **Tecnologías:** Next.js 16, Tailwind CSS v4, Lucide Icons, Recharts, CSS Touch Manipulation  
> **Objetivo:** Transformar la experiencia web de Agyke en smartphones (360px a 430px) mediante un diseño Mobile-First nativo: eliminación del scroll horizontal en tablas mediante Transaction Card Feed, grilla 2x2 táctil para métricas, cápsula flotante de navegación inferior (Thumb Zone), inputs con `inputMode="numeric"` y cálculo de altura dinámica con `100dvh`.

---

## 1. Motivación y Diagnóstico de Usabilidad Mobile

### Diagnóstico Actual en Smartphones (360px - 430px):
1. **Tabla de Transacciones Inadecuada para Pantallas Pequeñas:**
   * La tabla actual renderiza 6 columnas dentro de un contenedor con `overflow-x: auto`. En smartphones, obliga al usuario a deslizar horizontalmente la pantalla una y otra vez para ver quién pagó, cuánto costó y cuál fue el impacto en la deuda. Es una experiencia de escritorio embutida en mobile.
2. **Pila de Métricas Demasiado Larga (Vertical Sprawl):**
   * El grid de métricas secundarias en mobile utiliza `grid-cols-1`, lo que apila 4 tarjetas de tamaño completo una debajo de otra, consumiendo más de 450px de altura vertical antes de que el usuario pueda ver los gráficos o el desglose.
3. **Ergonomía de Acciones y Alcance del Pulgar (Thumb Zone Penalty):**
   * Todas las acciones críticas (Actualizar saldo, Abrir Telegram, Bloquear sesión) están situadas en la parte superior derecha (`HeaderBar`), la zona más incómoda y lejana para la operación con una sola mano en pantallas de más de 6 pulgadas.
4. **Formulario de Login Rígido ante Teclado Virtual:**
   * La pantalla de `/login` utiliza `min-h-screen` (`100vh`), lo cual genera saltos de layout y barras de scroll no deseadas cuando el teclado virtual de iOS o Android se despliega. Además, el input no cuenta con `inputMode="numeric"`, lo que obliga al usuario a alternar manualmente el teclado del móvil para tipear dígitos.
5. **Gráficos en Anchos Reducidos (<380px):**
   * El gráfico temporal (`AreaChart`) en pantallas angostas tiende a encimar etiquetas de fecha en el eje X, mientras que las tarjetas no tenían padding adaptativo proporcional a la escala mobile.

---

## 2. Principios Rectores: "Mobile-First Financial Companion"

1. **Cero Scroll Horizontal Involuntario (`overflow-x: clip`):**
   * Ningún elemento o tabla de la aplicación debe desbordar horizontalmente el ancho de pantalla del dispositivo.
2. **Patrón Híbrido "Table-to-Card Feed":**
   * En pantallas grandes (`≥640px`), se mantiene la vista tabular analítica completa.
   * En smartphones (`<640px`), la tabla muta automáticamente a una lista de **Tarjetas de Transacción Táctiles** con jerarquía visual financiera directa (avatar, pagador, concepto, monto en ARS, badge de clasificación e impacto de deuda).
3. **Zona de Alcance del Pulgar (Thumb-Friendly Navigation):**
   * En mobile se proyecta una **Cápsula Flotante Inferior** (`MobileBottomDock`) anclada a la base de la pantalla con acceso instantáneo a sincronizar, abrir Telegram y bloquear sesión.
4. **Densidad de Información Eficiente (Grilla 2x2):**
   * Las 4 métricas secundarias se reorganizan en una grilla simétrica de 2x2 en mobile, reduciendo el desplazamiento vertical a la mitad y permitiendo una visualización de un solo golpe de vista.
5. **Respeto de Áreas Seguras del Hardware (Safe Area Insets):**
   * Soporte explícito para notch, Dynamic Island y barra de gestos de inicio de iPhone/Android mediante `env(safe-area-inset-bottom)` y `env(safe-area-inset-top)`.

---

## 3. Especificación Detallada por Componente

### A. Barra de Navegación y Dock Inferior Móvil (`HeaderBar.tsx` & `MobileBottomDock.tsx`)

#### En la Barra Superior (`HeaderBar`):
* En mobile (`<sm`), se compacta el isotipo y el título.
* Se retiran los botones de acción del header móvil para evitar aglomeración en la parte superior y se trasladan al dock inferior.
* Se conserva el indicador del Webhook en formato miniatura con el doble anillo radar visible en mobile.

#### Cápsula Flotante Inferior (`MobileBottomDock`):
```text
┌────────────────────────────────────────────────────────┐
│                   [ Vista Mobile ]                     │
│                                                        │
│                    Contenido Web                       │
│                                                        │
│        ╭──────────────────────────────────────╮        │
│        │ [🔄 Sync]   [✈️ Telegram]   [🔒 Lock] │ ◄─────┼── Dock Flotante (Glass)
│        ╰──────────────────────────────────────╯        │
│                    ── barra home ──                    │
└────────────────────────────────────────────────────────┘
```
* **Ubicación:** `fixed bottom-4 inset-x-4 sm:hidden z-40`.
* **Estilo:** Píldora de glassmorphism oscuro (`bg-slate-900/85 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-5 py-2.5 flex items-center justify-around`).
* **Botones Táctiles (Mínimo 44px touch target):**
  1. **Actualizar Saldo:** Botón con icono `RefreshCw` giratorio al sincronizar y texto "Actualizar".
  2. **Abrir Telegram:** Botón destacado con gradiente índigo y acceso directo al bot `@AgykeBot`.
  3. **Bloquear:** Botón sutil con icono `Lock` para cierre de sesión instantáneo.
* **Separación de Contenido:** El contenedor principal incorpora `pb-28` en mobile para que el dock flotante nunca tape las últimas transacciones.

---

### B. Master Balance Hero Mobile (`MasterBalanceHero.tsx`)

#### Optimizaciones para Pantallas Pequeñas:
1. **Padding Adaptativo:** Reducción de `p-6` a `p-4 sm:p-6` para no desperdiciar pantalla útil en los márgenes.
2. **Escalado Tipográfico:**
   * La cifra principal usa `text-3xl sm:text-5xl` con `tracking-tight` para que montos millonarios (ej. `$ 1.250.000,00`) no desborden en anchos de 360px.
3. **Flujo de Cuentas Compacto:**
   * En mobile, el contenedor del deudor y acreedor se ajusta a un ancho fluido (`w-full`) con distribución simétrica (`justify-between`), avatares de 36px y flecha de dirección compacta con micro-pulsación luminosa.

---

### C. Métricas Secundarias en Grilla 2x2 (`StatMetricCard.tsx`)

#### Rediseño Estructural:
* En mobile (`<sm`): Se renderiza en **`grid grid-cols-2 gap-2.5`** en lugar de `grid-cols-1`.
* **Ajuste de Tarjeta (`StatMetricCard`):**
  * Padding compacto: `p-3.5 sm:p-5`.
  * Tamaño de fuente adaptativo: Cifra en `text-xl sm:text-2xl font-bold`.
  * Subtítulos secundarios concisos para mobile.
  * Iconos en caja de `p-2 rounded-lg`.
* **Resultado:** Las 4 tarjetas (`Total Histórico`, `Compartido 50/50`, `Favores 100%`, `Pendientes Muro`) quedan perfectamente encuadradas en 2 filas compactas, consumiendo apenas 180px de alto.

---

### D. Sección de Analítica y Gráficos (`AnalyticsSection.tsx`)

#### 1. Gráfico de Evolución Temporal (`AreaChart`):
* **Altura Adaptativa:** `h-52 sm:h-60`.
* **Eje X (Fechas):** `interval="preserveStartEnd"` para evitar que las etiquetas colisionen en viewports angostos.
* **Márgenes SVG:** `margin={{ top: 10, right: 10, left: -25, bottom: 0 }}` para maximizar el área visible de la curva.
* **Tira de Métricas al Pie:** En mobile pasa a `grid-cols-3 gap-1.5` con tipografía condensada de 11px.

#### 2. Donut Chart & Stack de Desglose:
* **Centro Concentrico Móvil:** Disco central de 100px (`w-24 h-24 sm:w-28 sm:h-28`) con tipografía ajustada para no chocar con el anillo interno.
* **Radio Adaptativo:** `innerRadius={58}` y `outerRadius={78}` en mobile.
* **Touch Feedback:** Soporte de tap directo en porciones y en las filas del desglose.
* **Touch Targets Accesibles:** Cada fila del desglose cuenta con altura mínima de 44px para cumplir los estándares táctiles de iOS y Android.

---

### E. Tabla Dual Responsiva: Table vs Transaction Card Feed (`TransactionsTable.tsx`)

#### 1. Vista Móvil Automática (`block sm:hidden`):
Se abandona la tabla horizontal en mobile en favor de un **Feed de Tarjetas de Gastos**:

```text
┌────────────────────────────────────────────────────────┐
│ [Avatar] Lautaro                      28 sep · 14:30   │
│ Asado con amigos y bebidas                             │
│                                                        │
│ [ 50/50 Mitad ]             $ 45.000 ARS (+$22.500)    │
└────────────────────────────────────────────────────────┘
```
* **Estructura de cada Tarjeta Móvil:**
  1. **Fila Superior:** Avatar del usuario pagador + Nombre en negrita + Fecha y hora en gris sutil a la derecha.
  2. **Cuerpo Central:** Concepto del gasto en tipografía blanca destacada (`text-sm font-semibold text-slate-100`).
  3. **Fila Inferior:** Badge de clasificación semántica (`BadgeClassification`) a la izquierda, y a la derecha el monto total formateado en ARS junto al impacto neto de deuda coloreado en verde (`+$...`) o rojo (`-$...`).
* **Borde y Vidrio:** `p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.06] hover:bg-slate-800/60 active:scale-[0.99] transition-all`.

#### 2. Filtros y Búsqueda en Mobile:
* La barra de búsqueda ocupa el ancho completo en mobile (`w-full`).
* Los chips de filtro (`Todos`, `50/50`, `Favor`, `Deuda`, `Personal`) cuentan con scroll horizontal con desvanecimiento táctil (`overflow-x-auto` con `-webkit-overflow-scrolling: touch`).

---

### F. Pantalla de Autenticación Móvil (`/login`)

1. **Altura Dinámica con `100dvh`:**
   * Se sustituye `min-h-screen` por `min-h-[100dvh]`. Esto previene que la tarjeta se desplace violentamente o cree barras de scroll indeseadas cuando el navegador de iOS Safari o Chrome expande o contrae la barra de direcciones o abre el teclado virtual.
2. **Teclado Numérico Automático:**
   * El input de PIN incorpora los atributos `inputMode="numeric"` y `pattern="[0-9]*"`. Al tocar el campo en cualquier teléfono, se abre directamente el teclado numérico de dígitos grandes en lugar del teclado alfabético.
3. **Ergonomía de Tarjeta:**
   * La tarjeta de login se adapta con `w-full max-w-sm px-5 py-6 sm:p-8` para lucir proporcionada en pantallas pequeñas (iPhone SE / Galaxy A).

---

## 4. Guía de Utilidades y Ajustes CSS (`globals.css`)

```css
/* Touch Manipulation: elimina el retraso de 300ms en taps móviles */
html, button, input, a {
  touch-action: manipulation;
}

/* Safe Area Insets para dispositivos con notch o home bar */
.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

.pt-safe {
  padding-top: max(1rem, env(safe-area-inset-top));
}

/* Prevención de desborde horizontal accidental */
body {
  overflow-x: hidden;
  position: relative;
  width: 100%;
}
```

---

## 5. Plan de Ejecución SDD (Fase 9 en Roadmap)

| Tarea | Título | Componente | Criterio de Aceptación |
| :--- | :--- | :--- | :--- |
| **UI-25** *(MOB-01)* | Tokens Mobile, Safe Areas y `touch-action` en `globals.css` | `globals.css` | Añadir `touch-action: manipulation`, utilidades safe area y `overflow-x: hidden` estricto. |
| **UI-26** *(MOB-02)* | Grilla 2x2 para Métricas Secundarias en Dashboard | `StatMetricCard.tsx`, `page.tsx` | En `<sm` renderizar 2 columnas compactas en lugar de 1 sola columna. |
| **UI-27** *(MOB-03)* | Rediseño Dual de `TransactionsTable` (Table vs Card Feed) | `TransactionsTable.tsx` | En `<sm` renderizar feed de tarjetas sin scroll horizontal; en `≥sm` tabla completa. |
| **UI-28** *(MOB-04)* | Cápsula Flotante Inferior de Navegación (`MobileBottomDock`) | `MobileBottomDock.tsx`, `page.tsx` | Barra flotante inferior fija con Sync, Telegram y Lock en smartphones. |
| **UI-29** *(MOB-05)* | Adaptabilidad Táctil en `AnalyticsSection` y Donut Chart | `AnalyticsSection.tsx` | Donut responsive, touch targets de 44px en desglose y eje X adaptativo. |
| **UI-30** *(MOB-06)* | Optimización de Login Mobile con `100dvh` e `inputMode="numeric"` | `login/page.tsx` | Apertura directa de teclado numérico y altura `100dvh` sin saltos de layout. |
| **UI-31** *(MOB-07)* | Verificación Integral Mobile (iOS Safari / Android Chrome) | `web/` | Probar en emuladores / viewports de 360px, 390px y 414px con 0 warnings. |

---

## 6. Verificación y Aprobación
* [ ] La especificación no altera la lógica financiera ni los modelos de base de datos.
* [ ] No se requieren migraciones SQL ni cambios en el bot de Telegram.
* [ ] Cumple con las guías de diseño de Apple HIG y Google Material Design para áreas táctiles mínimas (44x44px).
