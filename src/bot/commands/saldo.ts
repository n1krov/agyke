import { AgykeContext } from '../../types/context';
import { supabase } from '../../lib/supabase';
import { updateBalance } from '../../services/balance';

function cleanName(name: string): string {
  return name.replace(/[*_`\[\]]/g, '');
}

export async function saldoCommandHandler(ctx: AgykeContext): Promise<void> {
  try {
    const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    let { data: balance } = await supabase.from('balances').select('*').maybeSingle();

    let net = balance ? Number(balance.net_balance) : null;
    if (net === null) {
      try {
        net = await updateBalance();
      } catch (calcErr) {
        console.warn('[SaldoCommand] No se pudo ejecutar updateBalance, usando 0:', calcErr);
        net = 0;
      }
    }

    if (!users || users.length < 2) {
      await ctx.reply(
        `📊 *Estado de Saldos en Agyke*\n\n` +
        `⚖️ *Cuentas Saldadas ($0)*\n\n` +
        `ℹ️ _Falta que el segundo usuario envíe /start al bot para vincular las cuentas._\n\n` +
        `🌐 Podés ver el desglose en agyke.vercel.app`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const formattedAbs = Math.abs(net).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const userA = cleanName(users[0]?.name || 'Usuario A');
    const userB = cleanName(users[1]?.name || 'Usuario B');

    let estado = '⚖️ *Cuentas Saldadas ($0)*';
    if (net > 0) {
      estado = `🔴 *${userB}* le debe a *${userA}*: *$${formattedAbs}*`;
    } else if (net < 0) {
      estado = `🔴 *${userA}* le debe a *${userB}*: *$${formattedAbs}*`;
    }

    const message = (
      `📊 *Estado de Saldos en Agyke*\n\n${estado}\n\n` +
      `🌐 Podés ver el desglose en agyke.vercel.app`
    );

    const chatId = ctx.chatId || ctx.from?.id;
    console.log(`[SaldoCommand] 📊 Enviando balance a chat ${chatId}: ${estado.replace(/[*_`]/g, '')}`);

    if (chatId) {
      try {
        await ctx.reply(message, { parse_mode: 'Markdown' });
      } catch (markdownErr) {
        console.warn('[SaldoCommand] Falló reply Markdown, reintentando texto plano:', markdownErr);
        try {
          await ctx.reply(message.replace(/[*_`]/g, ''));
        } catch (plainErr) {
          console.warn('[SaldoCommand] Falló ctx.reply, usando ctx.api.sendMessage:', plainErr);
          await ctx.api.sendMessage(chatId, message.replace(/[*_`]/g, '')).catch((sendErr) => {
            console.error('[SaldoCommand] Falló sendMessage directo:', sendErr);
          });
        }
      }
    }
  } catch (err) {
    console.error('[SaldoCommand] Error:', err);
    const chatId = ctx.chatId || ctx.from?.id;
    if (chatId) {
      await ctx.api.sendMessage(chatId, '⚠️ Ocurrió un error al obtener el saldo.').catch(() => {});
    }
  }
}
