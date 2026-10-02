import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeAudioDraft, parseAudioMessage } from '../../services/multimodal/audio-parser';

describe('Audio Parser & Voice Sanitization (Multimodal)', () => {
  it('debe sanitizar correctamente un borrador de audio con modismo de mitad y mitad', () => {
    const rawAiOutput = {
      raw_transcription: 'Gasté quince lucas en el supermercado Coto mitad y mitad',
      amount: 15000,
      concept: 'Supermercado Coto',
      suggested_classification: '50' as const,
      payer_hint: 'Lautaro',
      confidence: 0.95
    };

    const draft = sanitizeAudioDraft(rawAiOutput);

    assert.strictEqual(draft.amount, 15000);
    assert.strictEqual(draft.concept, 'Supermercado Coto');
    assert.strictEqual(draft.suggested_classification, '50');
    assert.strictEqual(draft.payer_hint, 'Lautaro');
    assert.strictEqual(draft.confidence, 0.95);
    assert.strictEqual(draft.source_type, 'audio');
    assert.strictEqual(draft.raw_transcription, 'Gasté quince lucas en el supermercado Coto mitad y mitad');
    assert.strictEqual(draft.metadata?.currency, 'ARS');
  });

  it('debe rechazar clasificaciones inválidas y dejarlas en null', () => {
    const corruptedAiOutput = {
      raw_transcription: 'Pagué 5000 en el kiosco',
      amount: 5000,
      concept: 'Kiosco',
      // @ts-expect-error test invalid classification
      suggested_classification: 'INVALID_TAG',
      confidence: 0.8
    };

    const draft = sanitizeAudioDraft(corruptedAiOutput);

    assert.strictEqual(draft.amount, 5000);
    assert.strictEqual(draft.suggested_classification, null, 'Clasificaciones no válidas deben ser null');
  });

  it('debe proteger contra montos negativos o valores NaN', () => {
    const corruptedAiOutput = {
      raw_transcription: 'Algo inaudible',
      amount: -1200,
      concept: '',
      confidence: -0.5
    };

    const draft = sanitizeAudioDraft(corruptedAiOutput);

    assert.strictEqual(draft.amount, 0);
    assert.strictEqual(draft.concept, 'Nota de Voz');
    assert.strictEqual(draft.confidence, 0);
  });

  it('debe responder con error controlado si no hay GEMINI_API_KEY', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      const fakeBuffer = Buffer.from('fake-audio-bytes');
      const response = await parseAudioMessage(fakeBuffer, 'audio/ogg');

      assert.strictEqual(response.success, false);
      assert.ok(response.error?.includes('GEMINI_API_KEY'));
      assert.ok(response.debugLogs && response.debugLogs.length > 0);
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });
});
