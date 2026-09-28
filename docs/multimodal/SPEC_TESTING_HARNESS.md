# Arnés de Pruebas y Metodología Local Test-First (Agyke System)

## 1. Filosofía de Pruebas y Verificación
Siguiendo las reglas fundacionales de **Spec-Driven Development (SDD)** y **Local Test-First** establecidas en `GEMINI.md`:
> No se escribe ni se despliega código a producción sin haber verificado previamente su comportamiento mediante herramientas automatizadas locales. El bot en vivo de Telegram es únicamente el mecanismo de entrega (*delivery mechanism*), no la herramienta de depuración.

Para la ingestión multimodal (voz, imágenes, PDFs), se establece una estrategia de verificación en tres capas:
1. **Capa 1: Arnés CLI de Pruebas Rápidas en Local (`scripts/test-multimodal.ts`)**: Permite alimentar audios, imágenes o PDFs locales directamente al pipeline de Gemini y ver en consola el tiempo de respuesta, la transcripción y el JSON resultante en 2 segundos.
2. **Capa 2: Suite Automatizada de Pruebas Unitarias (`src/tests/multimodal/*.test.ts`)**: Valida sin conexión de red la resiliencia del parser, sanitización de montos y manejo de errores.
3. **Capa 3: Modo Dry-Run / Preview Seguro en Telegram**: En Telegram, el bot siempre muestra lo que entendió antes de asentar el gasto, con un botón explícito de cancelación inmediata (`[ ❌ Cancelar / Descartar ]`).

---

## 2. Capa 1: Arnés CLI Local (`scripts/test-multimodal.ts`)

Se diseñará un script ejecutable desde terminal para verificar archivos reales sin requerir un bot en vivo ni conexión a Supabase:

### Sintaxis de Ejecución:
```bash
# Probar una nota de voz real de Telegram (OGG/Opus) o audio MP3
npm run test:multimodal -- --file tests/fixtures/audio_gasto_15k.ogg

# Probar una foto de ticket de supermercado
npm run test:multimodal -- --file tests/fixtures/ticket_coto.jpg

# Probar una factura digital en PDF
npm run test:multimodal -- --file tests/fixtures/factura_b.pdf

# Probar con salida detallada (verbose)
npm run test:multimodal -- --file tests/fixtures/audio_gasto_15k.ogg --verbose
```

### Salida Esperada en Consola:
```text
============================================================
🧪 AGYKE MULTIMODAL TEST RUNNER
============================================================
📁 Archivo: tests/fixtures/audio_gasto_15k.ogg
📦 Tamaño: 48.2 KB
🏷️ MimeType Detectado: audio/ogg
⏱️ Llamando a Gemini 1.5 Flash... (esperando respuesta)
------------------------------------------------------------
✅ Inferencia Exitosa en 1.420 ms
------------------------------------------------------------
🗣️ Transcripción: "Che anotá quince lucas de la verdulería, mitad y mitad"
💰 Monto Extraído: $15.000,00 (15000)
🏷️ Concepto: Verdulería
⚖️ Clasificación Sugerida: 50 (Mitad y Mitad)
👤 Pagador Sugerido: null
🎯 Certeza (Confidence): 0.95
------------------------------------------------------------
📄 JSON Canónico Resultante:
{
  "raw_transcription": "Che anotá quince lucas de la verdulería, mitad y mitad",
  "amount": 15000,
  "concept": "Verdulería",
  "suggested_classification": "50",
  "payer_hint": null,
  "confidence": 0.95,
  "source_type": "audio"
}
============================================================
```

Este arnés permite iterar y pulir los prompts del sistema en minutos sin enviar un solo mensaje por celular.

---

## 3. Capa 2: Fixtures y Suite Automatizada de Tests

Se estructurará una carpeta de fixtures representativos en `tests/fixtures/multimodal/`:
- `audio_simple_amount.ogg`: Audio diciendo *"Gaste 5000 en pizza"*.
- `audio_lunfardo_split.ogg`: Audio diciendo *"Quince lucas del súper a medias"*.
- `audio_inaudible.ogg`: Audio con ruido blanco o silencio.
- `image_ticket_coto.jpg`: Foto de ticket con subtotal, promociones bancarias y total.
- `image_blurry.jpg`: Foto desenfocada sin monto visible.
- `doc_factura_afip.pdf`: Factura B con discriminación de IVA e Importe Total.
- `doc_transfer_mp.pdf`: Comprobante de transferencia de Mercado Pago.

### Tests Unitarios Obligatorios:
1. `src/tests/multimodal/audio.test.ts`: Valida normalización de lunfardo ("lucas", "gambas") y sugerencia de botones (50, 100, -100, 0).
2. `src/tests/multimodal/image.test.ts`: Valida selección del total neto sobre subtotales y montos de tarjetas.
3. `src/tests/multimodal/pdf.test.ts`: Valida extracción de AFIP y comprobantes bancarios.
4. `src/tests/multimodal/schema.test.ts`: Valida que todo extractor produzca el schema `ExtractedExpenseDraft` sin campos `undefined`.

---

## 4. Capa 3: Modo Dry-Run y Cancelación Segura en Telegram

Cuando se prueba con el bot en vivo (en local mediante Long Polling con `npm run dev:bot` o en el entorno de despliegue), se garantiza la seguridad de los datos:

1. **Estado `PENDING` en Cola (`agyke_queue`):**
   - El procesamiento de un audio, imagen o PDF **NUNCA impacta directamente el saldo**.
   - Solo crea un registro tentativo en la tabla de cola `agyke_queue`.
   - La deuda y el `net_balance` solo cambian cuando el usuario presiona expresamente uno de los botones de clasificación (`50`, `100`, `-100`, `0`).

2. **Cancelación Inmediata con un Clic:**
   - La tarjeta de respuesta del bot siempre incluye un botón de escape:
     `[ ❌ Descartar Gasto ]`
   - O mediante el comando de texto:
     `/cancelar`
   - Al pulsar descartar, el registro de la cola se elimina o se marca como `DISCARDED`, dejando los saldos exactamente igual que antes de enviar el archivo.

3. **Modo Preview Transparente:**
   - El bot siempre le muestra al usuario la transcripción de lo que escuchó o el resumen de lo que vio, eliminando cualquier "efecto caja negra".

---

## 5. Estrategia de Ramas Git (Git Flow Multimodal)

Para no comprometer la estabilidad de `dev` ni de `master` mientras se experimenta con audios reales:

```
master (Producción estable)
  │
dev (Integración continua)
  │
  └── feature/multimodal-inputs (Rama de laboratorio)
        ├── 1. Crear arnés CLI y fixtures de audio/imagen/PDF
        ├── 2. Calibrar prompts de Gemini con pruebas locales
        ├── 3. Probar en Telegram interactivo con botón Cancelar
        └── 4. Merge hacia dev tras pasar suite completa de tests
```

### Protocolo de Trabajo en la Rama de Laboratorio:
1. Crear la rama: `git checkout -b feature/multimodal-inputs dev`.
2. Probar y calibrar localmente con `npm run test:multimodal`.
3. Iniciar el bot en modo Long Polling local (`npm run dev:bot`) utilizando una cuenta de prueba o tu usuario autorizado de Telegram.
4. Enviar audios reales al bot, comprobar que responda con la transcripción correcta y probar el botón `[ ❌ Cancelar ]`.
5. Ejecutar `npm test`, `npm run typecheck` y `npm run lint`.
6. Actualizar `docs/STATUS.md` y hacer merge hacia `dev`.
