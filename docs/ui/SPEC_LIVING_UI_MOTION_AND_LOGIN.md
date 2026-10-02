# SPEC_LIVING_UI_MOTION_AND_LOGIN.md - Especificación Técnica de Interfaz Viva, Dinamismo, Rediseño de Login y Gráfico de Tarta

> **Estado:** Aprobado / Listo para Implementación  
> **Área:** Frontend (`web/`)  
> **Tecnologías:** Next.js 16, Tailwind CSS v4, Lucide Icons, Recharts  
> **Objetivo:** Eliminar la sensación de estatismo en la interfaz mediante movimiento orgánico de fondo, elevar la experiencia visual y reactiva del login, y transformar el gráfico de tarta en un donut interactivo con KPI central dinámico.

---

## 1. Motivación y Diagnóstico Visual

### Diagnóstico Actual:
1. **Fondo Demasiado Plano y Estático:** La pantalla actual utiliza un fondo oscuro `#080B11` con un gradiente radial fijo. Carece de sensación de profundidad, atmósfera y vida, transmitiendo una sensación fría y rígida.
2. **Pantalla de Login Rígida:** La pantalla de autenticación actual cumple con su función técnica pero es estática: el botón y los campos no tienen micro-interacciones de retroalimentación rica (como sacudida ante clave incorrecta, orbes luminosos en órbita lenta o indicadores reactivos).
3. **Gráfico de Tarta Convencional:** El donut chart actual en `<AnalyticsSection />` es estático: muestra sectores fijos con un centro vacío sin información, una leyenda básica sin porcentajes calculados a simple vista y tooltips estándar que no aprovechan el espacio central para comunicar el gasto total o el desglose activo.

### Principio Rector: "Living Financial Interface"
* **Fluidez sin Distracción:** El movimiento debe ser sutil y de baja frecuencia (ciclos de 12s a 20s). No debe competir con los números financieros ni marear al usuario.
* **Aceleración por Hardware (GPU Pure CSS):** Cero librerías pesadas de JavaScript o WebGL para el fondo. Se utilizan únicamente transformaciones CSS compuestas (`transform: translate3d`, `opacity`, `filter: blur`) con `will-change: transform`, garantizando 60 FPS estables y consumo mínimo de batería.
* **Retroalimentación Táctil Inmediata:** Cada interacción (ingreso de PIN, hover en el gráfico, clic en botones) debe responder con micro-animaciones fluidas.

---

## 2. Atmósfera Viva de Fondo (Living Ambient Motion)

### A. Anatomía del Fondo Dinámico
El fondo de la aplicación (tanto en el Dashboard principal como en `/login`) incorporará un sistema de **orbes de luz ambiental multicapa** con movimiento continuo y suave:

```text
┌─────────────────────────────────────────────────────────────┐
│  [Orb Primario - Índigo / Violeta]                          │
│  (Órbita lenta elíptica, blur 80px, opacity 0.15 - 0.25)    │
│                     ┌────────────────────┐                  │
│                     │                    │                  │
│                     │  Tarjeta Principal │                  │
│                     │     Glassmorphism  │                  │
│                     │                    │                  │
│                     └────────────────────┘                  │
│                                                             │
│                      [Orb Secundario - Esmeralda / Cian]     │
│                      (Deriva contraria lenta, blur 90px)     │
└─────────────────────────────────────────────────────────────┘
```

### B. Especificación de Keyframes CSS (`globals.css`)
Se definirán dos animaciones clave de baja frecuencia:

1. **`ambient-float-slow`:**
   * Desplazamiento elíptico suave en los ejes X e Y con escala armónica.
   * `0%`: `transform: translate3d(0, 0, 0) scale(1);`
   * `50%`: `transform: translate3d(60px, -40px, 0) scale(1.12);`
   * `100%`: `transform: translate3d(0, 0, 0) scale(1);`
   * Duración: `18s` | Easing: `ease-in-out` | Iteración: `infinite`.

