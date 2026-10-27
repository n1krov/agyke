export type ClassificationType = '50' | '100' | '-100' | '0';
export type SourceType = 'audio' | 'image' | 'text';
export type QueueStatus = 'PENDING' | 'PROCESSED' | 'DISCARDED';
export type TagColorToken =
  | 'slate'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'violet';

export interface User {
  id: string;
  telegram_id: number;
  name: string;
  alias?: string | null;
  created_at: string;
}

export interface UserLastActivity {
  transaction_id: string;
  amount: number;
  concept: string | null;
  classification: ClassificationType;
  created_at: string;
}

export interface UserProfileSummary extends User {
  display_name: string;
  transactions_count: number;
  last_activity: UserLastActivity | null;
}

export interface Tag {
  id: string;
  name: string;
  color: TagColorToken;
  created_at: string;
  usage_count?: number;
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
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  concept: string | null;
  classification: ClassificationType;
  debt_impact: number;
  created_at: string;
  tags?: Tag[];
}

export interface Balance {
  id: string;
  user_a_id: string;
  user_b_id: string;
  net_balance: number;
  updated_at: string;
}

export interface GeminiExtractionResult {
  amount: number;
  concept: string;
}
