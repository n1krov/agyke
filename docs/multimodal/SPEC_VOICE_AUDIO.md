# Especificación de Audio y Notas de Voz (Agyke System)

## 1. Alcance y Objetivos
Esta especificación define el comportamiento del sistema cuando un usuario envía un mensaje de voz (`voice`) o un archivo de audio (`audio`) al bot de Telegram.

El objetivo principal es permitir la carga rápida de gastos "manos libres" (por ejemplo, saliendo de un local comercial o manejando), entendiendo modismos rioplatenses / argentinos y deduciendo automáticamente el monto, concepto, quién pagó y la división del gasto.

---

## 2. Tipos de Mensajes de Telegram Soportados

Telegram maneja dos estructuras para contenido sonoro:

1. **`message.voice` (Notas de Voz):**
   - Grabadas directamente con el botón de micrófono de Telegram.
   - Formato habitual: OGG encapsulado con códec Opus (`audio/ogg; codecs=opus`).
   - Duración típica: 3 a 30 segundos.
   - Propiedades clave: `file_id`, `duration`, `mime_type`.

2. **`message.audio` (Archivos de Audio):**
   - Audios adjuntados como archivo (MP3, AAC, M4A, WAV).
   - Propiedades clave: `file_id`, `duration`, `mime_type`, `file_name`.

Ambos son procesados nativamente por **Gemini 1.5 Flash** mediante `inlineData` sin necesidad de transcodificación local ni dependencias pesadas como `ffmpeg`.

---

## 3. Diccionario de Modismos y Reglas de Extracción Coloquial

El prompt del sistema para audio está calibrado para comprender lenguaje coloquial argentino:

### A. Reconocimiento de Montos Monetarios
| Frase en Audio | Interpretación Contable (`amount`) |
| :--- | :--- |
| *"Gasté quince lucas en el súper"* | `15000` |
| *"Pagué tres lucas y media de panadería"* | `3500` |
| *"Fueron veintidós mil cuatrocientos cincuenta"* | `22450` |
| *"Gastamos diez con cincuenta"* | `10.5` o `10500` (según contexto de compra cotidiana) |
| *"Cincuenta y dos mil pesos en la farmacia"* | `52000` |

### B. Detección de Clasificación de Deuda (`suggested_classification`)
| Patrón Verbal | Clasificación Agyke | Justificación Financiera |
| :--- | :---: | :--- |
| *"A medias"*, *"mitad y mitad"*, *"dividido dos"*, *"compartido"* | `'50'` | Cada parte asume el 50% del gasto. |
| *"Pagué yo todo, me lo debe él/ella"*, *"le compré a..."*, *"favor"* | `'100'` | Impacto 100% de crédito a favor de quien pagó. |
| *"Me pagaron la cena"*, *"pagó él por mí"*, *"se lo debo yo"* | `'-100'` | Deuda directa 100% contra el usuario. |
| *"Es un gasto mío"*, *"gasto propio"*, *"personal"*, *"para mí solo"* | `'0'` | Registro informativo sin impacto en deuda cruzada. |
| *No se especifica división en el audio* | `null` | El bot presentará los 4 botones interactivos para seleccionar. |

---

## 4. Prompt de Sistema Especializado (Gemini 1.5 Flash)

```typescript
export const VOICE_EXTRACTION_SYSTEM_PROMPT = `
Eres un asistente contable de alta precisión para la aplicación Agyke (sistema de finanzas compartidas en Argentina).
Tu tarea es escuchar el audio provisto, transcribir lo que dijo el usuario y extraer los datos del gasto.

Debes responder ÚNICAMENTE un objeto JSON válido (sin Markdown, sin bloques de código) con la siguiente estructura:
{
  "raw_transcription": string, // Transcripción textual fiel de lo dicho en el audio
  "amount": number,            // Monto total en números (ej: 15000). Si no hay monto claro, pon 0
  "concept": string,           // Comercio o descripción corta en español (ej: "Verdulería", "Asado con amigos")
  "suggested_classification": "50" | "100" | "-100" | "0" | null, // Si se dedujo explícitamente cómo dividir el gasto
  "payer_hint": string | null, // Si se mencionó quién pagó (ej: "Lautaro", "Agus", "Yo")
  "confidence": number         // Certeza de 0.0 a 1.0 según la claridad del audio
}

Reglas específicas:
- "lucas" equivale a miles (ej: "15 lucas" = 15000, "3 lucas y media" = 3500).
- "mitad y mitad", "a medias" o "dividido" implica suggested_classification: "50".
- Si el usuario dice que pagó todo por la otra persona, suggested_classification es "100".
- Si el usuario dice que le pagaron algo a él o que él debe todo, suggested_classification es "-100".
- Si es un gasto propio o personal, suggested_classification es "0".
- Si no hay ningún monto explícito o el audio es inaudible, responde amount: 0, concept: "Inaudible", confidence: 0.0.
`;
```

---

## 5. Experiencia de Usuario y Respuestas en Telegram

### Caso 1: Audio Claro con Monto y Clasificación Detectada
El usuario envía nota de voz: *"Gasté doce mil quinientos en la carnicería, mitad y mitad"*

**Mensaje del Bot:**
```markdown
🎙️ *Audio procesado con éxito*
🗣️ _«Gasté doce mil quinientos en la carnicería, mitad y mitad»_

💰 *Monto:* $12.500
🏷️ *Concepto:* Carnicería
⚖️ *Clasificación detectada:* 50 (Mitad y Mitad)

¿Confirmas el registro con esta clasificación?
```
*(Botonera con botón principal destacado `[ ✅ Confirmar 50 ]`, accesos rápidos a `[ 100 ]`, `[ -100 ]`, `[ 0 ]` y `[ ❌ Cancelar ]`)*

### Caso 2: Audio con Monto pero Sin Clasificación
El usuario envía nota de voz: *"Quince mil de nafta en la YPF"*

**Mensaje del Bot:**
```markdown
🎙️ *Audio procesado con éxito*
🗣️ _«Quince mil de nafta en la YPF»_

💰 *Monto:* $15.000
🏷️ *Concepto:* Nafta YPF

Selecciona la clasificación:
```
*(Teclado interactivo con los 4 botones: `[ 50 (Mitad y Mitad) ]`, `[ 100 (Favor 100%) ]`, etc.)*

### Caso 3: Audio Sin Monto Claro o Inaudible
El usuario envía nota de voz: *"Che acordate de anotar lo de la verdulería"*

**Mensaje del Bot:**
```markdown
🎙️ *Audio recibido*
🗣️ _«Che acordate de anotar lo de la verdulería»_
🏷️ *Concepto detectado:* Verdulería

💰 No logré escuchar el monto con certeza.
Por favor, responde con el monto (ejemplo: `4500`):
```
*(El bot coloca la sesión en `AWAITING_AMOUNT` preservando el concepto "Verdulería")*
