import { AgykeContext } from '../../types/context';
import { supabase } from '../../lib/supabase';

export async function saldoCommandHandler(ctx: AgykeContext): Promise<void> {
  try {
    const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    const { data: balance } = await supabase.from('balances').select('*').maybeSingle();

    const net = balance ? Number(balance.net_balance) : 0;
    const formattedAbs = Math.abs(net).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const userA = users && users[0] ? users[0].name : 'Usuario A';
    const userB = users && users[1] ? users[1].name : 'Usuario B';

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
