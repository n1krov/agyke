import { AgykeContext } from '../../types/context';
import { supabase } from '../../lib/supabase';

function cleanName(name: string): string {
  return name.replace(/[*_`\[\]]/g, '');
}

export async function saldoCommandHandler(ctx: AgykeContext): Promise<void> {
  try {
    const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    const { data: balance } = await supabase.from('balances').select('*').maybeSingle();

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

    const net = balance ? Number(balance.net_balance) : 0;
    const formattedAbs = Math.abs(net).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const userA = cleanName(users[0]?.name || 'Usuario A');
    const userB = cleanName(users[1]?.name || 'Usuario B');

    let estado = '⚖️ *Cuentas Saldadas ($0)*';
    if (net > 0) {
      estado = `🔴 *${userB}* le debe a *${userA}*: *$${formattedAbs}*`;
    } else if (net < 0) {
      estado = `🔴 *${userA}* le debe a *${userB}*: *$${formattedAbs}*`;
    }

    await ctx.reply(
      `📊 *Estado de Saldos en Agyke*\n\n${estado}\n\n` +
      `🌐 Podés ver el desglose en agyke.vercel.app`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('[SaldoCommand] Error:', err);
    await ctx.reply('⚠️ Ocurrió un error al obtener el saldo.');
  }
}
