# REQUIREMENTS.md - Especificación Funcional Completa

## 1. Contexto de Negocio
Dos usuarios (Usuario A y Usuario B) comparten gastos de un departamento. El sistema debe mantener un registro de transacciones y un saldo neto consolidado (`net_balance`).
- Si `net_balance > 0`: El Usuario B le debe dinero al Usuario A.
- Si `net_balance < 0`: El Usuario A le debe dinero al Usuario B.
- Si `net_balance == 0`: Cuentas saldadas.

## 2. Flujos de Entrada en Telegram

### A. Flujo Directo (Saltea Agyke)
Ocurre cuando el usuario envía un comando explícito o usa un botón persistente.
- **Sintaxis del Comando:** `/gasto <monto> <concepto> <clasificacion>`
- **Ejemplo:** `/gasto 15000 Coto 50`
- **Comportamiento:**
  1. Inserta directamente un registro en la tabla `transactions`.
  2. Ejecuta el recálculo en la tabla `balances`.
  3. Responde en Telegram: *"✅ Gasto registrado: $15.000 (Coto). Balance actualizado."*

### B. Flujo Asistido / Ambiguo (Pasa por Muro Agyke)
Ocurre cuando el mensaje ingresado es una nota de voz, una imagen/PDF de comprobante, o un texto sin clasificación explícita.
- **Entradas Soportadas:**
  - Audio (`.ogg`, `.mp3`, `.m4a`): Se descarga el buffer de Telegram y se envía a Gemini 1.5 Flash.
  - Foto/PDF (`.jpg`, `.png`, `.pdf`): Se descarga el buffer y se envía a Gemini 1.5 Flash.
  - Texto libre (ej. `12500 Verdulería`): Se extrae el monto y concepto.
- **Comportamiento:**
  1. Gemini procesa el contenido y devuelve JSON `{ "amount": number, "concept": string }`.
  2. Se inserta un registro en `agyke_queue` con estado `'PENDING'`.
  3. El Bot envía un mensaje interactivo con el siguiente layout de botones (Inline Keyboard):
     ```text
     📝 Nuevo gasto detectado en Agyke
     Monto: $12.500
     Concepto: Verdulería

     [ 50 (Mitad y Mitad) ]  [ 100 (Favor a Cholo) ]
     [ -100 (Deuda Mía) ]     [ 0 (Personal) ]
     ```

## 3. Lógica Financiera de los 4 Botones

Al presionar un botón en Telegram (`callback_query`), se procesa el item de `agyke_queue`:

| Botón | Nombre | Fórmula de Impacto en Deuda (`debt_impact`) |
| :--- | :--- | :--- |
| `50` | Compartido 50/50 | `+ (Monto / 2)` para el pagador. |
| `100` | Favor 100% | `+ Monto` para el pagador. |
| `-100` | Deuda Propia | `- Monto` para el pagador (asume deuda). |
| `0` | Personal | `$0` impacto en balance. |

**Proceso tras presionar el botón:**
1. Se actualiza el estado en `agyke_queue` a `'PROCESSED'`.
2. Se inserta en `transactions` con el `classification` y `debt_impact` correspondiente.
3. Se actualiza el `net_balance` en la tabla `balances`.
4. Se edita el mensaje en Telegram para mostrar: *"✅ Clasificado como [Tipo]. Balance actualizado."*
