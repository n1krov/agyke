import { AgykeContext } from '../../types/context';
import { supabase } from '../../lib/supabase';
import { calculateDebtImpact, updateBalance } from '../../services/balance';
import { ClassificationType } from '../../types/database';
import { getSession, clearSession } from '../../services/session';

const CLASSIFICATION_LABELS: Record<ClassificationType, string> = {
  '50': '50/50 (Mitad y Mitad)',
  '100': 'Favor 100%',
  '-100': 'Deuda Propia',
  '0': 'Personal'
};

export async function callbackQueryHandler(ctx: AgykeContext): Promise<void> {
  try {
    const data = ctx.callbackQuery?.data;
    if (!data) return;

    // Caso A: Botón proveniente de sesión interactiva (session:<telegramId>:<classification>)
    if (data.startsWith('session:')) {
      const parts = data.split(':');
      if (parts.length !== 3) {
        await ctx.answerCallbackQuery('⚠️ Formato de botón inválido.');
        return;
      }

      const [, telegramIdStr, classification] = parts as [string, string, ClassificationType];
      const telegramId = parseInt(telegramIdStr, 10);

      await ctx.answerCallbackQuery();

      const draft = getSession(telegramId);
      if (!draft || !draft.amount) {
        await ctx.editMessageText('⚠️ La sesión expiró o ya fue procesada.');
        return;
      }

      const user = ctx.dbUser;
      if (!user) {
        await ctx.reply('⚠️ Usuario no autenticado.');
        return;
      }

      const concept = draft.concept || 'Gasto general';
      const debtImpact = calculateDebtImpact(draft.amount, classification);

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: draft.amount,
          concept: concept,
          classification: classification,
          debt_impact: debtImpact
        });

      if (txError) {
        console.error('[CallbackHandler] Error al insertar transacción de sesión:', txError);
        await ctx.reply('⚠️ Ocurrió un error al registrar la transacción.');
        return;
      }

      clearSession(telegramId);
      await updateBalance();

      const label = CLASSIFICATION_LABELS[classification] || classification;
      const formattedAmount = draft.amount.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });

      await ctx.editMessageText(
        `✅ Clasificado como *${label}*.\n` +
        `*Monto:* $${formattedAmount} (${concept})\n` +
        `Balance actualizado.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Caso B: Botón proveniente de agyke_queue (agyke:<queueId>:<classification>)
    if (data.startsWith('agyke:')) {
      const parts = data.split(':');
      if (parts.length !== 3) {
        await ctx.answerCallbackQuery('⚠️ Formato de botón inválido.');
        return;
      }

      const [, agykeId, classification] = parts as [string, string, ClassificationType];
      await ctx.answerCallbackQuery();

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

      await supabase
        .from('agyke_queue')
        .update({ status: 'PROCESSED' })
        .eq('id', agykeId);

      await updateBalance();

      const label = CLASSIFICATION_LABELS[classification] || classification;
      const formattedAmount = Number(queueItem.amount).toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });

      await ctx.editMessageText(
        `✅ Clasificado como *${label}*.\n` +
        `*Monto:* $${formattedAmount} (${queueItem.concept || 'Gasto general'}).\n` +
        `Balance actualizado.`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (err) {
    console.error('[CallbackHandler] Excepción inesperada:', err);
    await ctx.reply('⚠️ Ocurrió un error al procesar el botón de clasificación.');
  }
}
