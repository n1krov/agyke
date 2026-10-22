# SPEC_EDITORIAL_DESIGN_SYSTEM_AND_DUAL_THEME.md
# Especificación: Rediseño Editorial "Financial Craft", Dual Theme (Claro / Oscuro) y Purga de Anti-Patterns IA Dev

> **Estado:** 📝 **ESPECIFICACIÓN FORMAL (FASE 11)**  
> **Prioridad:** P0 (Inmediata)  
> **Dominio:** Frontend / UI-UX (`web/`)  
> **Autor:** Desarrollador Full-Stack Senior / Arquitectura Agyke  
> **Fecha:** 22 de Octubre de 2026  

---

## 1. Diagnóstico y Motivación

La interfaz actual de Agyke arrastra una sobrecarga de recursos visuales genéricos propios de plantillas o prototipos generados por IA (el llamado síndrome *"AI Dev UI"*):
* **Orbes difusos flotantes:** Círculos violetas, esmeraldas y cyan con desenfoque extremo (`blur-[120px]`) que distraen la atención financiera y consumen recursos de renderizado.
* **Mallas artificiales de fondo:** Patrones pseudo-futuristas de cuadrícula (`bg-grid-mesh`) que ensucian el contraste del texto.
* **"Icon-spam" en cajas de colores pastel:** Cada tarjeta métrica (`StatMetricCard`) exhibe un icono predeterminado genérico de Lucide (`DollarSign`, `CreditCard`, `TrendingUp`, `Clock`) dentro de un contenedor cuadrado redondeado de color fluorescente (`indigo`, `cyan`, `emerald`, `amber`).
* **Glassmorphism saturado:** Paneles de vidrio translúcido con bordes blancos brillantes descalibrados y sombras de colores intensos.
* **Monocultura Dark Mode:** Falta absoluta de soporte para Modo Claro (Light Mode), forzando una única paleta oscura fija que no se adapta a las condiciones lumínicas del usuario diurno ni a preferencias de accesibilidad.

### El Objetivo
Realizar una **refundación visual radical** hacia una estética **Editorial Financial Craft**, inspirada en los estándares de diseño de producto de alta gama más respetados de la industria tecnológica (Linear, Stripe Press, Monzo, Ramp y Vercel Design System):
1. **Erradicación de todo artefacto decorativo artificial** (cero orbes, cero mallas, cero gradientes borrosos de fondo, cero icon-spam).
2. **Tipografía como protagonista supremo:** Explotar la fuerza formal de `Geist Sans` y `Geist Mono` con variantes numéricas tabulares estrictas (`tabular-nums`), espaciado métrico calibrado y pesos contundentes.
3. **Superficies precisas con bordes milimétricos hairline:** Planos limpios, contraste riguroso y micro-bordes de 1px con elevaciones sobrias.
4. **Sistema Dual Theme Nativo (Claro / Oscuro):** Soporte de primera clase para **Modo Claro** (marfil/papel estucado, blanco puro, tinta negra profunda) y **Modo Oscuro** (obsidiana mate, grafito neutro, texto tiza), con selector interactivo (`ThemeToggle`), persistencia en `localStorage` y prevención absoluta de parpadeo (Anti-FOUC).
5. **Iconografía funcional, sobria y de autor:** Los íconos se reservan exclusivamente para acciones operativas (tema, calendario, refresco, navegación, dirección financiera), con trazo fino estilizado (1.5px / 1.25px stroke) y monocromáticos.

---

## 2. Anti-Patterns Erradicados (The Purge)

