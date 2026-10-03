import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExtractedExpenseDraft, MultimodalProcessResponse } from '../../types/multimodal';

export const PDF_EXTRACTION_SYSTEM_PROMPT = `
Eres un analista contable experto en facturas comerciales argentinas (AFIP), comprobantes de transferencias bancarias (Mercado Pago, billeteras virtuales) y liquidaciones de servicios en PDF.
Analiza el documento PDF provisto y extrae con exactitud matemática el total a pagar y el concepto.

Debes responder ÚNICAMENTE un objeto JSON válido (sin Markdown, sin explicaciones ni bloques de código) con la siguiente estructura:
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

Reglas específicas:
- En Facturas AFIP (A, B o C): toma el "Importe Total", NUNCA el subtotal ni importes netos sin IVA.
- En Comprobantes de Mercado Pago, transferencias o bancos: extrae el monto exacto de la transferencia y el destinatario o motivo como concepto.
- En Facturas de Servicios (Edenor, Metrogas, Telecom, Expensas): toma el "Total a Pagar" o "Importe 1° Vencimiento" y el nombre del servicio como concepto.
- Si el PDF está protegido con contraseña o ilegible, responde amount: 0, concept: "PDF Protegido o Ilegible", confidence: 0.0.
`;

export function sanitizePdfDraft(
  parsed: Partial<ExtractedExpenseDraft> | null | undefined
): ExtractedExpenseDraft {
  let amount = 0;
  if (typeof parsed?.amount === 'number' && !isNaN(parsed.amount)) {
    amount = Math.max(0, Math.round(parsed.amount * 100) / 100);
  }

  let concept = (parsed?.concept || '').trim();
  if (!concept) {
    concept = parsed?.metadata?.merchant ? `Factura de ${parsed.metadata.merchant}` : 'Factura / Documento PDF';
  }

  let confidence = 0.5;
  if (typeof parsed?.confidence === 'number' && !isNaN(parsed.confidence)) {
    confidence = Math.min(1, Math.max(0, parsed.confidence));
  } else if (amount > 0) {
    confidence = 0.90;
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
    source_type: 'document',
    metadata: {
      merchant: parsed?.metadata?.merchant ? String(parsed.metadata.merchant).trim() : null,
      invoice_number: parsed?.metadata?.invoice_number ? String(parsed.metadata.invoice_number).trim() : null,
      currency: parsed?.metadata?.currency === 'USD' ? 'USD' : 'ARS'
    }
  };
}

export async function parsePdfDocument(
  pdfBuffer: Buffer,
  mimeType: string = 'application/pdf'
): Promise<MultimodalProcessResponse> {
  const startTime = Date.now();
  const debugLogs: string[] = [];

  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    const entry = `[${timestamp}] ${msg}`;
    debugLogs.push(entry);
    console.log(`[PdfParser] ${entry}`);
  };

  addLog(`Iniciando procesamiento de documento PDF (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

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

    addLog('Codificando documento PDF a Base64 para inlineData...');
    const mediaPart = {
      inlineData: {
        data: pdfBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    let rawText = '';
    let lastError: unknown = null;
    let usedModel = '';

    for (const modelName of CANDIDATE_MODELS) {
      try {
        addLog(`Enviando PDF a Gemini Document Parser (Modelo: ${modelName})...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        const result = await model.generateContent([PDF_EXTRACTION_SYSTEM_PROMPT, mediaPart]);
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

    const draft = sanitizePdfDraft(parsedData);
    addLog(`✅ Sanitización exitosa: Monto=$${draft.amount}, Concepto="${draft.concept}", Emisor=${draft.metadata?.merchant || 'N/A'}, Certeza=${(draft.confidence * 100).toFixed(0)}%`);

    return {
      success: true,
      draft,
      rawResponse: rawText,
      executionTimeMs: Date.now() - startTime,
      debugLogs
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    addLog(`❌ Excepción durante el procesamiento del PDF: ${error}`);
    return {
      success: false,
      error,
      executionTimeMs: Date.now() - startTime,
      debugLogs
    };
  }
}
