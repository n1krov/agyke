import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PLAN_INPUTS,
  calculatePlan,
  simulatePlan,
  validateAndSanitizePlanInputs,
  formatArsShort,
  formatMonthsText,
  formatAxisShort,
} from './financial-plan';

describe('calculatePlan - Motor Matemático de Plan Financiero', () => {
  it('calcula correctamente los valores por defecto e invariante de reparto (100%)', () => {
    const plan = calculatePlan();

    assert.strictEqual(plan.inputs.sueldo, DEFAULT_PLAN_INPUTS.sueldo);
    assert.strictEqual(
      plan.reparto.fijosPct + plan.reparto.gustosPct + plan.reparto.invPct,
      100
    );
    assert.strictEqual(plan.reparto.fijosPct, 70);
    assert.strictEqual(plan.reparto.fijos, 1_575_000);
    assert.strictEqual(plan.reparto.gustos, 450_000);
    assert.strictEqual(plan.reparto.inversion, 225_000);
    assert.strictEqual(plan.reparto.sobrante, 225_000);
    assert.strictEqual(plan.reparto.aporte, 450_000);

    // Objetivos sobre sueldo (2.25M)
    assert.strictEqual(plan.objetivos.colchon, 6_750_000);
    assert.strictEqual(plan.objetivos.fondo, 13_500_000);
    assert.strictEqual(plan.objetivos.meta, 675_000_000);

    // Con 450k/mes: 6.75M en 15 meses, 13.5M en 30 meses
    assert.strictEqual(plan.hitos[0].etaMonths, 15);
    assert.strictEqual(plan.hitos[1].etaMonths, 30);
    assert.strictEqual(plan.destino, 'fondo');
    assert.strictEqual(plan.proyeccion.yearly.length, plan.inputs.anios + 1);
  });

  it('normaliza porcentajes si gustosPct + invPct excede 100%', () => {
    const plan = calculatePlan({ invPct: 45, gustosPct: 80 });
    assert.strictEqual(plan.reparto.invPct, 45);
    assert.strictEqual(plan.reparto.gustosPct, 55);
    assert.strictEqual(plan.reparto.fijosPct, 0);
  });

  it('respeta la cascada estricta: primero completa fondo y el excedente del mes de cruce pasa a inversión', () => {
    // Sueldo 1000, inv 10% (100), sobrante 0 -> aporte = 100/mes, rend 0%
    // fondoTarget = 250 (mesesFondo=1 sobre base=250? Mejor: sueldo=1000, mesesFondo=1 => 1000; fondoActual=960 -> faltan 40)
    // En mes 1 con aporte 100: 40 completan el fondo y 60 entran a inversión en el mismo mes.
    const plan = calculatePlan({
      sueldo: 1_000,
      invPct: 10,
      gustosPct: 20,
      sobrantePct: 0,
      mesesColchon: 1,
      mesesFondo: 1,
      mesesMeta: 12,
      rend: 0,
      anios: 1,
      fondoActual: 960,
      investActual: 0,
    });

    assert.strictEqual(plan.proyeccion.mesesParaFondo, 1);
    // Año 1 (12 meses): mes 1 suma 60 a inv, meses 2..12 suman 11 * 100 = 1100 -> total 1160
    assert.strictEqual(plan.proyeccion.final, 1_160);
  });

  it('maneja correctamente la máquina de estados de los 3 hitos (done / active / locked)', () => {
    // 1. Sin ahorros previos: colchón active, fondo locked, libertad locked
    const p0 = calculatePlan({ fondoActual: 0, investActual: 0 });
    assert.deepStrictEqual(
      p0.hitos.map((h) => h.state),
      ['active', 'locked', 'locked']
    );
    assert.strictEqual(p0.destino, 'fondo');

    // 2. Colchón completo (3 meses = 6.75M), fondo aún incompleto
    const p1 = calculatePlan({ fondoActual: 6_750_000, investActual: 0 });
    assert.deepStrictEqual(
      p1.hitos.map((h) => h.state),
      ['done', 'active', 'locked']
    );
    assert.strictEqual(p1.destino, 'fondo');

    // 3. Fondo completo (6 meses = 13.5M), libertad activa
    const p2 = calculatePlan({ fondoActual: 13_500_000, investActual: 1_000_000 });
    assert.deepStrictEqual(
      p2.hitos.map((h) => h.state),
      ['done', 'done', 'active']
    );
    assert.strictEqual(p2.destino, 'inversion');

    // 4. Todo completo
    const p3 = calculatePlan({
      fondoActual: 13_500_000,
      investActual: 700_000_000,
    });
    assert.deepStrictEqual(
      p3.hitos.map((h) => h.state),
      ['done', 'done', 'done']
    );
    assert.strictEqual(p3.proyeccion.aporteNecesario, 0);
    assert.strictEqual(p3.proyeccion.mesesParaMeta, 0);
  });

  it('bisección de aporteNecesario alcanza la meta exactamente al simularlo', () => {
    const plan = calculatePlan({
      sueldo: 2_000_000,
      invPct: 10,
      sobrantePct: 5,
      rend: 6,
      anios: 25,
      mesesFondo: 6,
      mesesMeta: 300,
    });

    const required = plan.proyeccion.aporteNecesario;
    assert.ok(required !== null);
    assert.ok(required > 0);

    const g = Math.pow(1 + plan.inputs.rend / 100, 1 / 12);
    const check = simulatePlan({
      fondo0: plan.inputs.fondoActual,
      inv0: plan.inputs.investActual,
      fondoTarget: plan.objetivos.fondo,
      colchonTarget: plan.objetivos.colchon,
      meta: plan.objetivos.meta,
      g,
      aporte: required,
      months: plan.inputs.anios * 12,
    });

    assert.ok(check.final >= plan.objetivos.meta - 1);
    const diff = Math.abs(check.final - plan.objetivos.meta);
    assert.ok(
      diff / plan.objetivos.meta < 0.0001,
      `Desvío relativo demasiado alto: ${diff / plan.objetivos.meta}`
    );
  });

  it('base "gastos" reduce la meta frente a base "sueldo" cuando invPct > 0', () => {
    const pSueldo = calculatePlan({ base: 'sueldo', invPct: 20, gustosPct: 20 });
    const pGastos = calculatePlan({ base: 'gastos', invPct: 20, gustosPct: 20 });

    assert.strictEqual(pSueldo.objetivos.base, pSueldo.inputs.sueldo);
    assert.strictEqual(pGastos.objetivos.base, pGastos.inputs.sueldo * 0.8);
    assert.ok(pGastos.objetivos.meta < pSueldo.objetivos.meta);
    assert.ok(pGastos.objetivos.fondo < pSueldo.objetivos.fondo);
  });

  it('maneja edge cases extremos (sueldo 0, aporte 0, rendimiento 0%) sin NaN ni Infinity', () => {
    const pZeroSalary = calculatePlan({ sueldo: 0 });
    assert.strictEqual(pZeroSalary.objetivos.meta, 0);
    assert.strictEqual(pZeroSalary.proyeccion.aporteNecesario, null);
    assert.ok(Number.isFinite(pZeroSalary.proyeccion.final));

    const pZeroSavings = calculatePlan({ invPct: 0, sobrantePct: 0 });
    assert.strictEqual(pZeroSavings.reparto.aporte, 0);
    assert.strictEqual(pZeroSavings.hitos[0].etaMonths, null);
    assert.strictEqual(pZeroSavings.hitos[1].etaMonths, null);
    assert.strictEqual(pZeroSavings.hitos[2].etaMonths, null);

    const pZeroYield = calculatePlan({ rend: 0, anios: 10 });
    assert.ok(Number.isFinite(pZeroYield.proyeccion.final));
    const zeroYieldReq = pZeroYield.proyeccion.aporteNecesario;
    assert.ok(zeroYieldReq !== null);
    assert.ok(Number.isFinite(zeroYieldReq));
  });
});

