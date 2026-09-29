# Especificación de Comprobantes Físicos e Imágenes (Agyke System)

## 1. Alcance y Objetivos
Esta especificación define el procesamiento de imágenes fotográficas y capturas de pantalla de tickets, facturas impresas, tickets de supermercado, recibos manuscritos y comprobantes de punto de venta (POS) enviados a través de Telegram.

El desafío principal radica en la presencia de **múltiples importes numéricos** en un mismo ticket (precios unitarios, subtotales, IVA discriminado, descuentos, propinas, vuelto en efectivo). Gemini 1.5 Flash debe aplicar razonamiento visual y semántico para extraer el **Total Final Pagado**.

---

## 2. Recepción de Imágenes en Telegram

Telegram entrega imágenes bajo dos modalidades:

1. **`message.photo` (Imágenes Comprimidas):**
   - Es el flujo estándar cuando el usuario toma una foto con la cámara de Telegram o la galería.
   - Telegram entrega un array `PhotoSize[]` ordenado de menor a mayor resolución.
   - **Regla estricta:** El bot debe seleccionar siempre el último elemento del array:
     ```typescript
     const photos = ctx.message.photo;
     const highestResPhoto = photos[photos.length - 1]; // Máxima resolución disponible
     ```

2. **`message.document` con MimeType de Imagen (Imágenes Sin Compresión):**
   - Cuando el usuario envía una foto "como archivo" para preservar resolución completa (`image/jpeg`, `image/png`, `image/webp`).
   - Se procesa directamente con el mimeType provisto en el documento.

---

## 3. Jerarquía y Reglas de Extracción Visual de Importes

Para evitar registrar montos erróneos (como un subtotal antes de descuentos o el número de CUIT del comercio), se aplican las siguientes reglas de prioridad en el prompt de la IA:

```
[ Prioridad 1 ] -> "TOTAL", "IMPORTE TOTAL", "TOTAL A PAGAR", "PAGADO"
[ Prioridad 2 ] -> Monto debitado en comprobante de tarjeta / POS (Visa, Master, Débito)
[ Ignorar ]     -> "SUBTOTAL", "IVA", "PERCEPCIONES", "DESCUENTOS", "SU PAGO", "SU VUELTO"
[ Ignorar ]     -> Números de CUIT, fechas, números de factura o teléfonos
```

### Casos de Borde Visuales:
- **Tickets con Descuento (ej: Promociones bancarias o cupones):** El monto registrado debe ser el total efectivamente abonado tras aplicar los descuentos.
- **Tickets Arrugados o Desenfocados:** Si el total final es ilegible pero los ítems individuales son visibles, Gemini calcula la suma de los ítems con nivel de confianza reducido (`confidence < 0.7`).
- **Múltiples Monedas:** Si el ticket especifica moneda extranjera (USD, EUR, BRL) o conversión a ARS, se extrae el importe en Pesos Argentinos (ARS) si está liquidado, o se etiqueta la moneda en los metadatos.

---

## 4. Prompt de Sistema Especializado para Imágenes (Gemini 1.5 Flash)

```typescript
export const IMAGE_EXTRACTION_SYSTEM_PROMPT = `
Eres un asistente contable visual experto en tickets, facturas impresas y recibos de compra en Argentina.
Analiza la imagen provista y extrae con máxima precisión los datos financieros del gasto.

Debes responder ÚNICAMENTE un objeto JSON válido (sin Markdown, sin bloques de código) con la siguiente estructura:
{
  "raw_transcription": string, // Resumen de lo detectado: comercio, fecha y total
  "amount": number,            // Total final pagado en números decimales (ej: 18450.50). Si es ilegible, pon 0
  "concept": string,           // Nombre del comercio y rubro principal (ej: "Supermercado Dia%", "Farmacity", "Estación YPF")
  "date": string | null,       // Fecha de emisión en formato YYYY-MM-DD si es visible en el ticket
  "suggested_classification": null, // Las imágenes no suelen definir división; mantener null
  "payer_hint": null,
  "confidence": number,        // Certeza de 0.0 a 1.0 según la nitidez y legibilidad
  "metadata": {
    "merchant": string | null,
    "invoice_number": string | null,
    "currency": "ARS" | "USD"
  }
}

Reglas estrictas:
- El monto debe ser el TOTAL FINAL efectivamente pagado. NUNCA tomes el subtotal ni montos parciales.
- Ignora CUITs, números de terminal, importes de vuelto o códigos de barras.
- Si hay un descuento al final del ticket, toma el importe neto resultante pagado.
- Si no encuentras ningún número identificable como importe total, responde amount: 0, concept: "Comprobante sin monto claro".
`;
```

---

## 5. Experiencia de Usuario y Respuestas en Telegram

### Caso 1: Ticket Nítido con Total y Comercio Legibles
El usuario envía foto de un ticket de Coto por $34.200.

**Mensaje del Bot:**
```markdown
📷 *Comprobante analizado con éxito*
🏢 *Comercio:* Coto C.I.C.S.A.
📅 *Fecha:* 28/09/2026
💰 *Monto Total:* $34.200,00

Selecciona la clasificación para registrar el gasto:
```
*(Botonera interactiva con los 4 botones de Agyke: `[ 50 ]`, `[ 100 ]`, `[ -100 ]`, `[ 0 ]` y `[ ❌ Cancelar ]`)*

### Caso 2: Ticket Borroso o Cortado
El usuario envía foto donde el total está cortado o manchado.

**Mensaje del Bot:**
```markdown
📷 *Comprobante recibido*
🏢 *Comercio detectado:* Farmacity

⚠️ No se pudo leer con certeza el monto total del ticket.
Por favor, responde este mensaje con el monto abonado (ej: `8500`):
```
*(Sesión en estado `AWAITING_AMOUNT` vinculada al concepto detectado)*
