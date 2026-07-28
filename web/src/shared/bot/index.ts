import { Bot } from 'grammy';
import dotenv from 'dotenv';
import { AgykeContext } from '../types/context';
import { authMiddleware } from './middlewares/auth';
import { gastoCommandHandler } from './commands/gasto';
import { assistedFlowHandler } from './handlers/assisted';
import { callbackQueryHandler } from './handlers/callback';
import { clearSession } from '../services/session';
import { supabase } from '../lib/supabase';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN || 'dummy_token_for_build';

export const bot = new Bot<AgykeContext>(token);

// Middleware de autenticación global
bot.use(authMiddleware);

// Comando /gasto
bot.command('gasto', gastoCommandHandler);

// Comando /cancelar y /cancel
bot.command(['cancelar', 'cancel'], async (ctx) => {
  if (ctx.from) {
    clearSession(ctx.from.id);
  }
  await ctx.reply('❌ Operación cancelada.');
});

// Comando /saldo o /balance
bot.command(['saldo', 'balance'], async (ctx) => {
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

    await ctx.reply(`📊 *Estado de Saldos en Agyke*\n\n${estado}`, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[SaldoCommand] Error:', err);
    await ctx.reply('⚠️ Ocurrió un error al obtener el saldo.');
  }
});

// Comando /start
bot.command('start', async (ctx) => {
  try {
    const name = ctx.dbUser?.name || ctx.from?.first_name || 'Usuario';
    await ctx.reply(
      `👋 ¡Hola ${name}! Bienvenido a *Agyke* - Sistema de Control de Gastos Compartidos.\n\n` +
      `Puedes registrar gastos de las siguientes formas:\n` +
      `• *Paso a paso conversacional:* Escribe \`/gasto\` y yo te iré pidiendo el monto y concepto.\n` +
      `• *Carga directa en una línea:* \`/gasto 15000 Coto 50\`\n` +
      `• *Carga asistida por IA:* Envía un audio, foto de comprobante o texto libre y Gemini lo procesará.\n\n` +
      `Comandos útiles:\n` +
      `• \`/saldo\`: Ver el balance neto consolidado.\n` +
      `• \`/cancelar\`: Cancelar cualquier registro en curso.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('[StartCommand] Error al responder /start:', error);
    await ctx.reply('⚠️ Ocurrió un error al procesar el comando /start.');
  }
});

// Listener de Botones Interactivos (Inline Keyboards)
bot.on('callback_query:data', callbackQueryHandler);

// Listener de Muro Agyke (Flujo asistido para audio, foto, documento o texto libre)
bot.on(['message:voice', 'message:audio', 'message:photo', 'message:document', 'message:text'], assistedFlowHandler);

// Función de inicio del bot para modo long-polling (desarrollo local)
export async function startBot() {
  console.log('🤖 Iniciando Bot de Agyke (Long Polling)...');
  bot.catch((err) => {
    console.error('❌ Error capturado en el Bot:', err);
  });
  await bot.start();
}

