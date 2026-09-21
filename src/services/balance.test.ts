import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDebtImpact } from './balance';
import type { ClassificationType } from '../types/database';

describe('calculateDebtImpact - Reglas Financieras de Agyke', () => {
  it('debe calcular + (monto / 2) para clasificación 50 (Compartido 50/50)', () => {
    assert.strictEqual(calculateDebtImpact(10000, '50'), 5000);
    assert.strictEqual(calculateDebtImpact(1500, '50'), 750);
    assert.strictEqual(calculateDebtImpact(0, '50'), 0);
  });

  it('debe calcular + monto para clasificación 100 (Favor 100%)', () => {
    assert.strictEqual(calculateDebtImpact(10000, '100'), 10000);
    assert.strictEqual(calculateDebtImpact(2500.75, '100'), 2500.75);
  });

  it('debe calcular - monto para clasificación -100 (Deuda Propia)', () => {
    assert.strictEqual(calculateDebtImpact(10000, '-100'), -10000);
    assert.strictEqual(calculateDebtImpact(4321, '-100'), -4321);
  });

  it('debe calcular 0 para clasificación 0 (Personal)', () => {
    assert.strictEqual(calculateDebtImpact(10000, '0'), 0);
    assert.strictEqual(calculateDebtImpact(999999, '0'), 0);
  });

  it('debe retornar 0 si se ingresa una clasificación no reconocida', () => {
    assert.strictEqual(calculateDebtImpact(1000, 'invalido' as ClassificationType), 0);
  });

  it('manejo correcto de decimales y centavos en gastos compartidos', () => {
    const result = calculateDebtImpact(100.50, '50');
    assert.strictEqual(result, 50.25);
  });
});

describe('Lógica de Saldo Neto Consolidado (net_balance)', () => {
  /**
   * Simulación del recálculo matemático de balance
   * Reglas de REQUIREMENTS.md:
   * - net_balance > 0: El Usuario B le debe dinero al Usuario A.
   * - net_balance < 0: El Usuario A le debe dinero al Usuario B.
   * - net_balance == 0: Cuentas saldadas.
   */
  function simulateNetBalance(
    userAId: string,
    userBId: string,
    transactions: Array<{ userId: string; debtImpact: number }>
  ): number {
    let net = 0;
    for (const tx of transactions) {
      if (tx.userId === userAId) {
        net += tx.debtImpact;
      } else if (tx.userId === userBId) {
        net -= tx.debtImpact;
      }
    }
    return net;
  }

  const userA = 'user-a-uuid';
  const userB = 'user-b-uuid';

  it('si el Usuario A paga 50/50 por $20.000, Usuario B le debe $10.000 (net_balance = +10.000)', () => {
    const impact = calculateDebtImpact(20000, '50');
    const net = simulateNetBalance(userA, userB, [
      { userId: userA, debtImpact: impact }
    ]);
    assert.strictEqual(net, 10000);
  });

  it('si el Usuario B paga 50/50 por $6.000 luego, el balance se reduce a +7.000 a favor de A', () => {
    const impactA = calculateDebtImpact(20000, '50'); // +10000
    const impactB = calculateDebtImpact(6000, '50');  // +3000 pagado por B -> resta 3000
    const net = simulateNetBalance(userA, userB, [
      { userId: userA, debtImpact: impactA },
      { userId: userB, debtImpact: impactB }
    ]);
    assert.strictEqual(net, 7000);
  });

  it('si el Usuario B hace un pago/favor 100% de $7.000 a favor de A, las cuentas quedan saldadas (0)', () => {
    const impactA = calculateDebtImpact(20000, '50'); // +10000
    const impactB1 = calculateDebtImpact(6000, '50'); // -3000
    const impactB2 = calculateDebtImpact(7000, '100'); // -7000
    const net = simulateNetBalance(userA, userB, [
      { userId: userA, debtImpact: impactA },
      { userId: userB, debtImpact: impactB1 },
      { userId: userB, debtImpact: impactB2 }
    ]);
    assert.strictEqual(net, 0);
  });

  it('si el Usuario B paga $10.000 de favor 100%, A le debe $3.000 a B (net_balance = -3.000)', () => {
    const impactA = calculateDebtImpact(14000, '50'); // +7000
    const impactB = calculateDebtImpact(10000, '100'); // -10000
    const net = simulateNetBalance(userA, userB, [
      { userId: userA, debtImpact: impactA },
      { userId: userB, debtImpact: impactB }
    ]);
    assert.strictEqual(net, -3000);
  });
});
