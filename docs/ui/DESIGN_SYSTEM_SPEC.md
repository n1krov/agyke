# DESIGN_SYSTEM_SPEC.md - Especificación Maestra de UI/UX (Agyke)

## 1. Visión y Propósito
El objetivo principal del nuevo diseño de **Agyke** es transformar el dashboard en una experiencia financiera **clara, moderna, ordenada y visualmente atractiva**.

La interfaz debe responder a la pregunta fundamental de los usuarios en **menos de 3 segundos**:
> **"¿Quién le debe a quién y cuánto?"**

Todo el sistema visual debe construirse sobre principios de simplicidad escandinava combinada con elementos *Fintech Premium* (tipo Linear, Raycast o Apple Wallet): fondos profundos de alto contraste, tipografía nítida con números tabulares para montos monetarios, jerarquía sin ruido y microinteracciones fluidas.

---

## 2. Pilares de Diseño (UX Core Principles)

1. **Claridad Financiera Inmediata (Glanceability):**
   * El balance consolidado (`net_balance`) es el elemento jerárquico supremo de la pantalla. No compite con ningún otro gráfico o tarjeta secundaria.
2. **Escaneo sin Fatiga Visual (Dark-First Elegance):**
   * Una paleta oscura refinada (*Obsidian Slate*) que evita el negro puro `#000000` en favor de tonos carbón azulados (`#0B0F19`, `#111827`) que reducen el contraste agresivo y aportan profundidad.
3. **Números Tabulares Consistentes:**
   * Todos los montos financieros se renderizan con fuentes de ancho fijo (`tabular-nums` / `font-mono`) para evitar saltos visuales al comparar columnas de números y cifras que cambian.
4. **Semántica de Color Funcional (No Decorativa):**
   * Verde Esmeralda (`#10B981`): Saldos a favor o cuentas saldadas.
   * Rojo Carmesí / Coral (`#F43F5E`): Deudas pendientes o saldos en contra.
   * Violeta / Índigo Eléctrico (`#6366F1`): Elementos de interacción primaria y acentos de marca.
   * Ámbar Cálido (`#F59E0B`): Elementos pendientes de revisión en la cola de Agyke.
5. **Feedback Táctil y Micro-transiciones:**
   * Hover states con elevación sutil (`translate-y-0.5`), desenfoques de fondo (*Backdrop Blur*) y bordes semi-transparentes (*Border Glow*) que brindan sensación de superficie física pulida.

---

## 3. Arquitectura de Pantalla y Wireframe Mental

La pantalla del Dashboard se divide en 4 bloques verticales perfectamente jerarquizados:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  [Header / Topbar]                                                     │
│  Logo Agyke + Status Bot Webhook + Botón Refresco + Switch Rápido      │
├────────────────────────────────────────────────────────────────────────┤
│  [Hero KPI: Master Balance Card]                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ESTADO DE SALDO NETO                                            │  │
│  │  $ 15.000 (Lautaro le debe a Cholo)                              │  │
│  │  Sub-chips: Último movimiento | Impacto 50/50 | Acceso Telegram  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│  [Grid de Métricas Secundarias (4 Columnas)]                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Total Mes    │ │ Compartidos  │ │ Personales   │ │ Pendientes   │   │
│  │ $ 120.400    │ │ $ 84.000     │ │ $ 36.400     │ │ 2 items      │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
├────────────────────────────────────────────────────────────────────────┤
│  [Analítica y Gráficos (2 Columnas)]                                   │
│  ┌───────────────────────────────┐ ┌───────────────────────────────┐   │
│  │ Evolución de Balance Temporal │ │ Distribución por Categoría/P. │   │
│  │ (AreaChart suave con gradiente)│ │ (DonutChart interactivo)      │   │
│  └───────────────────────────────┘ └───────────────────────────────┘   │
├────────────────────────────────────────────────────────────────────────┤
│  [Historial de Transacciones y Filtros]                                │
│  Buscador en tiempo real + Chips de Filtro [Todos | 50 | 100 | -100 | 0]│
│  Tabla pulida con avatares de usuario, fecha amigable y badges de tags │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Estándares Técnicos para Frontend (Next.js 16 + Tailwind v4)

* **Tailwind CSS v4 Nativo:** Uso del nuevo sistema `@theme` en CSS para registrar los tokens de diseño de forma centralizada sin necesidad de archivos de configuración fragmentados.
* **Componentes Funcionales Modulares:** Separación de la pantalla monolítica actual (`page.tsx` de 400+ líneas) en componentes especializados dentro de `web/src/components/ui/` y `web/src/components/dashboard/`.
* **Cero Render Loops:** Prohibido el uso de `setState` incondicional en `useEffect`.
* **Iconografía Consistente:** Uso exclusivo de `lucide-react` con `strokeWidth={1.75}` para mantener uniformidad de trazo en toda la app.
