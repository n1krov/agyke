import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fallbackParseText } from './gemini';

describe('fallbackParseText - Extracción de Monto y Concepto sin IA', () => {
  it('extrae monto y concepto cuando el monto está al principio', () => {
    const res = fallbackParseText('12500 Verdulería');
    assert.strictEqual(res.amount, 12500);
    assert.strictEqual(res.concept, 'Verdulería');
  });

  it('extrae monto con signo pesos', () => {
    const res = fallbackParseText('$15000 Supermercado Coto');
    assert.strictEqual(res.amount, 15000);
    assert.strictEqual(res.concept, 'Supermercado Coto');
  });

  it('extrae montos con puntos de miles y comas decimales', () => {
    const res = fallbackParseText('$ 3.500,50 Farmacia');
    assert.strictEqual(res.amount, 3500.5);
    assert.strictEqual(res.concept, 'Farmacia');
  });

  it('asigna "Gasto general" si solo se envía un monto', () => {
    const res = fallbackParseText('4500');
    assert.strictEqual(res.amount, 4500);
    assert.strictEqual(res.concept, 'Gasto general');
  });

  it('retorna monto 0 y mantiene el concepto si no hay números', () => {
    const res = fallbackParseText('Gasto en taxi');
    assert.strictEqual(res.amount, 0);
    assert.strictEqual(res.concept, 'Gasto en taxi');
  });

  it('maneja strings vacíos retornando valores por defecto', () => {
    const res = fallbackParseText('');
    assert.strictEqual(res.amount, 0);
    assert.strictEqual(res.concept, 'Gasto general');
  });
});
