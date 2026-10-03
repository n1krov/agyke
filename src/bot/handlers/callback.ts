import { AgykeContext } from '../../types/context';
import { supabase } from '../../lib/supabase';
import { calculateDebtImpact, updateBalance } from '../../services/balance';
import { ClassificationType } from '../../types/database';
import { getSession, clearSession } from '../../services/session';
import { gastoCommandHandler } from '../commands/gasto';
import { saldoCommandHandler } from '../commands/saldo';
import { helpCommandHandler } from '../commands/help';

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

    // Caso A: Botón proveniente de menú rápido de comandos (action:gasto, action:saldo, action:help)
    if (data.startsWith('action:')) {
      const action = data.split(':')[1];
      console.log(`[CallbackHandler] 🔘 Botón de menú rápido recibido: "${data}" de ${ctx.from?.first_name || ctx.from?.id}`);

      try {
        await ctx.answerCallbackQuery();
        console.log(`[CallbackHandler] ✅ answerCallbackQuery respondido para ${action}`);
      } catch (cbErr) {
        console.warn(`[CallbackHandler] ⚠️ No se pudo responder answerCallbackQuery:`, cbErr);
      }

      if (action === 'gasto') {
        console.log('[CallbackHandler] 💰 Ejecutando gastoCommandHandler desde botón');
        await gastoCommandHandler(ctx, '');
      } else if (action === 'saldo') {
        console.log('[CallbackHandler] 📊 Ejecutando saldoCommandHandler desde botón');
        await saldoCommandHandler(ctx);
      } else if (action === 'help') {
        console.log('[CallbackHandler] 💡 Ejecutando helpCommandHandler desde botón');
        await helpCommandHandler(ctx);
      }
      return;
    }

    // Caso B: Botón proveniente de sesión interactiva (session:<telegramId>:<classification>)
    if (data.startsWith('session:')) {
      const parts = data.split(':');
      if (parts.length !== 3) {
        await ctx.answerCallbackQuery('⚠️ Formato de botón inválido.');
        return;
      }

      const [, telegramIdStr, classification] = parts as [string, string, string];
      const telegramId = parseInt(telegramIdStr, 10);

      await ctx.answerCallbackQuery();

      if (classification === 'discard' || classification === 'cancel') {
        clearSession(telegramId);
        await ctx.editMessageText('❌ *Operación cancelada.*\nNo se registró ningún gasto.', { parse_mode: 'Markdown' });
        return;
      }

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
      const classType = classification as ClassificationType;
      const debtImpact = calculateDebtImpact(draft.amount, classType);

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: draft.amount,
          concept: concept,
          classification: classType,
          debt_impact: debtImpact
        });

      if (txError) {
        console.error('[CallbackHandler] Error al insertar transacción de sesión:', txError);
        await ctx.reply('⚠️ Ocurrió un error al registrar la transacción.');
        return;
      }

      clearSession(telegramId);
      await updateBalance();

      const label = CLASSIFICATION_LABELS[classType] || classification;
      const formattedAmount = draft.amount.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });

      await ctx.editMessageText(
        `✅ Clasificado como *${label}*.\n` +
        `*Monto:* $${formattedAmount} (${concept})\n` +
        `Balance actualizado.\n\n` +
        `📊 Podés ver el resumen de gastos en agyke.vercel.app`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Caso C: Botón proveniente de agyke_queue (agyke:<queueId>:<classification>)
    if (data.startsWith('agyke:')) {
      const parts = data.split(':');
      if (parts.length !== 3) {
        await ctx.answerCallbackQuery('⚠️ Formato de botón inválido.');
        return;
      }

      const [, agykeId, classification] = parts as [string, string, string];
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

      // Si el usuario presionó [ ❌ Descartar Gasto ] (MULTI-18)
      if (classification === 'discard' || classification === 'cancel') {
        await supabase
          .from('agyke_queue')
          .update({ status: 'DISCARDED' })
          .eq('id', agykeId);

        await ctx.editMessageText(
          '❌ *Gasto descartado.*\nNo se registró ningún movimiento en tu balance.',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      const debtImpact = calculateDebtImpact(Number(queueItem.amount), classification as ClassificationType);

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

      const classType = classification as ClassificationType;
      const label = CLASSIFICATION_LABELS[classType] || classification;
      const formattedAmount = Number(queueItem.amount).toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });

      await ctx.editMessageText(
        `✅ Clasificado como *${label}*.\n` +
        `*Monto:* $${formattedAmount} (${queueItem.concept || 'Gasto general'}).\n` +
        `Balance actualizado.\n\n` +
        `📊 Podés ver el resumen de gastos en agyke.vercel.app`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (err) {
    console.error('[CallbackHandler] Excepción inesperada:', err);
    await ctx.reply('⚠️ Ocurrió un error al procesar el botón de clasificación.');
  }
}
