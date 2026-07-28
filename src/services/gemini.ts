import { GeminiExtractionResult } from '../types/database';

/**
 * Módulo de procesamiento local instantáneo (Integración con IA externa pausada).
 * Todos los gastos se procesan en local sin realizar llamadas externas ni consumir cuotas de API.
 */

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
  _fileBuffer: Buffer,
  _mimeType: string
): Promise<GeminiExtractionResult> {
  // Retorna extracción por defecto local sin llamadas de red a IA
  return { amount: 0, concept: 'Gasto general' };
}

export async function processTextWithGemini(
  text: string
): Promise<GeminiExtractionResult> {
  // Parseo local instantáneo con Regex sin llamadas de red a IA
  return fallbackParseText(text);
}
