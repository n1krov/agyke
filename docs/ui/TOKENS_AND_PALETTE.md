# TOKENS_AND_PALETTE.md - Paleta Cromática, Tipografía y Tokens de Estilo

Este documento define la base matemática y cromática del nuevo sistema visual de **Agyke** para su implementación en Tailwind CSS v4 y Next.js.

---

## 1. Paleta Cromática Semántica

### A. Fondos y Superficies (Dark Canvas)
Evitamos el negro plano para generar profundidad atmosférica y tridimensionalidad con capas (*Z-index layers*):

| Nombre de Token | Código HEX | Rol Semántico / Uso |
| :--- | :--- | :--- |
| `--surface-canvas` | `#080B11` | Fondo principal de toda la página (Ultra Dark Obsidian). |
| `--surface-card` | `#0F1523` | Fondo de tarjetas y paneles con opacidad 80% + blur. |
| `--surface-card-subtle` | `#161F33` | Fondos de inputs, chips inactivos y filas alternadas. |
| `--surface-overlay` | `#1E293B` | Modales, popovers, tooltips flotantes. |
| `--border-subtle` | `rgba(255, 255, 255, 0.07)` | Delimitadores estructurales finos. |
| `--border-highlight` | `rgba(99, 102, 241, 0.35)` | Bordes activos al hacer hover o focus. |

---

### B. Colores de Balance Financiero
El estado financiero debe comunicarse instantáneamente mediante el color de fondo y borde del Hero Card:

| Estado Financiero | Color Principal | Glow / Sombra | Significado |
| :--- | :--- | :--- | :--- |
| **A Favor (Crédito)** | `#10B981` (Emerald 500) | `rgba(16, 185, 129, 0.2)` | El otro usuario te debe dinero. Estado positivo. |
| **En Contra (Deuda)** | `#F43F5E` (Rose 500) | `rgba(244, 63, 94, 0.2)` | Vos le debés dinero al otro usuario. Estado de atención. |
| **Saldado (Cero)** | `#06B6D4` (Cyan 500) | `rgba(6, 182, 212, 0.2)` | Cuentas en equilibrio ($0 neto). Paz mental. |

---

### C. Clasificaciones de Gastos Agyke (Badges de los 4 Botones)
Cada una de las 4 clasificaciones de negocio tiene un badge dedicado para identificación instantánea en la tabla:

| Botón | Concepto | Color Fondo | Color Borde | Color Texto |
| :---: | :--- | :--- | :--- | :--- |
| **`50`** | Compartido 50/50 | `rgba(99, 102, 241, 0.15)` | `rgba(99, 102, 241, 0.4)` | `#818CF8` (Indigo) |
| **`100`** | Favor 100% (Pagado por mí) | `rgba(16, 185, 129, 0.15)` | `rgba(16, 185, 129, 0.4)` | `#34D399` (Emerald) |
| **`-100`**| Deuda Propia (Pagado por otro)| `rgba(244, 63, 94, 0.15)` | `rgba(244, 63, 94, 0.4)` | `#FB7185` (Rose) |
| **`0`**   | Gasto Personal (Sin deuda)    | `rgba(148, 163, 184, 0.12)`| `rgba(148, 163, 184, 0.3)`| `#94A3B8` (Slate) |

---

## 2. Tipografía y Escala de Texto

* **Familia Primaria:** Fuente del sistema moderna con fallback optimizado:
  ```css
  font-family: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  ```
* **Montos Monetarios y Métricas:** Fuente monoespaciada para alineación precisa:
  ```css
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  ```

### Escala de Tamaños y Jerarquía
* **Hero Balance:** `text-4xl md:text-5xl font-extrabold tracking-tight` (Ej: `$ 15.000,00`)
* **Títulos de Sección:** `text-lg md:text-xl font-semibold text-slate-100`
* **Etiquetas de KPI:** `text-xs font-medium uppercase tracking-wider text-slate-400`
* **Cifras de Tarjetas:** `text-2xl font-bold text-slate-100 tabular-nums`
* **Texto de Tabla / Body:** `text-sm font-normal text-slate-300`
* **Metadatos y Fechas:** `text-xs text-slate-500`

---

## 3. Elevaciones, Sombras y Efectos Glassmorphism

```css
/* Glass Card Premium */
.glass-panel {
  background: rgba(15, 21, 35, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.4);
}

/* Hover suave interactivo */
.glass-panel-interactive {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), 
              border-color 0.2s ease, 
              box-shadow 0.2s ease;
}

.glass-panel-interactive:hover {
  transform: translateY(-2px);
  border-color: rgba(99, 102, 241, 0.35);
  box-shadow: 0 12px 32px -8px rgba(99, 102, 241, 0.15);
}
```

---

## 4. Radios de Borde (Corner Radii)
* **Contenedores de Pantalla y Hero:** `rounded-2xl` (`16px` o `24px`).
* **Tarjetas Secundarias y Tablas:** `rounded-xl` (`12px` o `16px`).
* **Botones e Inputs:** `rounded-lg` (`8px` o `10px`).
* **Badges y Chips de Filtro:** `rounded-full` (`9999px`).
