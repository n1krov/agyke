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
