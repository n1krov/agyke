import { Bot } from 'grammy';
import dotenv from 'dotenv';
import { AgykeContext } from '../types/context';
import { authMiddleware } from './middlewares/auth';
import { gastoCommandHandler } from './commands/gasto';
import { helpCommandHandler } from './commands/help';
import { saldoCommandHandler } from './commands/saldo';
import { assistedFlowHandler } from './handlers/assisted';
import { callbackQueryHandler } from './handlers/callback';
import { clearSession } from '../services/session';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN || 'dummy_token_for_build';

export const bot = new Bot<AgykeContext>(token);

// Middleware de autenticación global
bot.use(authMiddleware);

// Comando /gasto
bot.command('gasto', gastoCommandHandler);

// Comando /help y /ayuda
bot.command(['help', 'ayuda'], helpCommandHandler);

// Comando /saldo o /balance
bot.command(['saldo', 'balance'], saldoCommandHandler);

// Comando /cancelar y /cancel
bot.command(['cancelar', 'cancel'], async (ctx) => {
  if (ctx.from) {
    clearSession(ctx.from.id);
  }
  await ctx.reply('❌ Operación cancelada.');
});

// Comando /start
bot.command('start', async (ctx) => {
  try {
    const name = ctx.dbUser?.name || ctx.from?.first_name || 'Usuario';
    await ctx.reply(
      `👋 ¡Hola ${name}! Bienvenido a *Agyke* - Sistema de Control de Gastos Compartidos.\n\n` +
      `Puedes registrar gastos de las siguientes formas:\n` +
      `• *Escribiendo gasto:* \`gasto\` o \`/gasto\`\n` +
      `• *Con monto:* \`gasto 1000 pollo\` o \`3344 carne\`\n` +
      `• *Carga directa en una línea:* \`gasto 15000 Coto 50\` o \`3344 carne 50\`\n` +
      `• *Carga asistida por IA:* Envía un audio o foto de comprobante y Gemini lo procesará.\n\n` +
      `Comandos útiles:\n` +
      `• \`/saldo\`: Ver el balance neto consolidado.\n` +
      `• \`/help\`: Ver la guía completa de lo que podés hacer.\n` +
      `• \`/cancelar\`: Cancelar cualquier registro en curso.\n\n` +
      `🌐 *Dashboard:* Podés ver el resumen de gastos en agyke.vercel.app`,
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

// Función de inicio del bot
export async function startBot() {
  console.log('🤖 Iniciando Bot de Agyke...');
  bot.catch((err) => {
    console.error('❌ Error capturado en el Bot:', err);
  });
  await bot.start();
}

if (process.env.NODE_ENV !== 'test') {
  startBot();
}