2. **`ambient-float-reverse`:**
   * Desplazamiento opuesto para generar contraste dinámico.
   * `0%`: `transform: translate3d(0, 0, 0) scale(1.05);`
   * `50%`: `transform: translate3d(-50px, 45px, 0) scale(0.92);`
   * `100%`: `transform: translate3d(0, 0, 0) scale(1.05);`
   * Duración: `22s` | Easing: `ease-in-out` | Iteración: `infinite`.

3. **`mesh-pulse-subtle`:**
   * Respiración suave del resplandor central de fondo:
   * Variación sutil de opacidad entre `0.10` y `0.20` en ciclos de `10s`.

### C. Patrón de Textura Sutil (Grid Mesh Grounding)
* Para evitar que las luces floten en un vacío desarticulado, se proyectará una cuadrícula o malla de micro-puntos (`radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`) con espaciado de 32px x 32px y máscara radial que se desvanece suavemente hacia los bordes.

---

## 3. Rediseño Elevado de la Pantalla de Login (`/login`)

### A. Nuevos Elementos Visuales y Micro-animaciones
1. **Contenedor Glassmorphism Flotante:**
   * Entrada animada al montar la página (`scale-up-fade`: de `scale(0.97)` y `opacity: 0` a `scale(1)` y `opacity: 1` en 400ms).
   * Borde reactivo que refleja sutilmente el movimiento de la luz ambiente.
2. **Isotipo Interactivo con Pulso de Energía:**
   * El isotipo de la balanza de Agyke contará con un halo difuso que pulsa armónicamente (`animate-pulse` con resplandor índigo de 40% de opacidad).
3. **Input de PIN con Feedback Dinámico:**
   * **Indicador de Longitud:** Micro-puntos reactivos o visualizador de caracteres que se iluminan al ingresar dígitos.
   * **Animación de Rechazo (Shake Effect):** Si el usuario ingresa un PIN incorrecto, la tarjeta o el input ejecutará una vibración horizontal de error:
     ```css
     @keyframes shake-x {
       0%, 100% { transform: translateX(0); }
       20%, 60% { transform: translateX(-6px); }
       40%, 80% { transform: translateX(6px); }
     }
     ```
     Acompañado de un borde momentáneo en rojo carmesí (`#F43F5E`) y desvanecimiento a los 2 segundos.
4. **Botón de Desbloqueo con Shimmer de Luz:**
   * Efecto de brillo diagonal que recorre el botón al hacer hover (`hover:brightness-110` + haz de luz animado).
   * Estado de carga con indicador de sincronización suave y transición sin salto visual al redirigir al Dashboard principal (`router.push('/')`).

---

## 4. Rediseño Radical del Gráfico de Tarta / Donut Chart (`<AnalyticsSection />`)

### A. De Tarta Plana a "Interactive KPI Donut"
El gráfico de distribución de gastos pasa de ser una figura inerte a un **centro de comando interactivo**:

```text
┌────────────────────────────────────────────────────────┐
│  Por Clasificación                       Distribución  │
│                                                        │
│                  ╭───────────────╮                     │
│               ╭──╯   50/50       ╰──╮                  │
│             ╭─╯   $ 84.500 (62%)   ─╮                  │
│             │                       │                  │
│             │        TOTAL          │  ◄── Centro KPI  │
│             │     $ 136.200         │      Dinámico    │
│             │     8 compras         │                  │
│             │                       │                  │
│             ╰─╮                    ╭╯                  │
│               ╰──╮ Favor 100%   ╭──╯                   │
│                  ╰───────────────╯                     │
│                                                        │
│  [● 50/50 Mitad: $84.5k (62%)]  [● Favor: $35.0k (26%)]│
│  [● Deuda Mía: $10.2k (7%)]     [● Personal: $6.5k (5%)]│
└────────────────────────────────────────────────────────┘
```

