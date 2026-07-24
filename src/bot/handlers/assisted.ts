import { InlineKeyboard } from 'grammy';
import { AgykeContext } from '../../types/context';
import { supabase } from '../../lib/supabase';
import { processMediaWithGemini, processTextWithGemini } from '../../services/gemini';
import { SourceType } from '../../types/database';

async function downloadTelegramFile(fileId: string): Promise<{ buffer: Buffer; filePath: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no está configurado.');

  // Usar getFile de Telegram API
  const resFile = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const jsonFile = (await resFile.json()) as { ok: boolean; result?: { file_path?: string } };

  if (!jsonFile.ok || !jsonFile.result?.file_path) {
    throw new Error('No se pudo obtener la ruta del archivo desde Telegram.');
  }

  const filePath = jsonFile.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

  const resDownload = await fetch(downloadUrl);
  const arrayBuffer = await resDownload.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    filePath
  };
}

export async function assistedFlowHandler(ctx: AgykeContext): Promise<void> {
  try {
    const user = ctx.dbUser;
    if (!user) {
      await ctx.reply('⚠️ Usuario no autenticado.');
      return;
    }

    let sourceType: SourceType = 'text';
    let fileBuffer: Buffer | null = null;
    let mimeType: string = 'text/plain';
    let rawFilePath: string | null = null;
    let textPrompt: string | null = null;

    // 1. Identificar tipo de entrada
    if (ctx.message?.voice || ctx.message?.audio) {
      sourceType = 'audio';
      const fileId = ctx.message.voice?.file_id || ctx.message.audio?.file_id;
      mimeType = ctx.message.voice?.mime_type || ctx.message.audio?.mime_type || 'audio/ogg';
      if (fileId) {
        const downloaded = await downloadTelegramFile(fileId);
        fileBuffer = downloaded.buffer;
        rawFilePath = downloaded.filePath;
      }
    } else if (ctx.message?.photo) {
      sourceType = 'image';
      // Las fotos vienen en varias resoluciones, tomar la última (mayor resolución)
      const photos = ctx.message.photo;
      const fileId = photos[photos.length - 1].file_id;
      mimeType = 'image/jpeg';
      const downloaded = await downloadTelegramFile(fileId);
      fileBuffer = downloaded.buffer;
      rawFilePath = downloaded.filePath;
    } else if (ctx.message?.document) {
      sourceType = 'image';
      const doc = ctx.message.document;
      mimeType = doc.mime_type || 'application/pdf';
      const downloaded = await downloadTelegramFile(doc.file_id);
      fileBuffer = downloaded.buffer;
      rawFilePath = downloaded.filePath;
    } else if (ctx.message?.text) {
      sourceType = 'text';
      textPrompt = ctx.message.text.trim();

      // Si empieza con '/', es un comando y no debe procesarse por el flujo asistido
      if (textPrompt.startsWith('/')) {
        return;
      }
    } else {
      return;
    }

    // Informar procesamiento
    const statusMsg = await ctx.reply('🔍 Procesando contenido con Gemini...');

    // 2. Extraer datos con Gemini
    let extraction;
    try {
      if (fileBuffer) {
        extraction = await processMediaWithGemini(fileBuffer, mimeType);
      } else if (textPrompt) {
        extraction = await processTextWithGemini(textPrompt);
      } else {
        await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
        await ctx.reply('⚠️ No se pudo obtener contenido para procesar.');
        return;
      }
    } catch (geminiErr) {
      console.error('[AssistedFlow] Error al llamar a Gemini:', geminiErr);
      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
      await ctx.reply('⚠️ Lo siento, ocurrió un error al analizar la información con Gemini.');
      return;
    }

    // Borrar mensaje temporal de procesamiento
    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

    if (!extraction || typeof extraction.amount !== 'number') {
      await ctx.reply('⚠️ No se pudo extraer un monto válido del contenido enviado.');
      return;
    }

    // 3. Insertar en agyke_queue
    const { data: queueItem, error: queueError } = await supabase
      .from('agyke_queue')
      .insert({
        user_id: user.id,
        amount: extraction.amount,
        concept: extraction.concept || 'Gasto general',
        file_path: rawFilePath,
        source_type: sourceType,
        status: 'PENDING'
      })
      .select()
      .single();

    if (queueError || !queueItem) {
      console.error('[AssistedFlow] Error al insertar en agyke_queue:', queueError);
      await ctx.reply('⚠️ Ocurrió un error al guardar el pendiente en el Muro Agyke.');
      return;
    }

    // 4. Crear Inline Keyboard con los 4 botones
    const keyboard = new InlineKeyboard()
      .text('50 (Mitad y Mitad)', `agyke:${queueItem.id}:50`)
      .text('100 (Favor 100%)', `agyke:${queueItem.id}:100`)
      .row()
      .text('-100 (Deuda Mía)', `agyke:${queueItem.id}:-100`)
      .text('0 (Personal)', `agyke:${queueItem.id}:0`);

    const formattedAmount = extraction.amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const sentMessage = await ctx.reply(
      `📝 *Nuevo gasto detectado en Agyke*\n` +
      `*Monto:* $${formattedAmount}\n` +
      `*Concepto:* ${extraction.concept || 'Gasto general'}\n\n` +
      `Selecciona la clasificación:`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );

    // Actualizar telegram_message_id
    await supabase
      .from('agyke_queue')
      .update({ telegram_message_id: sentMessage.message_id })
      .eq('id', queueItem.id);

  } catch (err) {
    console.error('[AssistedFlow] Excepción inesperada:', err);
    await ctx.reply('⚠️ Ocurrió un error inesperado al procesar tu solicitud.');
  }
}
