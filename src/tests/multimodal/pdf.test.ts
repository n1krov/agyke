import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizePdfDraft, parsePdfDocument } from '../../services/multimodal/pdf-parser';

describe('PDF Document Parser & Sanitization (Multimodal)', () => {
  it('debe sanitizar correctamente un borrador de factura electrónica AFIP', () => {
    const rawAiOutput = {
      raw_transcription: 'Factura B 0003-00045129 Farmacias Central Oeste Total $18.950,00',
      amount: 18950,
      concept: 'Farmacias Central Oeste',
      date: '2026-09-25',
      confidence: 0.98,
      metadata: {
        merchant: 'Farmacias Central Oeste S.A.',
        invoice_number: '0003-00045129',
        currency: 'ARS' as const
      }
    };

    const draft = sanitizePdfDraft(rawAiOutput);

    assert.strictEqual(draft.amount, 18950);
    assert.strictEqual(draft.concept, 'Farmacias Central Oeste');
    assert.strictEqual(draft.date, '2026-09-25');
    assert.strictEqual(draft.confidence, 0.98);
    assert.strictEqual(draft.source_type, 'document');
    assert.strictEqual(draft.metadata?.merchant, 'Farmacias Central Oeste S.A.');
    assert.strictEqual(draft.metadata?.invoice_number, '0003-00045129');
    assert.strictEqual(draft.metadata?.currency, 'ARS');
  });

  it('debe inferir el concepto a partir del emisor si concept viene vacío', () => {
    const draft = sanitizePdfDraft({
      amount: 32000,
      metadata: { merchant: 'Edenor' }
    });

    assert.strictEqual(draft.amount, 32000);
    assert.strictEqual(draft.concept, 'Factura de Edenor');
    assert.strictEqual(draft.source_type, 'document');
  });

  it('debe proteger contra montos negativos o valores corruptos', () => {
    const corruptedAiOutput = {
      amount: -4500,
      confidence: 2.0,
      concept: ''
    };

    const draft = sanitizePdfDraft(corruptedAiOutput);

    assert.strictEqual(draft.amount, 0);
    assert.strictEqual(draft.concept, 'Factura / Documento PDF');
    assert.strictEqual(draft.confidence, 1);
  });

  it('debe responder con error controlado si no hay GEMINI_API_KEY', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      const fakeBuffer = Buffer.from('fake-pdf-bytes');
      const response = await parsePdfDocument(fakeBuffer, 'application/pdf');

      assert.strictEqual(response.success, false);
      assert.ok(response.error?.includes('GEMINI_API_KEY'));
      assert.ok(response.debugLogs && response.debugLogs.length > 0);
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });
});
