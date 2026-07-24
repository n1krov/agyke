import { AgykeContext } from '../../types/context';
import { supabase } from '../../lib/supabase';
import { calculateDebtImpact, updateBalance } from '../../services/balance';
import { ClassificationType } from '../../types/database';

const CLASSIFICATION_LABELS: Record<ClassificationType, string> = {
  '50': '50/50 (Mitad y Mitad)',
  '100': 'Favor 100%',
  '-100': 'Deuda Propia',
  '0': 'Personal'
};

export async function callbackQueryHandler(ctx: AgykeContext): Promise<void> {
  try {
    const data = ctx.callbackQuery?.data;
    if (!data || !data.startsWith('agyke:')) {
      return;
    }

    const parts = data.split(':');
    if (parts.length !== 3) {
      await ctx.answerCallbackQuery('⚠️ Formato de botón inválido.');
      return;
    }

    const [, agykeId, classification] = parts as [string, string, ClassificationType];

    // Responder al callback en Telegram para detener el spinner del botón
    await ctx.answerCallbackQuery();

    // 1. Consultar el item en agyke_queue
    const { data: queueItem, error: queueError } = await supabase
      .from('agyke_queue')
      .select('*')
      .eq('id', agykeId)
      .maybeSingle();

    if (queueError || !queueItem) {
      console.error('[CallbackHandler] Error obteniendo item de agyke_queue:', queueError);
      await ctx.reply('⚠️ No se encontró el gasto correspondiente en el Muro Agyke.');
      return;
    }

    if (queueItem.status !== 'PENDING') {
      await ctx.editMessageText('ℹ️ Este gasto ya fue procesado o descartado anteriormente.');
      return;
    }

    // 2. Calcular impacto e insertar en transactions
    const debtImpact = calculateDebtImpact(Number(queueItem.amount), classification);

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: queueItem.user_id,
        amount: Number(queueItem.amount),
        concept: queueItem.concept,
        classification: classification,
        debt_impact: debtImpact
      });

    if (txError) {
      console.error('[CallbackHandler] Error al insertar transacción:', txError);
      await ctx.reply('⚠️ Ocurrió un error al registrar la transacción.');
      return;
    }

    // 3. Actualizar estado en agyke_queue
    const { error: updateQueueError } = await supabase
      .from('agyke_queue')
      .update({ status: 'PROCESSED' })
      .eq('id', agykeId);

    if (updateQueueError) {
      console.error('[CallbackHandler] Error al actualizar estado de agyke_queue:', updateQueueError);
    }

    // 4. Recalcular el balance neto
    await updateBalance();

    // 5. Editar el mensaje original de Telegram
    const label = CLASSIFICATION_LABELS[classification] || classification;
    const formattedAmount = Number(queueItem.amount).toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

    await ctx.editMessageText(
      `✅ Clasificado como *${label}*.\n` +
      `Monto: $${formattedAmount} (${queueItem.concept || 'Gasto general'}).\n` +
      `Balance actualizado.`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('[CallbackHandler] Excepción inesperada:', err);
    await ctx.reply('⚠️ Ocurrió un error al procesar el botón de clasificación.');
  }
}