describe('validateAndSanitizePlanInputs y Helpers de Formato', () => {
  it('rechaza payloads no-objeto o con valores no finitos o base inválida', () => {
    assert.strictEqual(validateAndSanitizePlanInputs(null).valid, false);
    assert.strictEqual(validateAndSanitizePlanInputs([]).valid, false);
    assert.strictEqual(
      validateAndSanitizePlanInputs({ sueldo: 'abc' }).valid,
      false
    );
    assert.strictEqual(
      validateAndSanitizePlanInputs({ base: 'invalido' }).valid,
      false
    );
  });

  it('sanitiza y aplica clamping a rangos seguros', () => {
    const res = validateAndSanitizePlanInputs({
      sueldo: -5000,
      invPct: 30,
      gustosPct: 90,
      mesesFondo: 4,
      mesesColchon: 10,
      base: 'gastos',
    });

    assert.strictEqual(res.valid, true);
    const sanitized = res.value;
    assert.ok(sanitized);
    assert.strictEqual(sanitized.sueldo, 0);
    assert.strictEqual(sanitized.invPct, 30);
    assert.strictEqual(sanitized.gustosPct, 70);
    assert.strictEqual(sanitized.mesesFondo, 4);
    assert.strictEqual(sanitized.mesesColchon, 4);
    assert.strictEqual(sanitized.base, 'gastos');
  });

  it('formatea correctamente montos abreviados, ejes y duraciones en es-AR', () => {
    assert.strictEqual(formatMonthsText(0), 'ya está');
    assert.strictEqual(formatMonthsText(1), '1 mes');
    assert.strictEqual(formatMonthsText(12), '1 año');
    assert.strictEqual(formatMonthsText(26), '2 años y 2 meses');
    assert.strictEqual(formatMonthsText(null), null);

    assert.ok(formatArsShort(2_500_000).includes('M'));
    assert.ok(formatAxisShort(500_000).includes('mil'));
    assert.strictEqual(formatAxisShort(0), '0');
  });
});
