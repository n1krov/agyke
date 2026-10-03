import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExtractedExpenseDraft, MultimodalProcessResponse } from '../../types/multimodal';
import type { ClassificationType } from '../../types/database';

export const VOICE_EXTRACTION_SYSTEM_PROMPT = `
Eres un asistente contable de alta precisión para la aplicación Agyke (sistema de finanzas compartidas en Argentina).
Tu tarea es escuchar el audio provisto, transcribir lo que dijo el usuario y extraer los datos del gasto.

Debes responder ÚNICAMENTE un objeto JSON válido (sin Markdown, sin bloques de código) con la siguiente estructura:
{
  "raw_transcription": string,
  "amount": number,
  "concept": string,
  "suggested_classification": "50" | "100" | "-100" | "0" | null,
  "payer_hint": string | null,
  "confidence": number
}

Reglas específicas de interpretación financiera argentina:
- "lucas" equivale a miles (ej: "15 lucas" = 15000, "3 lucas y media" = 3500, "media luca" = 500).
- "palos" equivale a millones (ej: "un palo" = 1000000).
- "mitad y mitad", "a medias", "compartido" o "dividido" implica suggested_classification: "50".
- Si el usuario dice que pagó todo por la otra persona ("le pagué a...", "favor", "me lo debe"), suggested_classification es "100".
- Si el usuario dice que le pagaron algo a él o que él debe la totalidad ("me pagó...", "se lo debo"), suggested_classification es "-100".
- Si es un gasto personal o individual ("gasto mío", "personal", "para mí solo"), suggested_classification es "0".
- Si no se especifica división en el audio, deja suggested_classification en null.
- Si no hay ningún monto explícito o el audio es inaudible, responde amount: 0, concept: "Audio inaudible o sin monto", confidence: 0.0.
`;

const VALID_CLASSIFICATIONS: ClassificationType[] = ['50', '100', '-100', '0'];

export function sanitizeAudioDraft(
  parsed: Partial<ExtractedExpenseDraft> | Record<string, unknown> | null | undefined
): ExtractedExpenseDraft {
  let amount = 0;
  if (typeof parsed?.amount === 'number' && !isNaN(parsed.amount)) {
    amount = Math.max(0, Math.round(parsed.amount * 100) / 100);
  }

  let concept = typeof parsed?.concept === 'string' ? parsed.concept.trim() : '';
  if (!concept) {
    concept = 'Nota de Voz';
  }

  let confidence = 0.5;
  if (typeof parsed?.confidence === 'number' && !isNaN(parsed.confidence)) {
    confidence = Math.min(1, Math.max(0, parsed.confidence));
  } else if (amount > 0) {
    confidence = 0.85;
  }

  let suggested_classification: ClassificationType | null = null;
  if (
    typeof parsed?.suggested_classification === 'string' &&
    VALID_CLASSIFICATIONS.includes(parsed.suggested_classification as ClassificationType)
  ) {
    suggested_classification = parsed.suggested_classification as ClassificationType;
  }

  let payer_hint: string | null = null;
  if (typeof parsed?.payer_hint === 'string' && parsed.payer_hint.trim().length > 0) {
    payer_hint = parsed.payer_hint.trim();
  }

  const raw_transcription = parsed?.raw_transcription ? String(parsed.raw_transcription).trim() : null;

  return {
    amount,
    concept,
    date: null,
    suggested_classification,
    payer_hint,
    confidence,
    raw_transcription,
    source_type: 'audio',
    metadata: {
      currency: 'ARS'
    }
  };
}

export async function parseAudioMessage(
  audioBuffer: Buffer,
  mimeType: string = 'audio/ogg'
): Promise<MultimodalProcessResponse> {
  const startTime = Date.now();
  const debugLogs: string[] = [];

  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    const entry = `[${timestamp}] ${msg}`;
    debugLogs.push(entry);
    console.log(`[AudioParser] ${entry}`);
  };

  addLog(`Iniciando procesamiento de audio (${(audioBuffer.length / 1024).toFixed(1)} KB, Mime: ${mimeType})`);

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

    addLog('Codificando audio a Base64 para payload inlineData...');
    const mediaPart = {
      inlineData: {
        data: audioBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    let rawText = '';
    let lastError: unknown = null;
    let usedModel = '';

    for (const modelName of CANDIDATE_MODELS) {
      try {
        addLog(`Enviando audio a Gemini (Modelo: ${modelName})...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        const result = await model.generateContent([VOICE_EXTRACTION_SYSTEM_PROMPT, mediaPart]);
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

    const draft = sanitizeAudioDraft(parsedData);
    addLog(`✅ Sanitización exitosa: Monto=$${draft.amount}, Concepto="${draft.concept}", Clasif=${draft.suggested_classification || 'N/A'}, Certeza=${(draft.confidence * 100).toFixed(0)}%`);

    return {
      success: true,
      draft,
      rawResponse: rawText,
      executionTimeMs: Date.now() - startTime,
      debugLogs
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    addLog(`❌ Excepción durante la transcripción/inferencia: ${error}`);
    return {
      success: false,
      error,
      executionTimeMs: Date.now() - startTime,
      debugLogs
    };
  }
}
