import { Bot } from 'grammy';
import dotenv from 'dotenv';
import { AgykeContext } from '../types/context';
import { authMiddleware } from './middlewares/auth';
import { gastoCommandHandler } from './commands/gasto';
import { assistedFlowHandler } from './handlers/assisted';
import { callbackQueryHandler } from './handlers/callback';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('Falta la variable de entorno TELEGRAM_BOT_TOKEN.');
}

export const bot = new Bot<AgykeContext>(token);

// Middleware de autenticación global
bot.use(authMiddleware);

// Comando /gasto
bot.command('gasto', gastoCommandHandler);

// Comando /start
bot.command('start', async (ctx) => {
  try {
    const name = ctx.dbUser?.name || ctx.from?.first_name || 'Usuario';
    await ctx.reply(
      `👋 ¡Hola ${name}! Bienvenido a *Agyke* - Sistema de Control de Gastos Compartidos.\n\n` +
      `Puedes registrar gastos directamente con el comando:\n` +
      `\` /gasto <monto> <concepto> <clasificacion>\`\n` +
      `Ejemplo: \`/gasto 15000 Coto 50\`\n\n` +
      `O puedes enviar una foto de comprobante, audio o texto libre y yo lo clasificaré por ti.`,
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

// Ejecutar si se invoca como script principal
if (require.main === module) {
  startBot();
}