| Elemento Anterior ("AI Dev") | Diagnóstico | Reemplazo ("Editorial Financial Craft") |
| :--- | :--- | :--- |
| **Orbes de gradiente flotantes** (`animate-ambient-slow`, `animate-ambient-reverse`, orbes de 600px violeta/esmeralda) | Ruido visual, apariencia genérica de prototipo IA, caída de frames en GPU móvil. | **Fondo arquitectónico plano y limpio:** Canvas monocromático calibrado (Marfil mate `#F9F9FB` en claro, Carbón obsidiana `#0A0B0E` en oscuro). |
| **Malla de fondo (`bg-grid-mesh`)** | Efecto retro-futurista cliché que resta seriedad bancaria/contable. | **Superficies continuas:** Ausencia de rejillas decorativas. El ritmo lo marcan las tarjetas y el whitespace. |
| **Cajas cuadradas con iconos de colores** (`bg-indigo-500/10 text-indigo-400`, etc.) | Recurso predeterminado de librería que no aporta información de valor. | **Jerarquía tipográfica editorial:** Métricas inspiradas en terminales financieras: etiqueta compacta en mayúsculas sobrias (`text-[11px] font-mono tracking-wider`), valor numérico monumental y deltas sutiles. |
| **Glassmorphism translúcido brillante** (`backdrop-blur-xl border-white/10`) | Efecto plástico, legibilidad dependiente del fondo y bordes saturados. | **Tarjetas opacas de borde fino (Hairline Cards):** Fondo sólido o micro-sutil (`bg-white` en claro, `#121318` en oscuro) con bordes precisos `1px solid` (`border-neutral-200` / `border-neutral-800`). |
| **Fondo oscuro único forzado** (`#080B11` hardcodeado en `body`) | Inaccesible en exteriores diurnos; falta de versatilidad de producto. | **Dual Theme Engine:** Selector accesible Sol/Luna con tokens semánticos CSS y sincronización instantánea. |

---

## 3. Especificación de la Paleta y Tokens de Diseño

La nueva paleta se estructura mediante variables CSS semánticas en `globals.css` bajo `:root` (Modo Claro) y `.dark` (Modo Oscuro), permitiendo que todas las vistas consuman tokens estandarizados.

### 3.1. Tokens Semánticos Fundamentales

| Token CSS | Rol Semántico | Modo Claro (Default/Light) | Modo Oscuro (`.dark`) |
| :--- | :--- | :--- | :--- |
| `--canvas` | Fondo base de la página | `#F9F9FB` (Off-white / Marfil neutro) | `#0A0B0E` (Obsidiana carbón) |
| `--surface` | Fondo de tarjetas y paneles primarios | `#FFFFFF` (Blanco puro estucado) | `#121318` (Grafito profundo) |
| `--surface-raised` | Fondo de elementos flotantes/docks/dropdowns | `#FFFFFF` (con sombra sutil) | `#181A20` (Grafito elevado) |
| `--surface-subtle` | Fondos de hover, chips y badges secundarios | `#F1F2F5` (Gris claro neutral) | `#1A1C24` (Grafito sutil) |
| `--border-hairline` | Bordes estructurales milimétricos (1px) | `#E4E5EA` (Gris tenue de alta definición) | `#22242E` (Gris oscuro preciso) |
| `--border-hover` | Borde en estado interactivo / focus | `#D0D2DC` | `#333745` |
| `--text-primary` | Títulos, montos y textos de máximo contraste | `#0E0F12` (Tinta negra pura) | `#F3F4F6` (Tiza blanca) |
| `--text-secondary` | Subtítulos, descripciones y valores secundarios | `#525866` (Gris plomo legible) | `#9CA3AF` (Gris neutro) |
| `--text-muted` | Etiquetas micro, fechas, leyendas y placeholders | `#868C98` (Gris tenue) | `#6B7280` (Gris atenuado) |
| `--brand-accent` | Acento de identidad Agyke | `#0F172A` (Azul medianoche / Slate 900) | `#F8FAFC` (Blanco nítido) |

### 3.2. Acentos Semánticos Financieros (Desaturados y Precisos)

Se destierran los colores de neón. La semántica de saldo y botones responde a tonos editoriales rigurosos:

* **Positivo / Acreedor (Me deben / Saldo a favor):**
  * *Modo Claro:* Texto `#15803D` (Esmeralda bosque), fondo chip `#F0FDF4`, borde `#DCFCE7`.
  * *Modo Oscuro:* Texto `#4ADE80` (Menta suave), fondo chip `#052E16`, borde `#14532D`.
* **Negativo / Deudor (Debo / Saldo en contra):**
  * *Modo Claro:* Texto `#B91C1C` (Carmín profundo), fondo chip `#FEF2F2`, borde `#FEE2E2`.
  * *Modo Oscuro:* Texto `#F87171` (Coral tenue), fondo chip `#450A0A`, borde `#7F1D1D`.
* **Neutro / Saldado:**
  * *Modo Claro:* Texto `#525866`, fondo chip `#F1F2F5`, borde `#E4E5EA`.
  * *Modo Oscuro:* Texto `#9CA3AF`, fondo chip `#1A1C24`, borde `#22242E`.

---

## 4. Arquitectura del Dual Theme Engine (Claro / Oscuro)

