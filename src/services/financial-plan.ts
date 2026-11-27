import type {
  FinancialPlanHito,
  FinancialPlanInputs,
  FinancialPlanResult,
  PlanBase,
  PlanValidationResult,
} from '../types/financial-plan';

export const DEFAULT_PLAN_INPUTS: FinancialPlanInputs = {
  sueldo: 2_250_000,
  gustosPct: 20,
  invPct: 10,
  sobrantePct: 10,
  base: 'sueldo',
  mesesColchon: 3,
  mesesFondo: 6,
  mesesMeta: 300,
  rend: 5,
  anios: 38,
  fondoActual: 0,
  investActual: 0,
};

export const PLAN_LIMITS = {
  maxMoney: 1e12,
  gustosPct: { min: 0, max: 60 },
  invPct: { min: 0, max: 50 },
  sobrantePct: { min: 0, max: 30 },
  mesesColchon: { min: 1, max: 24 },
  mesesFondo: { min: 1, max: 36 },
  mesesMeta: { min: 12, max: 600 },
  rend: { min: 0, max: 12, engineMin: -5, engineMax: 30 },
  anios: { min: 5, max: 50, engineMin: 1, engineMax: 80 },
} as const;

const SIMULATION_HORIZON_YEARS = 80;
const EPS = 0.5;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizePlanInputs(
  input?: Partial<FinancialPlanInputs> | null
): FinancialPlanInputs {
  const merged = { ...DEFAULT_PLAN_INPUTS, ...(input ?? {}) };

  const sueldo = clamp(
    Number.isFinite(Number(merged.sueldo)) ? Number(merged.sueldo) : 0,
    0,
    PLAN_LIMITS.maxMoney
  );
  const invPct = clamp(
    Number.isFinite(Number(merged.invPct)) ? Number(merged.invPct) : 0,
    0,
    100
  );
  const gustosPct = clamp(
    Number.isFinite(Number(merged.gustosPct)) ? Number(merged.gustosPct) : 0,
    0,
    100 - invPct
  );
  const sobrantePct = clamp(
    Number.isFinite(Number(merged.sobrantePct)) ? Number(merged.sobrantePct) : 0,
    0,
    100
  );
  const base: PlanBase = merged.base === 'gastos' ? 'gastos' : 'sueldo';

  const mesesFondo = clamp(
    Math.round(Number(merged.mesesFondo)) || 1,
    1,
    60
  );
  const mesesColchon = clamp(
    Math.round(Number(merged.mesesColchon)) || 1,
    1,
    mesesFondo
  );
  const mesesMeta = clamp(
    Math.round(Number(merged.mesesMeta)) || 1,
    1,
    1200
  );
  const anios = clamp(
    Math.round(Number(merged.anios)) || 1,
    PLAN_LIMITS.anios.engineMin,
    PLAN_LIMITS.anios.engineMax
  );
  const rend = clamp(
    Number.isFinite(Number(merged.rend)) ? Number(merged.rend) : 0,
    PLAN_LIMITS.rend.engineMin,
    PLAN_LIMITS.rend.engineMax
  );
  const fondoActual = clamp(
    Number.isFinite(Number(merged.fondoActual)) ? Number(merged.fondoActual) : 0,
    0,
    PLAN_LIMITS.maxMoney
  );
  const investActual = clamp(
    Number.isFinite(Number(merged.investActual)) ? Number(merged.investActual) : 0,
    0,
    PLAN_LIMITS.maxMoney
  );

  return {
    sueldo,
    gustosPct,
    invPct,
    sobrantePct,
    base,
    mesesColchon,
    mesesFondo,
    mesesMeta,
    rend,
    anios,
    fondoActual,
    investActual,
  };
}

