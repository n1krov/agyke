import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiExtractionResult } from '../types/database';

const SYSTEM_PROMPT = `
Eres un asistente contable. Tu única tarea es analizar el audio, imagen, archivo PDF/documento o texto provisto y extraer el monto de la compra y un concepto corto.
Debes responder ÚNICAMENTE un objeto JSON válido con este formato:
{
  "amount": number,
  "concept": string
}
No agregues texto explicativo, solo el JSON. Si no encuentras un concepto claro, pon "Gasto general". Si no encuentras monto, pon 0.
`;

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Falta la variable de entorno GEMINI_API_KEY.');
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function processMediaWithGemini(
  fileBuffer: Buffer,
  mimeType: string
): Promise<GeminiExtractionResult> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const parts = [
    {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType
      },
    },
  ];

  const result = await model.generateContent([SYSTEM_PROMPT, ...parts]);
  const responseText = result.response.text();
  return JSON.parse(responseText) as GeminiExtractionResult;
}

export async function processTextWithGemini(
  text: string
): Promise<GeminiExtractionResult> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const result = await model.generateContent([SYSTEM_PROMPT, `Texto del gasto: "${text}"`]);
  const responseText = result.response.text();
  return JSON.parse(responseText) as GeminiExtractionResult;
}