### 4.1. Estrategia de Clases y Atributos
* Se adopta el estándar de clase `.dark` sobre el elemento raíz `<html>`.
* Al cambiar el tema, se actualiza la clase en `document.documentElement` y se almacena la preferencia en `localStorage.setItem('agyke-theme', 'light' | 'dark')`.

### 4.2. Blindaje Anti-FOUC (Flash of Unstyled Color)
Para evitar el molesto parpadeo blanco/negro antes de que cargue React, se inyecta un script inline bloqueante de 5 líneas en el `<head>` de `web/src/app/layout.tsx`:

```html
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{const t=localStorage.getItem('agyke-theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
  }}
/>
```

### 4.3. Componente `ThemeToggle`
* **Desktop (`HeaderBar`):** Botón compacto de doble pastilla o switch interactivo con iconos estilizados de Sol (`Sun`) y Luna (`Moon`) con trazo de 1.5px. Muestra visualmente cuál tema está activo con un indicador sutil.
* **Mobile (`MobileBottomDock`):** Botón táctil con target accesible de 44px integrado de forma armoniosa junto a los accesos directos de navegación.

---

## 5. Especificación de Componentes Rediseñados

### 5.1. `MasterBalanceHero.tsx`
* **Antes:** Bloque con halo perimetral pulsante de respiración (`animate-halo-breathe`), gradiente radial esmeralda/carmín estridente y tipografía con sombra.
* **Ahora:** 
  * Bloque de corte editorial con superficie nítida (`bg-surface border border-hairline rounded-2xl p-6 sm:p-8`).
  * Micro-etiqueta superior: `BALANCE NETO CONSOLIDADO` en `font-mono text-[11px] tracking-widest text-muted`.
  * Cifra monumental: Fuente `Geist Mono` con `tracking-tight text-4xl sm:text-6xl font-medium tabular-nums`.
  * Pastilla de resolución financiera: Indicador de quién paga a quién en prosa clara con nombres tipográficos en negrita y avatar monocromático con micro-borde, prescindiendo de flechas fosforescentes.

### 5.2. `StatMetricCard.tsx`
* **Antes:** Contenedores con gradientes de colores y cajas de iconos en pasteles brillantes (`DollarSign`, `CreditCard`, `TrendingUp`, `Clock`).
* **Ahora:**
  * Tarjeta minimalista de alta densidad:
    * Fila superior: Título en prosa clara o `font-mono text-xs uppercase tracking-wider text-muted`. Sin icono decorativo.
    * Centro: Monto monumental con `Geist Mono font-medium text-2xl sm:text-3xl tabular-nums text-primary`.
    * Fila inferior: Micro-subtítulo explicativo en `text-xs text-secondary` con contexto real del gasto.
  * Opcionalmente, para la tarjeta de pendientes de Muro, un badge numérico ultra-sobrio tipo pastilla con punto pulsante minimalista monocromático.

### 5.3. `HeaderBar.tsx` y `MobileBottomDock.tsx`
* **HeaderBar:**
  * Línea horizontal hairline de separación inferior (`border-b border-hairline bg-surface/90 backdrop-blur-md`).
  * Logo Agyke: Tipografía editorial sobria con isotipo geométrico minimalista (cero brillos fluorescentes).
  * Pills de navegación (`Inicio`, `Analítica`, `Muro`): Pastillas con tipografía limpia, estado activo con fondo sólido neutro de alto contraste (`bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900`).
  * Indicador de Webhook: Punto semántico minimalista de 6px con texto fino `Webhook Activo` (sin doble anillo radar fosforescente).
  * Inclusión del nuevo componente **`ThemeToggle`**.
* **MobileBottomDock:**
  * Dock flotante con fondo opaco estilizado (`bg-surface/95 border border-hairline shadow-lg`), targets táctiles de 44px, tipografía nítida y botón de cambio de tema integrado.

### 5.4. Gráficos Recharts en `AnalyticsSection.tsx` y `/analytics`
* Adaptación dinámica de todos los gráficos Recharts al tema activo:
  * Grilla cartesiana: `stroke="#E4E5EA"` (claro) / `stroke="#22242E"` (oscuro).
  * Ejes X/Y: Fuentes `Geist Mono text-[11px]`, color de tick `#868C98` (claro) / `#6B7280` (oscuro).
  * Tooltips de Recharts: Caja sólida estilizada con sombra tenue (`bg-surface border border-hairline text-primary rounded-lg p-3 text-xs shadow-md`).
  * Donut Chart: Paleta cromática equilibrada y sobria (Slate, Indigo grafito, Oliva, Ocre y Ceniza) evitando colores flúor.

