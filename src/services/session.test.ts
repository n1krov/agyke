import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getSession, setSession, clearSession } from './session';

describe('Gestor de Sesiones de Gastos (session.ts)', () => {
  const telegramId = 123456789;

  beforeEach(() => {
    clearSession(telegramId);
  });

  it('retorna undefined si el usuario no tiene borrador activo', () => {
    assert.strictEqual(getSession(telegramId), undefined);
  });

  it('permite guardar y recuperar un borrador de gasto', () => {
    setSession(telegramId, {
      userId: 'uuid-1',
      step: 'AWAITING_AMOUNT'
    });

    const session = getSession(telegramId);
    assert.ok(session);
    assert.strictEqual(session.userId, 'uuid-1');
    assert.strictEqual(session.step, 'AWAITING_AMOUNT');
  });

  it('permite actualizar el paso y datos del borrador', () => {
    setSession(telegramId, {
      userId: 'uuid-1',
      step: 'AWAITING_CONCEPT',
      amount: 1500
    });

    let session = getSession(telegramId);
    assert.strictEqual(session?.amount, 1500);

    setSession(telegramId, {
      ...session!,
      step: 'AWAITING_CLASSIFICATION',
      concept: 'Almuerzo'
    });

    session = getSession(telegramId);
    assert.strictEqual(session?.step, 'AWAITING_CLASSIFICATION');
    assert.strictEqual(session?.concept, 'Almuerzo');
  });

  it('elimina la sesión correctamente con clearSession', () => {
    setSession(telegramId, {
      userId: 'uuid-1',
      step: 'AWAITING_AMOUNT'
    });
    assert.ok(getSession(telegramId));

    clearSession(telegramId);
    assert.strictEqual(getSession(telegramId), undefined);
  });
});
