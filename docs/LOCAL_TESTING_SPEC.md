# LOCAL_TESTING_SPEC.md - Especificación de Pruebas de Integración y Simulación Local

> **Objetivo:** Permitir el testeo exhaustivo de la lógica del sistema Agyke (ingesta de gastos, cálculo de balances, flujos conversacionales y callbacks interactivos) de forma 100% local, automatizada y reproducible, **sin depender de la app móvil de Telegram ni de un bot en ejecución continua (Long Polling o Webhook en vivo)**.

---

## 1. Filosofía de Simulación (Headless Bot Testing)

El framework `grammY` ofrece la función nativa `bot.handleUpdate(update)`. A través de este mecanismo, podemos inyectar objetos sintéticos `Update` que replican exactamente lo que Telegram enviaría:

```
[ Test Runner / Script CLI ]
          │
          │ inyecta `Update` sintético (JSON)
          ▼
   [ bot.handleUpdate(update) ]
          │
          ├─► authMiddleware (Verifica / crea usuario)
          ├─► Commands / Assisted Flow / Callbacks
          ├─► Supabase / Gemini Service
          └─► Saldo Neto Recalculado (net_balance)
```

Esto desacopla por completo la validación funcional de la infraestructura de red de Telegram.

---

## 2. Escenarios de Prueba a Simular

### Escenario 1: Inicialización y Autenticación
* **Entrada:** `Update` con mensaje de texto `/start` proveniente de un `telegram_id` nuevo.
* **Resultado Esperado:**
  * Usuario registrado o validado en la base de datos `users`.
  * Mensaje de bienvenida con menú de comandos.

### Escenario 2: Carga Directa en una Línea
* **Entrada:** `Update` con `/gasto 15000 Coto 50` del Usuario A.
* **Resultado Esperado:**
  * Inserción en `transactions` con `amount: 15000`, `concept: 'Coto'`, `classification: '50'`, `debt_impact: 7500`.
  * Recálculo en `balances`: Usuario B le debe $7.500 al Usuario A (`net_balance: +7500`).

### Escenario 3: Cruce Financiero y Compensación de Deuda
* **Entrada:** `Update` con `/gasto 5000 Farmacia 50` del Usuario B.
* **Resultado Esperado:**
  * Inserción en `transactions` con `debt_impact: 2500` a favor de B.
  * Recálculo en `balances`: El saldo neto baja de +$7.500 a **+$5.000** a favor de A.

### Escenario 4: Flujo Asistido / Conversacional con Inline Keyboard
* **Paso A:** `Update` con mensaje de texto ambiguo (ej: `12500 Verdulería`).
* **Paso B:** El sistema extrae `{ amount: 12500, concept: 'Verdulería' }` y lo guarda en `agyke_queue` con estado `'PENDING'`, retornando un mensaje con Inline Keyboard (`50`, `100`, `-100`, `0`).
* **Paso C:** Simulación de pulsación de botón mediante `Update` de tipo `callback_query` con `callback_data: "agyke:<id>:50"`.
* **Resultado Esperado:**
  * Item de cola pasa a `'PROCESSED'`.
  * Transacción registrada y saldo neto recalculado.

### Escenario 5: Pipeline Multimedia con Gemini 1.5 Flash
* **Entrada:** `processMediaWithGemini` alimentado con un `Buffer` representativo (audio o imagen de ticket).
* **Resultado Esperado:**
  * Objeto `{ amount: number, concept: string }` extraído correctamente y con fallback resiliente si el servicio externo no estuviese disponible.

---

## 3. Arquitectura del Arnés de Pruebas

Se implementarán dos componentes clave:
1. **Helper de Generación de Updates Sintéticos (`src/tests/telegram-mock.ts`):**
   * Genera payloads válidos de Telegram para mensajes de texto, audios, fotos y callback queries.
   * Intercepta las llamadas a `ctx.api.sendMessage` o `ctx.reply` para verificar las respuestas enviadas al usuario sin llamar a los servidores de Telegram.
2. **Suite de Integración Automatizada (`src/tests/integration.test.ts`):**
   * Ejecutable con el runner nativo de pruebas (`npm test` o `npm run test:integration`).
   * Evalúa los 5 escenarios anteriores de forma secuencial y determinista.
3. **Script CLI Interactivo de Simulación (`scripts/simulate-flow.ts`):**
   * Permite ejecutar desde la terminal un flujo completo pasando comandos y viendo en consola el resultado del balance y la base de datos en tiempo real.

---

## 4. Criterios de Aceptación
1. Poder correr `npm test` y verificar todos los flujos de negocio sin requerir conexión con Telegram.
2. Cobertura completa del ciclo de vida de transacciones y cálculo de saldos.
3. Cero dependencias adicionales fuera del stack aprobado en `GEMINI.md`.
