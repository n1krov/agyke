export type PlanBase = 'sueldo' | 'gastos';

export type HitoId = 'colchon' | 'fondo' | 'libertad';

export type HitoState = 'done' | 'active' | 'locked';

export type SavingsDestination = 'fondo' | 'inversion';

export interface FinancialPlanInputs {
  sueldo: number;
  gustosPct: number;
  invPct: number;
  sobrantePct: number;
  base: PlanBase;
  mesesColchon: number;
  mesesFondo: number;
  mesesMeta: number;
  rend: number;
  anios: number;
  fondoActual: number;
  investActual: number;
}

export interface FinancialPlanReparto {
  fijos: number;
  gustos: number;
  inversion: number;
  fijosPct: number;
  gustosPct: number;
  invPct: number;
  sobrante: number;
  aporte: number;
}

export interface FinancialPlanObjetivos {
  colchon: number;
  fondo: number;
  meta: number;
  base: number;
}

export interface FinancialPlanHito {
  id: HitoId;
  state: HitoState;
  current: number;
  target: number;
  etaMonths: number | null;
}

export interface FinancialPlanProyeccion {
  anios: number;
  final: number;
  yearly: number[];
  metaEnHorizonte: boolean;
  mesesParaMeta: number | null;
  mesesParaFondo: number | null;
  aporteNecesario: number | null;
}

export interface FinancialPlanResult {
  inputs: FinancialPlanInputs;
  reparto: FinancialPlanReparto;
  destino: SavingsDestination;
  objetivos: FinancialPlanObjetivos;
  hitos: FinancialPlanHito[];
  proyeccion: FinancialPlanProyeccion;
}

export interface PlanValidationResult {
  valid: boolean;
  value?: FinancialPlanInputs;
  error?: string;
}

export interface PlanApiGetResponse {
  config: FinancialPlanInputs;
  updated_at: string | null;
  source: 'supabase' | 'default';
  migration_pending?: boolean;
}

export interface PlanApiPutResponse {
  config: FinancialPlanInputs;
  updated_at: string;
  persisted: boolean;
  migration_pending?: boolean;
}
