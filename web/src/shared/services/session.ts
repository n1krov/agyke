import { ClassificationType } from '../types/database';

export interface GastoDraft {
  userId: string;
  step: 'AWAITING_AMOUNT' | 'AWAITING_CONCEPT' | 'AWAITING_CLASSIFICATION';
  amount?: number;
  concept?: string;
}

const userSessions = new Map<number, GastoDraft>();

export function getSession(telegramId: number): GastoDraft | undefined {
  return userSessions.get(telegramId);
}

export function setSession(telegramId: number, draft: GastoDraft): void {
  userSessions.set(telegramId, draft);
}

export function clearSession(telegramId: number): void {
  userSessions.delete(telegramId);
}
