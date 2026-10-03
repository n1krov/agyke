# Roadmap y Tareas de Implementación Multimodal (Agyke System)

## 1. Fase 1: Arquitectura y Contrato Canónico JSON
- [x] **Tarea MULTI-1:** Formalizar la interfaz `ExtractedExpenseDraft` en `src/types/database.ts` (o `src/types/multimodal.ts`) con tipado estricto.
- [x] **Tarea MULTI-2:** Crear validador y sanitizador de esquemas para garantizar que ningún extractor devuelva valores `NaN`, montos negativos o campos fuera de contrato.
- [ ] **Tarea MULTI-3:** Definir los límites de tiempo de espera (`AbortSignal.timeout`) y tamaño máximo para buffers en memoria.

---

## 2. Fase 2: Arnés de Pruebas Local y Fixtures (Test-First)
- [ ] **Tarea MULTI-4:** Crear la carpeta de fixtures `tests/fixtures/multimodal/` con archivos representativos de prueba:
  - [ ] Audio de voz OGG/Opus (`audio_sample.ogg`).
  - [ ] Foto de ticket de compra (`ticket_sample.jpg`).
  - [ ] Factura en PDF (`factura_sample.pdf`).
- [ ] **Tarea MULTI-5:** Implementar el script CLI `scripts/test-multimodal.ts` para ejecutar inferencias locales directas contra Gemini 1.5 Flash sin bot en vivo.
- [ ] **Tarea MULTI-6:** Agregar script npm `"test:multimodal": "tsx scripts/test-multimodal.ts"` en `package.json`.

---

## 3. Fase 3: Motor de Audio y Notas de Voz (Voice Engine)
- [x] **Tarea MULTI-7:** Implementar `processAudioWithGemini(fileBuffer, mimeType)` en `src/services/gemini.ts` con el prompt especializado en modismos argentinos ("lucas", "mitad y mitad", etc.).
- [x] **Tarea MULTI-8:** Habilitar extracción dual: transcripción textual literal (`raw_transcription`) + objeto financiero estructurado.
- [x] **Tarea MULTI-9:** Desarrollar suite de tests unitarios para audio (`src/tests/multimodal/audio.test.ts`).

---

## 4. Fase 4: Motor de Comprobantes Físicos e Imágenes (Image Engine)
- [x] **Tarea MULTI-10:** Implementar `processImageWithGemini(fileBuffer, mimeType)` en `src/services/gemini.ts` con jerarquía de "Total a Pagar" sobre subtotales y descuentos.
- [x] **Tarea MULTI-11:** Asegurar en el handler de Telegram la selección del elemento de mayor resolución en `ctx.message.photo`.
- [x] **Tarea MULTI-12:** Desarrollar suite de tests unitarios para imágenes (`src/tests/multimodal/image.test.ts` / `receipt.test.ts`).

---

## 5. Fase 5: Motor de Facturas y Documentos PDF (PDF Engine)
- [x] **Tarea MULTI-13:** Implementar `processPdfWithGemini(fileBuffer)` en `src/services/gemini.ts` con soporte para Facturas AFIP A/B/C y transferencias de billeteras virtuales.
- [x] **Tarea MULTI-14:** Implementar manejo de errores para PDFs protegidos con contraseña o sin contenido legible.
- [x] **Tarea MULTI-15:** Desarrollar suite de tests unitarios para PDFs (`src/tests/multimodal/pdf.test.ts`).

---

## 6. Fase 6: Refactor de Handlers de Telegram y Modo Preview Seguro
- [x] **Tarea MULTI-16:** Refactorizar `assistedFlowHandler` en `src/bot/handlers/assisted.ts` para canalizar las 3 fuentes a través del contrato unificado `ExtractedExpenseDraft`.
- [x] **Tarea MULTI-17:** Diseñar la tarjeta de mensaje en Telegram con preview transparente:
  - Transcripción de lo escuchado o leído.
  - Monto formateado en moneda argentina ($X.XXX,XX).
  - Clasificación sugerida destacada si fue detectada en el audio.
- [x] **Tarea MULTI-18:** Incorporar botón inline `[ ❌ Descartar / Cancelar ]` en cada tarjeta generada por multimedia para cancelación con un solo toque.

---

## 7. Fase 7: Validación Integral y Despliegue
- [x] **Tarea MULTI-19:** Ejecutar la suite completa de verificación (`npm test`, `npm run typecheck`, `npm run lint`).
- [x] **Tarea MULTI-20:** Pruebas interactivas en rama aislada `lab/multimodal-receipts` en Telegram / integración headless.
- [x] **Tarea MULTI-21:** Actualizar bitácora `docs/STATUS.md` y preparar Pull Request hacia `dev`.
