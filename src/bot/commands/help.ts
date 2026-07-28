import { AgykeContext } from '../../types/context';

export async function helpCommandHandler(ctx: AgykeContext): Promise<void> {
  try {
    const message =
      `💡 *Guía de uso de Agyke Bot*\n\n` +
      `Con este bot podés registrar y controlar los gastos compartidos fácilmente.\n\n` +
      `📌 *1. Formas de registrar un gasto:*\n` +
      `• *Paso a paso:* Escribí \`/gasto\` y el bot te pedirá el monto, concepto y clasificación.\n` +
      `• *Carga directa:* \`/gasto <monto> <concepto> <clasificación>\` (ej: \`/gasto 15000 Coto 50\`)\n` +
      `• *Mensajes de voz:* Envía un audio diciendo tu gasto (ej: *"Gasté 8500 en la farmacia"*).\n` +
      `• *Fotos o comprobantes:* Envía una foto o documento de un ticket y la IA extraerá los datos.\n` +
      `• *Texto libre:* Escribí un mensaje directo (ej: *"Compré comida por 12000"*).\n\n` +
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

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('[HelpCommand] Error al responder /help:', error);
    await ctx.reply('⚠️ Ocurrió un error al procesar el comando /help.');
  }
}
