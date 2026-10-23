import test from 'node:test';
import assert from 'node:assert/strict';
import type { ClassificationType } from '../types/database.js';

interface MockTransaction {
  id: string;
  user_id: string;
  amount: number;
  classification: ClassificationType;
  debt_impact: number;
  created_at: string;
}

function computeHeadToHeadAndTimeline(
  userA: { id: string; name: string },
  userB: { id: string; name: string },
  transactions: MockTransaction[],
  daysInMonth: number
) {
  let rawPaidUserA = 0;
  let countSharedUserA = 0;
  let rawPaidUserB = 0;
  let countSharedUserB = 0;

  const interactionDailyMap: Record<number, { userADaily: number; userBDaily: number; userACount: number; userBCount: number }> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    interactionDailyMap[d] = { userADaily: 0, userBDaily: 0, userACount: 0, userBCount: 0 };
  }

  transactions.forEach((t) => {
    const amount = Number(t.amount);
    const day = new Date(t.created_at).getUTCDate();

    if (t.user_id === userA.id) {
      if (t.classification === '50') {
        rawPaidUserA += amount;
        countSharedUserA += 1;
      }
      if (interactionDailyMap[day]) {
        interactionDailyMap[day].userADaily += amount;
        interactionDailyMap[day].userACount += 1;
      }
    } else if (t.user_id === userB.id) {
      if (t.classification === '50') {
        rawPaidUserB += amount;
        countSharedUserB += 1;
      }
      if (interactionDailyMap[day]) {
        interactionDailyMap[day].userBDaily += amount;
        interactionDailyMap[day].userBCount += 1;
      }
    }
  });

  const totalSharedPaid = rawPaidUserA + rawPaidUserB;
  const pctSharedUserA = totalSharedPaid > 0 ? Math.round((rawPaidUserA / totalSharedPaid) * 100) : 0;
  const pctSharedUserB = totalSharedPaid > 0 ? Math.round((rawPaidUserB / totalSharedPaid) * 100) : 0;
  const diffShared = Math.abs(rawPaidUserA - rawPaidUserB);
  const leaderName =
    rawPaidUserA > rawPaidUserB
      ? userA.name
      : rawPaidUserB > rawPaidUserA
      ? userB.name
      : 'Empate';

  let runningUserA = 0;
  let runningUserB = 0;
  const interactionTimeline = [];
  for (let d = 1; d <= daysInMonth; d++) {
    runningUserA += interactionDailyMap[d].userADaily;
    runningUserB += interactionDailyMap[d].userBDaily;
    interactionTimeline.push({
      day: d,
      userAAccum: runningUserA,
      userBAccum: runningUserB,
      userADaily: interactionDailyMap[d].userADaily,
      userBDaily: interactionDailyMap[d].userBDaily,
      userACount: interactionDailyMap[d].userACount,
      userBCount: interactionDailyMap[d].userBCount,
    });
  }

  return {
    headToHead: {
      userA: { rawPaid: rawPaidUserA, percentage: pctSharedUserA, count: countSharedUserA },
      userB: { rawPaid: rawPaidUserB, percentage: pctSharedUserB, count: countSharedUserB },
      totalSharedPaid,
      difference: diffShared,
      leaderName,
    },
    interactionTimeline,
  };
}

test('Cara a Cara: Calcula desembolso en crudo exclusivamente para compras 50/50', () => {
  const userA = { id: 'u1', name: 'Lautaro' };
  const userB = { id: 'u2', name: 'Compañera' };

  const txs: MockTransaction[] = [
    // Lautaro pagó $100.000 en el súper (50/50)
    { id: '1', user_id: 'u1', amount: 100000, classification: '50', debt_impact: 50000, created_at: '2026-10-02T12:00:00Z' },
    // Lautaro cargó un gasto personal suyo de $400.000 (0) -> NO debe alterar el cara a cara 50/50
    { id: '2', user_id: 'u1', amount: 400000, classification: '0', debt_impact: 0, created_at: '2026-10-05T12:00:00Z' },
    // Compañera pagó $40.000 en delivery (50/50)
    { id: '3', user_id: 'u2', amount: 400000, classification: '0', debt_impact: 0, created_at: '2026-10-06T12:00:00Z' }, // personal
    { id: '4', user_id: 'u2', amount: 40000, classification: '50', debt_impact: -20000, created_at: '2026-10-08T12:00:00Z' },
  ];

  const result = computeHeadToHeadAndTimeline(userA, userB, txs, 31);

  // Desembolso compartido crudo: Lautaro $100.000, Compañera $40.000
  assert.equal(result.headToHead.userA.rawPaid, 100000);
  assert.equal(result.headToHead.userB.rawPaid, 40000);
  assert.equal(result.headToHead.totalSharedPaid, 140000);
  assert.equal(result.headToHead.difference, 60000);
  assert.equal(result.headToHead.leaderName, 'Lautaro');
  assert.equal(result.headToHead.userA.percentage, 71); // 100/140 = 71.4%
  assert.equal(result.headToHead.userB.percentage, 29); // 40/140 = 28.6%
});

test('Interacción Temporal: Acumula TODO el dinero cargado sin importar clasificación', () => {
  const userA = { id: 'u1', name: 'Lautaro' };
  const userB = { id: 'u2', name: 'Compañera' };

  const txs: MockTransaction[] = [
    { id: '1', user_id: 'u1', amount: 50000, classification: '50', debt_impact: 25000, created_at: '2026-10-01T12:00:00Z' },
    { id: '2', user_id: 'u1', amount: 150000, classification: '0', debt_impact: 0, created_at: '2026-10-05T12:00:00Z' },
    { id: '3', user_id: 'u2', amount: 80000, classification: '100', debt_impact: -80000, created_at: '2026-10-03T12:00:00Z' },
  ];

  const result = computeHeadToHeadAndTimeline(userA, userB, txs, 10);

  // Día 1: Lautaro $50.000 acumulados
  assert.equal(result.interactionTimeline[0].userAAccum, 50000);
  assert.equal(result.interactionTimeline[0].userBAccum, 0);

  // Día 3: Compañera suma $80.000
  assert.equal(result.interactionTimeline[2].userAAccum, 50000);
  assert.equal(result.interactionTimeline[2].userBAccum, 80000);

  // Día 5: Lautaro suma $150.000 -> acumulado $200.000
  assert.equal(result.interactionTimeline[4].userAAccum, 200000);
  assert.equal(result.interactionTimeline[4].userBAccum, 80000);

  // Día 10 (final): Los acumulados persisten
  assert.equal(result.interactionTimeline[9].userAAccum, 200000);
  assert.equal(result.interactionTimeline[9].userBAccum, 80000);
});