### B. Especificaciones del Nuevo Donut Chart:
1. **Centro KPI Dinámico (Dynamic Hole Stats):**
   * **Estado en Reposo (Default):**
     * Texto superior: `"TOTAL GASTADO"` (9px, mayúsculas, tracking amplio, color slate-400).
     * Cifra central: Monto total acumulado formateado en ARS (`$ 136.200`, font-bold, blanco).
     * Subtexto: Cantidad total de transacciones registradas (`"14 movimientos"`).
   * **Estado en Hover sobre un Segmento (Active Slice Focus):**
     * El centro cambia dinámicamente mediante estado de React (`activeIndex`):
     * Muestra el nombre de la clasificación (ej. `"50/50 Mitad"`).
     * Muestra el monto de esa clasificación y el **porcentaje exacto** respecto al total (`$ 84.500 · 62%`).
2. **Expansión Radial del Segmento Activo (`Active Shape`):**
   * Al pasar el cursor sobre cualquier sector, este se expande suavemente 4px hacia afuera (`outerRadius={84}` vs `outerRadius={80}`), con un anillo translúcido exterior que otorga resplandor.
3. **Puntas Suaves y Espaciado:**
   * `cornerRadius={6}` para rematar los bordes de cada arco con terminación redondeada premium.
   * `paddingAngle={4}` para separar con nitidez los bloques sin saturar.
4. **Leyenda Enriquecida con Porcentajes Inmediatos:**
   * La leyenda inferior dejará de ser una lista simple de nombres. Cada ítem incluirá:
     * Punto de color semántico con micro-borde brillante.
     * Nombre formal de la clasificación.
     * Cifra formateada compacta (`$ 84.5k`).
     * Pill con el porcentaje calculado (`62%`) visible sin necesidad de interactuar.
   * Al hacer hover en un ítem de la leyenda, se activará el sector correspondiente en el donut.

---

## 5. Micro-Dinamismo en Componentes del Dashboard

### A. `<MasterBalanceHero />`
* **Halo de Borde Perimetral:** Resplandor dinámico condicional al estado de deuda:
  * Si hay deuda activa: pulsación suave en verde esmeralda o carmesí (`box-shadow: 0 0 24px -4px rgba(16, 185, 129, 0.2)`).
  * Si las cuentas están saldadas: pulsación sutil en cian.
* **Flecha de Deuda con Movimiento de Flujo:**
  * La flecha que conecta al deudor con el acreedor tendrá una micro-animación de deslizamiento continuo (`animate-pulse` o desplazamiento de gradiente horizontal) indicando dirección financiera.

### B. `<StatMetricCard />`
* **Efecto de Elevación y Luz:** Al pasar el cursor, el icono temático escala suavemente (`scale-110` en 200ms) y el gradiente de fondo de la tarjeta gana intensidad lumínica.

### C. `<HeaderBar />`
* **Indicador de Webhook Vivo:** Incorporación del efecto radar con doble anillo: un punto central esmeralda fijo y un anillo exterior expansivo (`animate-ping`).

---

## 6. Checklist de Implementación SDD

- [ ] **Paso 1:** Añadir las clases de animación ambiental y keyframes en `web/src/app/globals.css`.
- [ ] **Paso 2:** Incorporar los orbes flotantes dinámicos en el layout base / dashboard y en `/login`.
- [ ] **Paso 3:** Implementar el efecto de rechazo (shake animation), input interactivo y estética viva en `web/src/app/login/page.tsx`.
- [ ] **Paso 4:** Refactorizar `<AnalyticsSection />` para incorporar el Donut Chart con KPI dinámico central, `ActiveShape` de Recharts y leyenda con porcentajes.
- [ ] **Paso 5:** Incorporar los halos de pulsación en `<MasterBalanceHero />` y el radar vivo en `<HeaderBar />`.
- [ ] **Paso 6:** Validar compatibilidad en navegadores móviles y desktop con 0 impacto en rendimiento.
