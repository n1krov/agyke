import type {
  TagColorToken,
  Transaction,
  User,
  UserLastActivity,
  UserProfileSummary,
} from '../types/database';

export const VALID_TAG_COLORS: readonly TagColorToken[] = [
  'slate',
  'indigo',
  'emerald',
  'amber',
  'rose',
  'cyan',
  'violet',
] as const;

export function isValidTagColor(color: unknown): color is TagColorToken {
  return (
    typeof color === 'string' &&
    (VALID_TAG_COLORS as readonly string[]).includes(color)
  );
}

/**
 * Resuelve el nombre visible del usuario para la interfaz Web.
 * Si el usuario posee un alias no vacío, retorna el alias; en caso contrario, retorna su nombre original de Telegram.
 */
export function getUserDisplayName(
  user?: Pick<User, 'name' | 'alias'> | null,
  fallback = 'Usuario'
): string {
  if (!user) return fallback;
  const trimmedAlias = typeof user.alias === 'string' ? user.alias.trim() : '';
  if (trimmedAlias.length > 0) {
    return trimmedAlias;
  }
  const trimmedName = typeof user.name === 'string' ? user.name.trim() : '';
  return trimmedName.length > 0 ? trimmedName : fallback;
}

export interface ValidationResult<T> {
  valid: boolean;
  value?: T;
  error?: string;
}

/**
 * Valida y normaliza un alias de usuario (1 a 24 caracteres, o null si se envía vacío).
 */
export function validateAndSanitizeAlias(
  rawAlias: unknown
): ValidationResult<string | null> {
  if (rawAlias === null || rawAlias === undefined) {
    return { valid: true, value: null };
  }
  if (typeof rawAlias !== 'string') {
    return { valid: false, error: 'El alias debe ser una cadena de texto.' };
  }
  const trimmed = rawAlias.trim();
  if (trimmed.length === 0) {
    return { valid: true, value: null };
  }
  if (trimmed.length > 24) {
    return {
      valid: false,
      error: 'El alias no puede superar los 24 caracteres.',
    };
  }
  return { valid: true, value: trimmed };
}

export interface SanitizedTagInput {
  name: string;
  color: TagColorToken;
}

/**
 * Valida y normaliza la entrada para crear o editar una etiqueta.
 */
export function validateAndSanitizeTagInput(input: {
  name?: unknown;
  color?: unknown;
}): ValidationResult<SanitizedTagInput> {
  if (typeof input.name !== 'string') {
    return { valid: false, error: 'El nombre de la etiqueta es obligatorio.' };
  }
  const trimmedName = input.name.trim();
  if (trimmedName.length === 0) {
    return {
      valid: false,
      error: 'El nombre de la etiqueta no puede estar vacío.',
    };
  }
  if (trimmedName.length > 28) {
    return {
      valid: false,
      error: 'El nombre de la etiqueta no puede superar los 28 caracteres.',
    };
  }

  const rawColor = input.color === undefined ? 'slate' : input.color;
  if (!isValidTagColor(rawColor)) {
    return {
      valid: false,
      error: 'El color seleccionado no pertenece a la paleta permitida.',
    };
  }

  return {
    valid: true,
    value: {
      name: trimmedName,
      color: rawColor,
    },
  };
}

/**
 * Construye los resúmenes de perfil de usuarios vinculados incluyendo su conteo de gastos y última actividad.
 */
export function buildUserProfileSummaries(
  users: User[],
  transactions: Pick<
    Transaction,
    'id' | 'user_id' | 'amount' | 'concept' | 'classification' | 'created_at'
  >[]
): UserProfileSummary[] {
  return users.map((user) => {
    const userTxs = transactions.filter((tx) => tx.user_id === user.id);

    let latestTx: Pick<
      Transaction,
      'id' | 'user_id' | 'amount' | 'concept' | 'classification' | 'created_at'
    > | null = null;
    let latestTime = -Infinity;

    for (const tx of userTxs) {
      const ts = new Date(tx.created_at).getTime();
      if (!Number.isNaN(ts) && ts > latestTime) {
        latestTime = ts;
        latestTx = tx;
      }
    }

    const lastActivity: UserLastActivity | null = latestTx
      ? {
          transaction_id: latestTx.id,
          amount: Number(latestTx.amount),
          concept: latestTx.concept,
          classification: latestTx.classification,
          created_at: latestTx.created_at,
        }
      : null;

    return {
      ...user,
      alias: user.alias ?? null,
      display_name: getUserDisplayName(user),
      transactions_count: userTxs.length,
      last_activity: lastActivity,
    };
  });
}
