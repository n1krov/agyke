import { describe, it } from 'node:test';
import assert from 'node:assert';
import { verifyPin, createSessionToken, verifySessionToken } from '../../web/src/lib/auth.ts';

describe('Sistema de Autenticación por PIN y Sesión Criptográfica (Auth)', () => {
  it('debe validar correctamente el PIN configurado', () => {
    process.env.DASHBOARD_ACCESS_PIN = '1234';

    assert.strictEqual(verifyPin('1234'), true, 'El PIN correcto debe ser válido');
    assert.strictEqual(verifyPin(' 1234 '), true, 'El PIN con espacios debe normalizarse');
    assert.strictEqual(verifyPin('0000'), false, 'Un PIN incorrecto debe ser rechazado');
    assert.strictEqual(verifyPin(''), false, 'Un PIN vacío debe ser rechazado');
    assert.strictEqual(verifyPin(undefined), false, 'Un PIN undefined debe ser rechazado');
  });

  it('debe generar y verificar un token de sesión válido', async () => {
    process.env.SESSION_SECRET = 'secreto_super_seguro_de_prueba_2026';

    const token = await createSessionToken();
    assert.ok(token, 'El token debe existir');
    assert.ok(token.includes('.'), 'El token debe tener formato timestamp.firma');

    const isValid = await verifySessionToken(token);
    assert.strictEqual(isValid, true, 'El token generado debe ser válido');
  });

  it('debe rechazar tokens alterados o con firma inválida', async () => {
    process.env.SESSION_SECRET = 'secreto_super_seguro_de_prueba_2026';

    const token = await createSessionToken();
    const [timestamp] = token.split('.');
    const forgedToken = `${timestamp}.deadbeef1234567890`;

    const isValid = await verifySessionToken(forgedToken);
    assert.strictEqual(isValid, false, 'Un token con firma alterada debe ser rechazado');
  });

  it('debe rechazar tokens expirados', async () => {
    process.env.SESSION_SECRET = 'secreto_super_seguro_de_prueba_2026';

    const token = await createSessionToken();
    // Validar con maxAgeSeconds = -1 para forzar expiración inmediata
    const isExpired = await verifySessionToken(token, -1);
    assert.strictEqual(isExpired, false, 'Un token expirado debe ser rechazado');
  });

  it('debe rechazar valores nulos o malformados', async () => {
    assert.strictEqual(await verifySessionToken(null), false);
    assert.strictEqual(await verifySessionToken(undefined), false);
    assert.strictEqual(await verifySessionToken('token-sin-punto'), false);
    assert.strictEqual(await verifySessionToken('abc.def'), false);
  });
});