export function validateAndSanitizePlanInputs(
  raw: unknown
): PlanValidationResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      valid: false,
      error: 'La configuración del plan debe ser un objeto JSON válido.',
    };
  }

  const record = raw as Record<string, unknown>;
  const numericFields: Array<keyof Omit<FinancialPlanInputs, 'base'>> = [
    'sueldo',
    'gustosPct',
    'invPct',
    'sobrantePct',
    'mesesColchon',
    'mesesFondo',
    'mesesMeta',
    'rend',
    'anios',
    'fondoActual',
    'investActual',
  ];

  const partial: Partial<FinancialPlanInputs> = {};

  for (const field of numericFields) {
    if (record[field] === undefined) continue;
    const val = Number(record[field]);
    if (!Number.isFinite(val)) {
      return {
        valid: false,
        error: `El campo "${field}" debe ser un número finito válido.`,
      };
    }
    partial[field] = val;
  }

  if (record.base !== undefined) {
    if (record.base !== 'sueldo' && record.base !== 'gastos') {
      return {
        valid: false,
        error: 'El campo "base" debe ser "sueldo" o "gastos".',
      };
    }
    partial.base = record.base;
  }

  return {
    valid: true,
    value: normalizePlanInputs(partial),
  };
}

export interface SimulationParams {
  fondo0: number;
  inv0: number;
  fondoTarget: number;
  colchonTarget: number;
  meta: number;
  g: number;
  aporte: number;
  months: number;
  keep?: boolean;
}

export interface SimulationResult {
  mColchon: number | null;
  mFondo: number | null;
  mMeta: number | null;
  series: number[] | null;
  final: number;
  fondo: number;
}

/**
 * Simula mes a mes en pesos reales de hoy.
 * Primero el ahorro llena el fondo de emergencia; el excedente del mes
 * (o todo el ahorro una vez completo el fondo) entra a inversión de largo plazo.
 */
export function simulatePlan(p: SimulationParams): SimulationResult {
  let fondo = p.fondo0;
  let inv = p.inv0;
  let mColchon: number | null = fondo >= p.colchonTarget - EPS ? 0 : null;
  let mFondo: number | null = fondo >= p.fondoTarget - EPS ? 0 : null;
  let mMeta: number | null = p.meta > 0 && inv >= p.meta ? 0 : null;
  const series: number[] | null = p.keep ? [inv] : null;

  for (let m = 1; m <= p.months; m++) {
    inv *= p.g;
    let add = 0;
    if (fondo < p.fondoTarget - EPS) {
      add = Math.min(p.aporte, p.fondoTarget - fondo);
      fondo += add;
    }
    inv += p.aporte - add;

    if (mColchon === null && fondo >= p.colchonTarget - EPS) mColchon = m;
    if (mFondo === null && fondo >= p.fondoTarget - EPS) mFondo = m;
    if (mMeta === null && p.meta > 0 && inv >= p.meta) mMeta = m;
    if (series) series.push(inv);
  }

  return { mColchon, mFondo, mMeta, series, final: inv, fondo };
}

/**
 * Motor puro de planificación financiera salarial.
 * Paridad matemática exacta con plan-financiero.html.
 */
