import { AgykeContext } from '../../types/context';
import { supabase } from '../../lib/supabase';
import { calculateDebtImpact, updateBalance } from '../../services/balance';
import { ClassificationType } from '../../types/database';

const VALID_CLASSIFICATIONS: ClassificationType[] = ['50', '100', '-100', '0'];

export async function gastoCommandHandler(ctx: AgykeContext): Promise<void> {
  try {
    const rawText = typeof ctx.match === 'string' ? ctx.match.trim() : '';

    if (!rawText) {
      await ctx.reply(
        '⚠️ Sintaxis incorrecta. Uso del comando:\n' +
        '`/gasto <monto> <concepto> <clasificacion>`\n\n' +
        'Ejemplo: `/gasto 15000 Coto 50`\n' +
        'Clasificaciones válidas: `50`, `100`, `-100`, `0`',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const tokens = rawText.split(/\s+/);
    if (tokens.length < 2) {
      await ctx.reply(
        '⚠️ Debes incluir al menos el monto y la clasificación.\n' +
        'Ejemplo: `/gasto 15000 Coto 50`'
      );
      return;
    }

    // 1. Extraer Monto
    const rawAmount = tokens[0].replace('$', '').replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(rawAmount);

    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('⚠️ El monto debe ser un número positivo válido. Ejemplo: `/gasto 15000 Coto 50`');
      return;
    }

    // 2. Extraer Clasificación (último token)
    const classificationCandidate = tokens[tokens.length - 1];

    if (!VALID_CLASSIFICATIONS.includes(classificationCandidate as ClassificationType)) {
      await ctx.reply(
        `⚠️ Clasificación inválida: "${classificationCandidate}".\n` +
        `Las clasificaciones permitidas son:\n` +
        `• *50*: Compartido 50/50\n` +
        `• *100*: Favor 100%\n` +
        `• *-100*: Deuda Propia\n` +
        `• *0*: Personal`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const classification = classificationCandidate as ClassificationType;

    // 3. Extraer Concepto
    const conceptTokens = tokens.slice(1, -1);
    const concept = conceptTokens.length > 0 ? conceptTokens.join(' ') : 'Gasto general';

    // 4. Obtener usuario desde context (inyectado por authMiddleware)
    const user = ctx.dbUser;
    if (!user) {
      await ctx.reply('⚠️ Usuario no autenticado en el sistema.');
      return;
    }

    // 5. Calcular debt_impact e insertar en transactions
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
      console.error('[GastoCommand] Error al insertar transacción en Supabase:', txError);
      await ctx.reply('⚠️ Ocurrió un error al registrar el gasto en la base de datos.');
      return;
    }

    // 6. Recalcular balance
    await updateBalance();

    const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    await ctx.reply(`✅ Gasto registrado: $${formattedAmount} (${concept}). Balance actualizado.`);
  } catch (err) {
    console.error('[GastoCommand] Excepción al procesar /gasto:', err);
    await ctx.reply('⚠️ Ocurrió un error inesperado al procesar el gasto.');
  }
}
