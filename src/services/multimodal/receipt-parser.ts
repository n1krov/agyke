import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExtractedExpenseDraft, MultimodalProcessResponse } from '../../types/multimodal';

export const IMAGE_EXTRACTION_SYSTEM_PROMPT = `
Eres un asistente contable visual experto en tickets, facturas impresas y recibos de compra en Argentina.
Analiza la imagen provista y extrae con máxima precisión los datos financieros del gasto.

Debes responder ÚNICAMENTE un objeto JSON válido (sin Markdown, sin bloques de código) con la siguiente estructura:
{
  "raw_transcription": string,
  "amount": number,
  "concept": string,
  "date": string | null,
  "suggested_classification": null,
  "payer_hint": null,
  "confidence": number,
  "metadata": {
    "merchant": string | null,
    "invoice_number": string | null,
    "currency": "ARS" | "USD"
  }
}

Reglas estrictas:
- El monto ("amount") debe ser el TOTAL FINAL efectivamente pagado. NUNCA tomes el subtotal ni montos parciales.
- Ignora números de CUIT, terminal, vuelto, importes de cuotas o códigos de barras.
- Si hay un descuento al pie del ticket, toma el importe neto resultante efectivamente abonado.
- Si no encuentras ningún importe total reconocible, responde amount: 0 y concept: "Comprobante sin monto claro".
`;

export function sanitizeReceiptDraft(
  parsed: Partial<ExtractedExpenseDraft> | null | undefined
): ExtractedExpenseDraft {
  let amount = 0;
  if (typeof parsed?.amount === 'number' && !isNaN(parsed.amount)) {
    amount = Math.max(0, Math.round(parsed.amount * 100) / 100);
  }

  let concept = (parsed?.concept || '').trim();
  if (!concept) {
    concept = parsed?.metadata?.merchant ? `Gasto en ${parsed.metadata.merchant}` : 'Comprobante';
  }

  let confidence = 0.5;
  if (typeof parsed?.confidence === 'number' && !isNaN(parsed.confidence)) {
    confidence = Math.min(1, Math.max(0, parsed.confidence));
  } else if (amount > 0) {
    confidence = 0.85;
  }

  let date: string | null = null;
  if (typeof parsed?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date.trim())) {
    date = parsed.date.trim();
  }

  return {
    amount,
    concept,
    date,
    suggested_classification: null,
    payer_hint: null,
    confidence,
    raw_transcription: parsed?.raw_transcription ? String(parsed.raw_transcription).trim() : null,
    source_type: 'image',
    metadata: {
      merchant: parsed?.metadata?.merchant ? String(parsed.metadata.merchant).trim() : null,
      invoice_number: parsed?.metadata?.invoice_number ? String(parsed.metadata.invoice_number).trim() : null,
      currency: parsed?.metadata?.currency === 'USD' ? 'USD' : 'ARS'
    }
  };
}

export async function parseReceiptImage(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<MultimodalProcessResponse> {
  const startTime = Date.now();
  const debugLogs: string[] = [];

  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    const entry = `[${timestamp}] ${msg}`;
    debugLogs.push(entry);
    console.log(`[ReceiptParser] ${entry}`);
  };

  addLog(`Iniciando procesamiento de imagen (${(imageBuffer.length / 1024).toFixed(1)} KB, Mime: ${mimeType})`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const errorMsg = 'GEMINI_API_KEY no configurada en las variables de entorno';
    addLog(`❌ Error: ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
      executionTimeMs: Date.now() - startTime,
      debugLogs
    };
  }

  const CANDIDATE_MODELS = [
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest'
  ].filter(Boolean) as string[];

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    addLog('Codificando imagen a Base64 para inlineData...');
    const mediaPart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    let rawText = '';
    let lastError: unknown = null;
    let usedModel = '';

    for (const modelName of CANDIDATE_MODELS) {
      try {
        addLog(`Enviando payload a Gemini Visión (Modelo: ${modelName})...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        const result = await model.generateContent([IMAGE_EXTRACTION_SYSTEM_PROMPT, mediaPart]);
        const response = await result.response;
        rawText = response.text().trim();
        usedModel = modelName;
        addLog(`✅ Respuesta recibida exitosamente desde ${modelName} (${rawText.length} caracteres).`);
        break;
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`⚠️ Falló intento con ${modelName}: ${msg}. Probando siguiente modelo...`);
      }
    }

    if (!rawText) {
      throw lastError || new Error('No se pudo obtener respuesta de ningún modelo de Gemini disponible');
    }

    addLog(`Parseando JSON obtenido de ${usedModel}...`);

    const cleanJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsedData = JSON.parse(cleanJson);

    const draft = sanitizeReceiptDraft(parsedData);
    addLog(`✅ Sanitización exitosa: Monto=$${draft.amount}, Concepto="${draft.concept}", Certeza=${(draft.confidence * 100).toFixed(0)}%`);

    return {
      success: true,
      draft,
      rawResponse: rawText,
      executionTimeMs: Date.now() - startTime,
      debugLogs
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    addLog(`❌ Excepción durante la inferencia: ${error}`);
    return {
      success: false,
      error,
      executionTimeMs: Date.now() - startTime,
      debugLogs
    };
  }
}
