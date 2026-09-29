import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeReceiptDraft, parseReceiptImage } from '../../services/multimodal/receipt-parser';

describe('Receipt Parser & Sanitization (Multimodal)', () => {
  it('debe sanitizar correctamente un objeto devuelto por Gemini', () => {
    const rawAiOutput = {
      raw_transcription: 'Ticket Coto 28/09/2026 Total $18.450,50',
      amount: 18450.5,
      concept: 'Supermercado Coto',
      date: '2026-09-28',
      confidence: 0.95,
      metadata: {
        merchant: 'Coto C.I.C.S.A.',
        invoice_number: '0004-12345678',
        currency: 'ARS' as const
      }
    };

    const draft = sanitizeReceiptDraft(rawAiOutput);

    assert.strictEqual(draft.amount, 18450.5);
    assert.strictEqual(draft.concept, 'Supermercado Coto');
    assert.strictEqual(draft.date, '2026-09-28');
    assert.strictEqual(draft.confidence, 0.95);
    assert.strictEqual(draft.source_type, 'image');
    assert.strictEqual(draft.metadata?.merchant, 'Coto C.I.C.S.A.');
    assert.strictEqual(draft.metadata?.currency, 'ARS');
  });

  it('debe manejar montos inválidos, NaN o negativos protegiendo el contrato', () => {
    const corruptedAiOutput = {
      amount: -500,
      confidence: 1.5, // Fuera de rango
      concept: ''
    };

    const draft = sanitizeReceiptDraft(corruptedAiOutput);

    assert.strictEqual(draft.amount, 0, 'Montos negativos deben sanitizarse a 0');
    assert.strictEqual(draft.confidence, 1, 'Confidence debe limitarse a 1.0');
    assert.strictEqual(draft.concept, 'Comprobante', 'Debe asignar concepto por defecto');
    assert.strictEqual(draft.date, null, 'Fecha inválida debe ser null');
  });

  it('debe inferir el concepto a partir del merchant si concept viene vacío', () => {
    const draft = sanitizeReceiptDraft({
      amount: 4500,
      metadata: { merchant: 'Farmacity' }
    });

    assert.strictEqual(draft.amount, 4500);
    assert.strictEqual(draft.concept, 'Gasto en Farmacity');
  });

  it('debe responder con error controlado si no hay GEMINI_API_KEY', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      const fakeBuffer = Buffer.from('fake-image-bytes');
      const response = await parseReceiptImage(fakeBuffer, 'image/jpeg');

      assert.strictEqual(response.success, false);
      assert.ok(response.error?.includes('GEMINI_API_KEY'));
      assert.ok(response.debugLogs && response.debugLogs.length > 0);
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });
});