export function calculatePlan(
  input?: Partial<FinancialPlanInputs> | null
): FinancialPlanResult {
  const inputs = normalizePlanInputs(input);

  const fijosPct = 100 - inputs.invPct - inputs.gustosPct;
  const fijos = (inputs.sueldo * fijosPct) / 100;
  const gustos = (inputs.sueldo * inputs.gustosPct) / 100;
  const inversion = (inputs.sueldo * inputs.invPct) / 100;
  const sobrante = (inputs.sueldo * inputs.sobrantePct) / 100;
  const aporte = inversion + sobrante;
  const gastos = fijos + gustos;
  const baseMonto = inputs.base === 'gastos' ? gastos : inputs.sueldo;

  const g = Math.pow(1 + inputs.rend / 100, 1 / 12);
  const fondoTarget = inputs.mesesFondo * baseMonto;
  const colchonTarget = inputs.mesesColchon * baseMonto;
  const meta = inputs.mesesMeta * baseMonto;

  const horizonM = inputs.anios * 12;
  const simBase = {
    fondo0: inputs.fondoActual,
    inv0: inputs.investActual,
    fondoTarget,
    colchonTarget,
    meta,
    g,
  };

  const sim = simulatePlan({
    ...simBase,
    aporte,
    months: SIMULATION_HORIZON_YEARS * 12,
    keep: true,
  });

  const series = sim.series ?? [inputs.investActual];
  const yearly: number[] = [];
  for (let i = 0; i <= inputs.anios; i++) {
    yearly.push(series[i * 12] ?? 0);
  }
  const finalCapital = series[horizonM] ?? 0;

  let required: number | null = null;
  if (meta > 0) {
    const finalFor = (k: number): number =>
      simulatePlan({ ...simBase, aporte: k, months: horizonM }).final;

    if (finalFor(0) >= meta) {
      required = 0;
    } else {
      let hi = (meta + fondoTarget) / horizonM + 1;
      let tries = 0;
      while (finalFor(hi) < meta && tries++ < 40) {
        hi *= 2;
      }
      let lo = 0;
      for (let j = 0; j < 50; j++) {
        const mid = (lo + hi) / 2;
        if (finalFor(mid) >= meta) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
      required = hi;
    }
  }

  const doneColchon = inputs.fondoActual >= colchonTarget - EPS;
  const doneFondo = inputs.fondoActual >= fondoTarget - EPS;
  const doneMeta = meta > 0 && inputs.investActual >= meta;

  const hitos: FinancialPlanHito[] = [
    {
      id: 'colchon',
      state: doneColchon ? 'done' : 'active',
      current: inputs.fondoActual,
      target: colchonTarget,
      etaMonths: sim.mColchon,
    },
    {
      id: 'fondo',
      state: doneFondo ? 'done' : doneColchon ? 'active' : 'locked',
      current: inputs.fondoActual,
      target: fondoTarget,
      etaMonths: sim.mFondo,
    },
    {
      id: 'libertad',
      state: doneMeta ? 'done' : doneFondo ? 'active' : 'locked',
      current: inputs.investActual,
      target: meta,
      etaMonths: sim.mMeta,
    },
  ];

  return {
    inputs,
    reparto: {
      fijos,
      gustos,
      inversion,
      fijosPct,
      gustosPct: inputs.gustosPct,
      invPct: inputs.invPct,
      sobrante,
      aporte,
    },
    destino: doneFondo ? 'inversion' : 'fondo',
    objetivos: {
      colchon: colchonTarget,
      fondo: fondoTarget,
      meta,
      base: baseMonto,
    },
    hitos,
    proyeccion: {
      anios: inputs.anios,
      final: finalCapital,
      yearly,
      metaEnHorizonte: finalCapital >= meta,
      mesesParaMeta: sim.mMeta,
      mesesParaFondo: sim.mFondo,
      aporteNecesario: required,
    },
  };
}

/* =====================================================================
   Helpers de formato (es-AR) compartidos
   ===================================================================== */

const nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

export function formatNumberEsAr(n: number): string {
  return nf0.format(Math.round(n));
}

export function formatDecimalEsAr(n: number): string {
  return nf1.format(n);
}

export function formatArs(n: number): string {
  return `$\u00A0${nf0.format(Math.round(n))}`;
}

export function formatArsShort(n: number): string {
  if (n >= 1e9) {
    return `$\u00A0${nf1.format(n / 1e9)}\u00A0MM`;
  }
  if (n >= 1e6) {
    return `$\u00A0${nf1.format(n / 1e6)}\u00A0M`;
  }
  return formatArs(n);
}

export function formatAxisShort(v: number): string {
  if (v >= 1e9) return `${nf1.format(v / 1e9)} MM`;
  if (v >= 1e6) return `${nf0.format(Math.round(v / 1e6))} M`;
  if (v >= 1e3) return `${nf0.format(Math.round(v / 1e3))} mil`;
  return '0';
}

export function formatPlural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function formatMonthsText(m: number | null | undefined): string | null {
  if (m === null || m === undefined) return null;
  if (m === 0) return 'ya está';
  const y = Math.floor(m / 12);
  const r = m % 12;
  const parts: string[] = [];
  if (y) parts.push(formatPlural(y, 'año', 'años'));
  if (r) parts.push(formatPlural(r, 'mes', 'meses'));
  return parts.join(' y ');
}

export function formatEtaDate(m: number, baseDate: Date = new Date()): string {
  const d = new Date(baseDate.getTime());
  d.setMonth(d.getMonth() + m);
  return d
    .toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
    .replace('.', '');
}

export function formatEtaText(
  m: number | null,
  fallback?: string,
  baseDate: Date = new Date()
): string {
  if (m === null) return fallback || 'No se alcanza con este aporte';
  if (m === 0) return 'Ahora';
  return `≈ ${formatMonthsText(m)} (${formatEtaDate(m, baseDate)})`;
}

export function formatPct(n: number): string {
  return `${Math.round(n)}%`;
}
