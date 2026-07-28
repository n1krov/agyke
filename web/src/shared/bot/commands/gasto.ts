import { InlineKeyboard } from 'grammy';
import { AgykeContext } from '../../types/context';
import { supabase } from '../../lib/supabase';
import { calculateDebtImpact, updateBalance } from '../../services/balance';
import { ClassificationType } from '../../types/database';
import { setSession } from '../../services/session';

export const VALID_CLASSIFICATIONS: ClassificationType[] = ['50', '100', '-100', '0'];

export function getClassificationKeyboard(prefix: string) {
  return new InlineKeyboard()
    .text('50 (Mitad y Mitad)', `${prefix}:50`)
    .text('100 (Favor 100%)', `${prefix}:100`)
    .row()
    .text('-100 (Deuda Mía)', `${prefix}:-100`)
    .text('0 (Personal)', `${prefix}:0`);
}

export async function gastoCommandHandler(ctx: AgykeContext, overrideText?: string): Promise<void> {
  try {
    const user = ctx.dbUser;
    if (!user || !ctx.from) {
      await ctx.reply('⚠️ Usuario no autenticado en el sistema.');
      return;
    }

    const rawText = overrideText !== undefined
      ? overrideText.trim()
      : (typeof ctx.match === 'string' ? ctx.match.trim() : '');

    // Caso 1: /gasto o gasto sin parámetros -> Iniciar Wizard pidiendo Monto
    if (!rawText) {
      setSession(ctx.from.id, {
        userId: user.id,
        step: 'AWAITING_AMOUNT'
      });

      await ctx.reply(
        '💰 *Nuevo Registro de Gasto*\n\n' +
        'Por favor, ingresa el *monto* del gasto (ejemplo: `15000` o `$15.000`):\n' +
        '_(Escribe /cancelar para salir)_',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const tokens = rawText.split(/\s+/);

    // Intentar extraer el monto del primer token
    const rawAmount = tokens[0].replace('$', '').replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(rawAmount);

    if (isNaN(amount) || amount <= 0) {
      await ctx.reply(
        '⚠️ El monto no es válido.\n' +
        'Por favor ingresa un número positivo (ej: `gasto 15000 Coto 50` o `15000 Coto 50`).',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Caso 2: Solo se pasó el monto (ej: gasto 15000 o 15000)
    if (tokens.length === 1) {
      setSession(ctx.from.id, {
        userId: user.id,
        step: 'AWAITING_CONCEPT',
        amount: amount
      });

      const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      await ctx.reply(
        `💵 Monto capturado: *$${formattedAmount}*\n\n` +
        `📝 Ahora ingresa el *concepto* o descripción del gasto (ej: \`Coto\`, \`Verdulería\`):`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Caso 3: Verificar si el último token es una clasificación válida (ej: gasto 15000 Coto 50 o 15000 Coto 50)
    const lastToken = tokens[tokens.length - 1];
    const isDirectClassification = VALID_CLASSIFICATIONS.includes(lastToken as ClassificationType);

    if (isDirectClassification) {
      const classification = lastToken as ClassificationType;
      const conceptTokens = tokens.slice(1, -1);
      const concept = conceptTokens.length > 0 ? conceptTokens.join(' ') : 'Gasto general';

      const debtImpact = calculateDebtImpact(amount, classification);

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          concept: concept,
          classification: classification,
          debt_impact: debtImpact
        });

      if (txError) {
        console.error('[GastoCommand] Error al insertar transacción:', txError);
        await ctx.reply('⚠️ Ocurrió un error al registrar el gasto en la base de datos.');
        return;
      }

      await updateBalance();

      const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      await ctx.reply(
        `✅ Gasto registrado: *$${formattedAmount}* (${concept}). Balance actualizado.\n\n` +
        `📊 Podés ver el resumen de gastos en agyke.vercel.app`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Caso 4: Se pasó monto y concepto pero no clasificación (ej: gasto 15000 Coto o 15000 Coto)
    const concept = tokens.slice(1).join(' ');
    setSession(ctx.from.id, {
      userId: user.id,
      step: 'AWAITING_CLASSIFICATION',
      amount: amount,
      concept: concept
    });

    const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const keyboard = getClassificationKeyboard(`session:${ctx.from.id}`);

    await ctx.reply(
      `📝 *Gasto en Proceso*\n` +
      `*Monto:* $${formattedAmount}\n` +
      `*Concepto:* ${concept}\n\n` +
      `Selecciona la clasificación:`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );

  } catch (err) {
    console.error('[GastoCommand] Excepción al procesar gasto:', err);
    await ctx.reply('⚠️ Ocurrió un error inesperado al procesar el gasto.');
  }
}
