import { supabase } from '../lib/supabase';
import { ClassificationType } from '../types/database';

/**
 * Calcula el impacto en deuda según la clasificación elegida:
 * - 50: Compartido 50/50 -> + (Monto / 2) para el pagador
 * - 100: Favor 100% -> + Monto para el pagador
 * - -100: Deuda Propia -> - Monto para el pagador
 * - 0: Personal -> 0 impacto en balance
 */
export function calculateDebtImpact(amount: number, classification: ClassificationType): number {
  switch (classification) {
    case '50':
      return amount / 2;
    case '100':
      return amount;
    case '-100':
      return -amount;
    case '0':
      return 0;
    default:
      return 0;
  }
}

/**
 * Recalcula el saldo neto (net_balance) en la tabla balances
 * basándose en todas las transacciones procesadas.
 * 
 * Convención:
 * - user_a: El primer usuario creado (o de menor ID)
 * - user_b: El segundo usuario creado
 * - net_balance > 0: El Usuario B le debe dinero al Usuario A.
 * - net_balance < 0: El Usuario A le debe dinero al Usuario B.
 * - net_balance == 0: Cuentas saldadas.
 */
export async function updateBalance(): Promise<number> {
  // 1. Obtener todos los usuarios ordenados por fecha de creación
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });

  if (usersError || !users || users.length === 0) {
    console.error('[UpdateBalance] Error al obtener usuarios:', usersError);
    return 0;
  }

  // Si hay menos de 2 usuarios, se retorna 0 hasta que se registre el segundo
  if (users.length < 2) {
    return 0;
  }

  const userA = users[0];
  const userB = users[1];

  // 2. Obtener todas las transacciones
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('*');

  if (txError) {
    console.error('[UpdateBalance] Error al obtener transacciones:', txError);
    throw txError;
  }

  // 3. Recalcular saldo neto consolidado
  let netBalance = 0;

  if (transactions) {
    for (const tx of transactions) {
      const impact = Number(tx.debt_impact);
      if (tx.user_id === userA.id) {
        netBalance += impact;
      } else if (tx.user_id === userB.id) {
        netBalance -= impact;
      }
    }
  }

  // 4. Buscar si ya existe un registro de balance para este par
  const { data: existingBalance } = await supabase
    .from('balances')
    .select('id')
    .eq('user_a_id', userA.id)
    .eq('user_b_id', userB.id)
    .maybeSingle();

  if (existingBalance) {
    const { error: updateError } = await supabase
      .from('balances')
      .update({
        net_balance: netBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingBalance.id);

    if (updateError) {
      console.error('[UpdateBalance] Error actualizando balance:', updateError);
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase
      .from('balances')
      .insert({
        user_a_id: userA.id,
        user_b_id: userB.id,
        net_balance: netBalance,
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('[UpdateBalance] Error insertando balance:', insertError);
      throw insertError;
    }
  }

  return netBalance;
}
