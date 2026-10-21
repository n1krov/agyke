export type ClassificationType = '50' | '100' | '-100' | '0';
export type SourceType = 'audio' | 'image' | 'text';
export type QueueStatus = 'PENDING' | 'PROCESSED' | 'DISCARDED';

export interface User {
  id: string;
  telegram_id: number;
  name: string;
  created_at: string;
}

export interface AgykeItem {
  id: string;
  user_id: string;
  amount: number;
  concept: string | null;
  file_path?: string | null;
  source_type: SourceType;
  status: QueueStatus;
  telegram_message_id?: number;
  created_at: string;
  users?: User;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  concept: string | null;
  classification: ClassificationType;
  debt_impact: number;
  created_at: string;
  users?: User;
}

export interface Balance {
  id: string;
  user_a_id: string;
  user_b_id: string;
  net_balance: number;
  updated_at: string;
  user_a?: User;
  user_b?: User;
}

export interface AnalyticsKPIs {
  totalGastoMes: number;
  totalGastoMesAnterior: number;
  variacionPorcentual: number | null;
  transaccionesCount: number;
  deudaGeneradaMes: number;
  aporteUserA: { id: string; name: string; total: number; percentage: number };
  aporteUserB: { id: string; name: string; total: number; percentage: number };
}

export interface AnalyticsDailyTimeline {
  day: number;
  date: string;
  monto: number;
  acumulado: number;
  count: number;
}

export interface AnalyticsClassificationItem {
  key: ClassificationType;
  name: string;
  value: number;
  count: number;
  percentage: number;
  color: string;
}

export interface AnalyticsDayOfWeekItem {
  dayName: string;
  total: number;
  count: number;
}

export interface AnalyticsTopExpense {
  id: string;
  concept: string;
  amount: number;
  userName: string;
  date: string;
  classification: ClassificationType;
}

export interface AnalyticsMonthPayload {
  selectedMonth: string;
  monthLabel: string;
  availableMonths: string[];
  kpis: AnalyticsKPIs;
  dailyTimeline: AnalyticsDailyTimeline[];
  classificationBreakdown: AnalyticsClassificationItem[];
  dayOfWeekIntensity: AnalyticsDayOfWeekItem[];
  topExpenses: AnalyticsTopExpense[];
}

