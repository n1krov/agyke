import { AgykeContext } from '../../types/context';

export async function helpCommandHandler(ctx: AgykeContext): Promise<void> {
  try {
    const message =
      `💡 *Guía de uso de Agyke Bot*\n\n` +
      `Con este bot podés registrar y controlar los gastos compartidos fácilmente.\n\n` +
      `📌 *1. Formas de registrar un gasto:*\n` +
      `• *Escribiendo gasto:* \`gasto\` o \`/gasto\` (inicia el paso a paso).\n` +
      `• *Con monto:* \`gasto 1000 pollo\` o \`3344 carne\` (pide la clasificación con botones).\n` +
      `• *Carga directa completa:* \`gasto 1000 pollo 50\` o \`3344 carne 50\`\n` +
      `• *Mensajes de voz:* Envía un audio diciendo tu gasto.\n` +
      `• *Fotos o comprobantes:* Envía una foto o documento de un ticket y la IA extraerá los datos.\n\n` +
      `🏷️ *2. Clasificaciones disponibles:*\n` +
      `• *50:* Dividido mitad y mitad (50% cada uno).\n` +
      `• *100:* Pagaste todo vos por el otro (Favor 100%).\n` +
      `• *-100:* El otro pagó todo por vos (Deuda Mía 100%).\n` +
      `• *0:* Gasto personal (no afecta las deudas).\n\n` +
      `⚙️ *3. Comandos disponibles:*\n` +
      `• \`/saldo\` o \`/balance\`: Consulta el saldo consolidado neto entre ambos usuarios.\n` +
      `• \`/cancelar\` o \`/cancel\`: Cancela la operación de registro en curso.\n` +
      `• \`/help\` o \`/ayuda\`: Muestra este menú de ayuda.\n\n` +
      `🌐 *4. Dashboard Web:*\n` +
      `Podés ver el resumen de gastos en agyke.vercel.app`;

    const chatId = ctx.chatId || ctx.from?.id;
    console.log(`[HelpCommand] 💡 Enviando guía de ayuda a chat: ${chatId}`);

    if (chatId) {
      try {
        await ctx.reply(message, { parse_mode: 'Markdown' });
      } catch (markdownErr) {
        console.warn('[HelpCommand] Falló reply Markdown, reintentando texto plano:', markdownErr);
        try {
          await ctx.reply(message.replace(/[*_`]/g, ''));
        } catch (plainErr) {
          console.warn('[HelpCommand] Falló ctx.reply, usando ctx.api.sendMessage:', plainErr);
          await ctx.api.sendMessage(chatId, message.replace(/[*_`]/g, '')).catch((sendErr) => {
            console.error('[HelpCommand] Falló sendMessage directo:', sendErr);
          });
        }
      }
    }
  } catch (error) {
    console.error('[HelpCommand] Error al responder /help:', error);
    const chatId = ctx.chatId || ctx.from?.id;
    if (chatId) {
      await ctx.api.sendMessage(chatId, '⚠️ Ocurrió un error al procesar el comando /help.').catch(() => {});
    }
  }
}
