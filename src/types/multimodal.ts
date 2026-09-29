import type { ClassificationType } from './database';

export interface ExtractedExpenseDraft {
  /** Monto monetario detectado. Debe ser estrictamente positivo. 0 si no se detectó */
  amount: number;

  /** Concepto o descripción corta del gasto (ej: "Supermercado Coto", "Farmacia") */
  concept: string;

  /** Fecha de la transacción en formato ISO YYYY-MM-DD (si fue detectada en el ticket/factura) */
  date?: string | null;

  /** Clasificación de deuda detectada explícitamente en el audio o texto (50, 100, -100, 0) */
  suggested_classification?: ClassificationType | null;

  /** Nombre o alias de quien pagó si se mencionó explícitamente (ej: "pagó Lautaro") */
  payer_hint?: string | null;

  /** Nivel de certeza de la IA entre 0.0 y 1.0 */
  confidence: number;

  /** Transcripción del audio o resumen textual del comprobante para auditoría y preview */
  raw_transcription?: string | null;

  /** Tipo de fuente original */
  source_type: 'audio' | 'image' | 'document' | 'text';

  /** Metadatos extendidos para soporte contable avanzado */
  metadata?: {
    merchant?: string | null;       // Comercio o emisor (ej: "Carrefour", "Edenor")
    invoice_number?: string | null; // Número de factura o transacción
    currency?: string;              // "ARS", "USD" (por defecto "ARS")
    page_count?: number;            // Cantidad de páginas en PDFs
  };
}

export interface MultimodalProcessResponse {
  success: boolean;
  draft?: ExtractedExpenseDraft;
  rawResponse?: string;
  executionTimeMs: number;
  error?: string;
  debugLogs?: string[];
}