### 5.5. `TransactionsTable.tsx` y `/muro`
* Filas con separación por borde hairline (`border-b border-hairline`).
* Estados de hover sutiles (`hover:bg-neutral-50 dark:hover:bg-neutral-900/40`).
* Badges de clasificación (`50`, `100`, `-100`, `0`) rediseñados como pastillas tipográficas monocromáticas con micro-bordes elegantes.

### 5.6. Pantalla de Autenticación `/login`
* Eliminación de todos los orbes de luz y animaciones de haz diagonal estridentes.
* Enfoque en una tarjeta de acceso monolítica y pura:
  * Isotipo Agyke en negro/blanco puro.
  * Título y subtítulo con tipografía refinada.
  * Indicadores de PIN minimalistas (círculos discretos con relleno suave al tipear).
  * Teclado numérico y botón de desbloqueo con acabados táctiles limpios y micro-interacción refinada.

---

## 6. Plan de Ejecución y Tareas (Fase 11)

Las tareas de implementación para esta fase se registrarán en `docs/board.json` y `docs/TASKS.md` bajo el rango **UI-39 a UI-46**:

1. **`UI-39` (P0):** Sistema de Tokens Dual Theme y Limpieza de Anti-Patterns en `globals.css`.
   * Definición de variables CSS semánticas para `:root` y `.dark`.
   * Eliminación completa de keyframes y utilidades de orbes (`ambient-slow`, `ambient-reverse`), gradientes radiales fluorescentes y `bg-grid-mesh`.
2. **`UI-40` (P0):** Motor de Temas, Script Anti-FOUC y Componente `ThemeToggle`.
   * Inyección del script inline bloqueante en `web/src/app/layout.tsx`.
   * Creación del hook y componente `ThemeToggle` con persistencia en `localStorage`.
3. **`UI-41` (P0):** Rediseño Editorial de `HeaderBar` y `MobileBottomDock`.
   * Integración del `ThemeToggle`.
   * Limpieza del radar del webhook hacia punto semántico minimalista.
   * Navegación por pills con estilo editorial de alto contraste.
4. **`UI-42` (P0):** Rediseño Editorial de `MasterBalanceHero` y `StatMetricCard`.
   * Supresión de contenedores de iconos de colores.
   * Tipografía monumental con `Geist Mono` tabular.
   * Presentación editorial de acreedor/deudor.
5. **`UI-43` (P1):** Adaptación de Recharts y Analítica a Paleta Dual Theme.
   * Adaptación de colores de ejes, grillas, tooltips y series en `AnalyticsSection.tsx` y `/analytics`.
   * Rediseño sobrio de tooltips y KPIs centrales.
6. **`UI-44` (P1):** Rediseño Editorial de `TransactionsTable` y `/muro`.
   * Estilo de tabla y cards mobile sin glassmorphism plástico.
   * Badges de clasificación sobrios con micro-bordes.
7. **`UI-45` (P1):** Rediseño Editorial de `/login`.
   * Eliminación de orbes y fondos espaciales en la pantalla de PIN.
   * Tarjeta monolítica y teclado numérico sobrio.
8. **`UI-46` (P2):** Auditoría Visual, Accesibilidad de Contraste (WCAG AA/AAA) y Cero Regresiones.
   * Verificación en navegadores móviles y desktop en ambos modos (Claro y Oscuro).
   * Verificación de build y pruebas (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`).

---

## 7. Criterios de Aceptación Innegociables

1. **Cero Orbes y Cero Mallas:** No debe existir ninguna clase `bg-grid-mesh`, `animate-ambient-slow`, `animate-ambient-reverse`, ni blobs borrosos en el DOM.
2. **Cero Icon-Spam en Tarjetas:** Las tarjetas de métricas no deben contener cajas de iconos coloreadas genéricas.
3. **Dual Theme Operativo:** El usuario puede alternar entre Claro y Oscuro con 1 clic desde el header o dock móvil; la preferencia persiste al recargar la página.
4. **Cero FOUC:** Al recargar la página en modo claro o modo oscuro, no debe existir ningún destello o parpadeo del tema opuesto.
5. **Calidad y CI Intactas:** Cero errores de TypeScript, cero advertencias de ESLint y suite de tests 100% en verde.
