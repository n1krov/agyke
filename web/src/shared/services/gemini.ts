import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiExtractionResult } from '../types/database';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const SYSTEM_PROMPT = `
Eres un asistente contable para la app Agyke. Tu única tarea es analizar el audio, imagen, documento o texto provisto y extraer el monto total de la compra/gasto y un concepto corto en español.
Debes responder ÚNICAMENTE un objeto JSON válido con este formato:
{
  "amount": number,
  "concept": string
}
No agregues formato Markdown de bloque de código, ni texto explicativo, sólo el JSON puro.
Si no encuentras un concepto claro, pon "Gasto general".
Si no encuentras un monto claro, pon 0.
`;

export function fallbackParseText(text: string): GeminiExtractionResult {
  const amountMatch = text.match(/\$?\s*(\d+(?:[\.,]\d+)?)/);
  let amount = 0;
  if (amountMatch) {
    const rawNum = amountMatch[1].replace(/\./g, '').replace(',', '.');
    amount = parseFloat(rawNum) || 0;
  }

  let concept = text.replace(/\$?\s*(\d+(?:[\.,]\d+)?)/, '').trim();
  if (!concept) concept = 'Gasto general';

  return { amount, concept };
}

export async function processMediaWithGemini(
  fileBuffer: Buffer,
  mimeType: string
): Promise<GeminiExtractionResult> {
  if (!genAI || !process.env.GEMINI_API_KEY) {
    console.warn('[GeminiService] GEMINI_API_KEY no configurado. Usando procesamiento fallback.');
    return { amount: 0, concept: 'Gasto general' };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const mediaPart = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([SYSTEM_PROMPT, mediaPart]);
    const text = result.response.text().trim();
    
    const cleanText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleanText) as GeminiExtractionResult;

    return {
      amount: typeof parsed.amount === 'number' && !isNaN(parsed.amount) ? parsed.amount : 0,
      concept: parsed.concept ? String(parsed.concept) : 'Gasto general'
    };
  } catch (err) {
    console.error('[GeminiService] Error al procesar media con Gemini 1.5 Flash:', err);
    return { amount: 0, concept: 'Gasto general' };
  }
}

export async function processTextWithGemini(
  textPrompt: string
): Promise<GeminiExtractionResult> {
  if (!genAI || !process.env.GEMINI_API_KEY) {
    return fallbackParseText(textPrompt);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const prompt = `${SYSTEM_PROMPT}\n\nTexto a analizar: "${textPrompt}"`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    const cleanText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleanText) as GeminiExtractionResult;

    const amount = typeof parsed.amount === 'number' && !isNaN(parsed.amount) ? parsed.amount : 0;
    const concept = parsed.concept ? String(parsed.concept) : 'Gasto general';

    if (amount > 0) {
      return { amount, concept };
    }
    return fallbackParseText(textPrompt);
  } catch (err) {
    console.error('[GeminiService] Error al procesar texto con Gemini:', err);
    return fallbackParseText(textPrompt);
  }
}
