# Especificación de Facturas y Documentos PDF (Agyke System)

## 1. Alcance y Objetivos
Esta especificación define el procesamiento de archivos digitales en formato PDF enviados como `document` al bot de Telegram.

Abarca los documentos contables y comprobantes digitales más comunes en la economía cotidiana argentina:
1. **Facturas Electrónicas AFIP** (Facturas B y C a consumidor final, Facturas A de compras mayores).
2. **Comprobantes de Transferencias Bancarias y Billeteras Virtuales** (Mercado Pago, Ualá, Cuenta DNI, Brubank, bancos tradicionales).
3. **Facturas de Servicios Públicos y Hogar** (Edenor/Edesur, Metrogas, AySA, Telecom/Personal, Expensas de consorcio).
4. **Resúmenes o Liquidaciones de Tarjeta de Crédito**.

---

## 2. Ingestión de Documentos en Telegram

Telegram entrega estos archivos a través del objeto `message.document`:
- Verificación de tipo: `document.mime_type === 'application/pdf'` o `document.file_name?.toLowerCase().endsWith('.pdf')`.
- Restricción de tamaño máximo: **10 MB**.
- Gemini 1.5 Flash admite de manera nativa documentos PDF como entrada multimodal (`application/pdf`), renderizando internamente las páginas para análisis tanto visual como de capas de texto vectorial.

---

## 3. Heurísticas y Reglas de Extracción por Tipo de Documento

### A. Facturas Electrónicas AFIP (Factura A / B / C)
- **Razón Social / Emisor:** Ubicado típicamente en el encabezado superior izquierdo.
- **Importe Total:** Campo oficial AFIP *"Importe Total: $"* (generalmente en el pie derecho). NUNCA confundir con *"Subtotal"*, *"Importe Neto Gravado"* o *"IVA 21%"*.
- **Fecha:** *"Fecha de Emisión"* (formato DD/MM/AAAA).
- **Número de Comprobante:** Punto de venta y número (ej: `0004-00012458`).

### B. Comprobantes de Transferencia (Mercado Pago, Ualá, Home Banking)
- **Monto de la Operación:** Importe debitado destacado (ej: *"$ 25.000,00"*).
- **Destinatario / Concepto:** Nombre del receptor, comercio o motivo de la transferencia (ej: *"Transferencia enviada a Juan Pérez"* -> Concepto: *"Transferencia a Juan Pérez"*).
- **Identificador:** Código de operación o Coelsa ID.

### C. Servicios y Expensas
- **Importe:** *"Total a Pagar"*, *"Monto del Período"* o *"Importe Vencimiento 1"*.
- **Concepto:** Nombre del servicio (ej: *"Edenor"*, *"Expensas Depto 4B"*, *"Metrogas"*).
- **Fecha de Vencimiento:** Tomada como fecha de referencia si no hay fecha de emisión clara.

---

## 4. Prompt de Sistema Especializado para PDFs (Gemini 1.5 Flash)

```typescript
export const PDF_EXTRACTION_SYSTEM_PROMPT = `
Eres un analista contable experto en facturas comerciales argentinas (AFIP), comprobantes de transferencias bancarias (Mercado Pago, billeteras virtuales) y liquidaciones de servicios en PDF.
Analiza el documento PDF provisto y extrae con exactitud matemática el total a pagar y el concepto.

Debes responder ÚNICAMENTE un objeto JSON válido (sin Markdown, sin explicaciones) con la siguiente estructura:
{
  "raw_transcription": string, // Resumen contable: Tipo de comprobante, emisor, fecha y número
  "amount": number,            // Monto total en números (ej: 45200.00). Si no hay monto o está protegido, pon 0
  "concept": string,           // Nombre del comercio, servicio o receptor (ej: "Factura Edenor", "Mercado Pago a Juan Pérez")
  "date": string | null,       // Fecha del comprobante en formato YYYY-MM-DD
  "suggested_classification": null,
  "payer_hint": null,
  "confidence": number,        // Certeza de 0.0 a 1.0
  "metadata": {
    "merchant": string | null,
    "invoice_number": string | null,
    "currency": "ARS" | "USD"
  }
}

Reglas específicas:
- En Facturas AFIP: toma el "Importe Total", NUNCA el subtotal o importes netos sin IVA.
- En Comprobantes de Mercado Pago / Bancos: extrae el monto exacto de la transferencia y el destinatario como concepto.
- Si el PDF está protegido con contraseña o ilegible, responde amount: 0, concept: "PDF Protegido o Ilegible", confidence: 0.0.
`;
```

---

## 5. Experiencia de Usuario y Respuestas en Telegram

### Caso 1: Factura Electrónica AFIP Procesada
El usuario reenvía un PDF de una factura de farmacia por $18.950.

**Mensaje del Bot:**
```markdown
📄 *Factura Digital analizada con éxito*
🏢 *Emisor:* Farmacias Central Oeste
🧾 *Comprobante:* Factura B (0003-00045129)
📅 *Fecha:* 25/09/2026
💰 *Importe Total:* $18.950,00

Selecciona la clasificación para asentar el gasto en Agyke:
```
*(Botonera interactiva con las 4 opciones de Agyke y Cancelar)*

### Caso 2: Comprobante de Transferencia (Mercado Pago)
El usuario envía el comprobante en PDF de una transferencia por $40.000 para el alquiler o compra compartida.

**Mensaje del Bot:**
```markdown
📄 *Comprobante de Transferencia detectado*
🏦 *Origen:* Mercado Pago
👤 *Destinatario:* Inmobiliaria del Valle
💰 *Monto Transferido:* $40.000,00

Selecciona la clasificación:
```

### Caso 3: PDF Protegido con Contraseña
El usuario envía un resumen bancario con clave de seguridad de 4 dígitos.

**Mensaje del Bot:**
```markdown
⚠️ *Documento protegido con contraseña*
El PDF enviado requiere contraseña para ser abierto, por lo que no puede ser analizado automáticamente por seguridad.

Puedes ingresar el monto manualmente respondiendo este mensaje (ej: `25000 resumen tarjeta`).
```
