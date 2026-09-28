# Ingestión Multimodal Inteligente (Agyke System)

## Visión General
Esta carpeta contiene la arquitectura técnica, especificaciones funcionales y arnés de pruebas para la **Ingestión Multimodal de Gastos** en Agyke.

El objetivo es permitir a los usuarios registrar transacciones financieras compartidas a través de Telegram utilizando cualquier medio natural:
1. **Notas de Voz y Archivos de Audio** (OGG/Opus, MP3, M4A).
2. **Fotos de Tickets y Comprobantes Físicos** (JPEG, PNG).
3. **Documentos y Facturas Electrónicas** (PDF, comprobantes AFIP, transferencias).

---

## Índice de Especificaciones

* [`ARCHITECTURE_MULTIMODAL.md`](./ARCHITECTURE_MULTIMODAL.md): **Arquitectura Global y Contrato Canónico JSON**. Especifica la normalización de todas las entradas multimodales hacia un único esquema de datos estructurado (`ExtractedExpenseDraft`), el ciclo de vida del procesamiento y los límites de infraestructura serverless.
* [`SPEC_VOICE_AUDIO.md`](./SPEC_VOICE_AUDIO.md): **Especificación de Audio y Notas de Voz**. Tratamiento de mensajes de voz de Telegram, prompts de Gemini especializados en lunfardo y lenguaje coloquial argentino ("lucas", "mitad y mitad", "pago yo"), transcripción dual y tolerancia a ruido ambiente.
* [`SPEC_RECEIPTS_IMAGES.md`](./SPEC_RECEIPTS_IMAGES.md): **Especificación de Comprobantes Físicos e Imágenes**. Procesamiento visual de tickets de compra, tickets de supermercado, recibos manuscritos y capturas de pantalla, con reglas de selección del total final sobre subtotales y descuentos.
* [`SPEC_DOCUMENTS_PDF.md`](./SPEC_DOCUMENTS_PDF.md): **Especificación de Facturas y Documentos PDF**. Análisis de facturas comerciales (AFIP Factura A/B/C), comprobantes de transferencias bancarias o billeteras virtuales (Mercado Pago, Ualá) y resúmenes de servicios.
* [`SPEC_TESTING_HARNESS.md`](./SPEC_TESTING_HARNESS.md): **Arnés de Pruebas y Metodología Local Test-First**. Estrategia de pruebas automatizadas locales sin depender del bot de Telegram en vivo, script CLI de simulación con fixtures reales, modo *Dry-Run* conversacional y workflow en ramas de prueba.
* [`TASKS_MULTIMODAL.md`](./TASKS_MULTIMODAL.md): **Roadmap y Checklist de Tareas Atómicas**. Desglose paso a paso para la implementación progresiva y verificable.

---

## Principio Rector: Contrato Canónico Unificado
Cualquier entrada multimedia, sin excepción, se procesa a través de la IA de Gemini 1.5 Flash para converger en un objeto **JSON estructurado estricto**. El motor financiero de Agyke, las sesiones y la cola de confirmación operan únicamente sobre este JSON normalizado, desacoplándose al 100% de la naturaleza del archivo de origen.
