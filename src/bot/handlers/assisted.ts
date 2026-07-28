import { InlineKeyboard } from 'grammy';
import { AgykeContext } from '../../types/context';
import { supabase } from '../../lib/supabase';
import { processMediaWithGemini } from '../../services/gemini';
import { SourceType, ClassificationType } from '../../types/database';
import { getSession, setSession, clearSession } from '../../services/session';
import { gastoCommandHandler, getClassificationKeyboard, VALID_CLASSIFICATIONS } from '../commands/gasto';
import { calculateDebtImpact, updateBalance } from '../../services/balance';

async function downloadTelegramFile(fileId: string): Promise<{ buffer: Buffer; filePath: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no está configurado.');

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
    if (!user || !ctx.from) {
      await ctx.reply('⚠️ Usuario no autenticado.');
      return;
    }

    const telegramId = ctx.from.id;
    const activeSession = getSession(telegramId);
    const textMsg = ctx.message?.text?.trim();

    // 0. Manejo de cancelación si hay sesión activa
    if (activeSession && textMsg && (textMsg === '/cancelar' || textMsg === '/cancel')) {
      clearSession(telegramId);
      await ctx.reply('❌ Registro de gasto cancelado.');
      return;
    }

    // 1. Manejar respuestas a pasos activos del Wizard
    if (activeSession && textMsg) {
      if (activeSession.step === 'AWAITING_AMOUNT') {
        const tokens = textMsg.split(/\s+/);
        const rawAmount = tokens[0].replace('$', '').replace(/\./g, '').replace(',', '.');
        const amount = parseFloat(rawAmount);

        if (isNaN(amount) || amount <= 0) {
          await ctx.reply('⚠️ El monto debe ser un número válido positivo (ejemplo: `15000`). Intenta de nuevo:');
          return;
        }

        activeSession.amount = amount;

        // Si se enviaron tokens adicionales (ej: "15000 Coto" o "15000 Coto 50")
        if (tokens.length > 1) {
          const lastToken = tokens[tokens.length - 1];
          const isDirectClassification = VALID_CLASSIFICATIONS.includes(lastToken as ClassificationType);

          if (isDirectClassification) {
            const concept = tokens.slice(1, -1).join(' ') || 'Gasto general';
            const classification = lastToken as ClassificationType;
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
              console.error('[AssistedFlow] Error al insertar transacción en wizard:', txError);
              await ctx.reply('⚠️ Ocurrió un error al registrar el gasto.');
              return;
            }

            clearSession(telegramId);
            await updateBalance();

            const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            await ctx.reply(
              `✅ Gasto registrado: *$${formattedAmount}* (${concept}). Balance actualizado.\n\n` +
              `📊 Podés ver el resumen de gastos en agyke.vercel.app`,
              { parse_mode: 'Markdown' }
            );
            return;
          } else {
            activeSession.concept = tokens.slice(1).join(' ');
          }
        }

        if (!activeSession.concept || activeSession.concept === 'Gasto general') {
          activeSession.step = 'AWAITING_CONCEPT';
          setSession(telegramId, activeSession);

          const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
          await ctx.reply(
            `💵 Monto registrado: *$${formattedAmount}*\n\n` +
            `📝 Ahora ingresa el *concepto* del gasto (ej: \`Coto\`, \`Verdulería\`):`,
            { parse_mode: 'Markdown' }
          );
          return;
        } else {
          activeSession.step = 'AWAITING_CLASSIFICATION';
          setSession(telegramId, activeSession);

          const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
          const keyboard = getClassificationKeyboard(`session:${telegramId}`);

          await ctx.reply(
            `📝 *Confirmar Clasificación*\n` +
            `*Monto:* $${formattedAmount}\n` +
            `*Concepto:* ${activeSession.concept}\n\n` +
            `Selecciona la clasificación:`,
            {
              parse_mode: 'Markdown',
              reply_markup: keyboard
            }
          );
          return;
        }
      }

      if (activeSession.step === 'AWAITING_CONCEPT') {
        const tokens = textMsg.split(/\s+/);
        const lastToken = tokens[tokens.length - 1];
        const isDirectClassification = VALID_CLASSIFICATIONS.includes(lastToken as ClassificationType);

        if (isDirectClassification && tokens.length > 1) {
          const concept = tokens.slice(0, -1).join(' ');
          const classification = lastToken as ClassificationType;
          const amount = activeSession.amount || 0;
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
            console.error('[AssistedFlow] Error al insertar transacción en concept wizard:', txError);
            await ctx.reply('⚠️ Ocurrió un error al registrar el gasto.');
            return;
          }

          clearSession(telegramId);
          await updateBalance();

          const formattedAmount = amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
          await ctx.reply(
            `✅ Gasto registrado: *$${formattedAmount}* (${concept}). Balance actualizado.\n\n` +
            `📊 Podés ver el resumen de gastos en agyke.vercel.app`,
            { parse_mode: 'Markdown' }
          );
          return;
        }

        activeSession.concept = textMsg;
        activeSession.step = 'AWAITING_CLASSIFICATION';
        setSession(telegramId, activeSession);

        const formattedAmount = (activeSession.amount || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        const keyboard = getClassificationKeyboard(`session:${telegramId}`);

        await ctx.reply(
          `📝 *Confirmar Clasificación*\n` +
          `*Monto:* $${formattedAmount}\n` +
          `*Concepto:* ${textMsg}\n\n` +
          `Selecciona la clasificación:`,
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          }
        );
        return;
      }
    }

    let sourceType: SourceType = 'text';
    let fileBuffer: Buffer | null = null;
    let mimeType: string = 'text/plain';
    let rawFilePath: string | null = null;

    // 2. Identificar tipo de entrada recibida
    const isAudio = Boolean(ctx.message?.voice || ctx.message?.audio);
    const isPhoto = Boolean(ctx.message?.photo);
    const isDocument = Boolean(ctx.message?.document);
    const isText = Boolean(ctx.message?.text);

    if (isText && textMsg) {
      // Si el texto empieza con / (y no es /gasto), dejar que grammy lo maneje
      if (textMsg.startsWith('/') && !textMsg.toLowerCase().startsWith('/gasto')) {
        return;
      }

      // Verificar si el texto coincide con "gasto" o "/gasto" (con o sin parámetros)
      const gastoMatch = textMsg.match(/^(\/)?gasto(?:\s+(.*))?$/i);
      if (gastoMatch) {
        const args = gastoMatch[2] || '';
        await gastoCommandHandler(ctx, args);
        return;
      }

      // Si es un texto plano sin el comando "gasto", informar al usuario la sintaxis correcta
      await ctx.reply(
        `ℹ️ Para registrar un gasto por texto, escribe *gasto* seguido de los datos.\n\n` +
        `*Estructura del comando:*\n` +
        `\`gasto <monto> <concepto> <tipo>\`\n\n` +
        `*Ejemplos:*\n` +
        `• \`gasto\` (asistente paso a paso)\n` +
        `• \`gasto 1000\`\n` +
        `• \`gasto 1000 Coto\`\n` +
        `• \`gasto 1000 Coto 50\`\n\n` +
        `Escribe \`/help\` para ver todas las opciones disponibles.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (isAudio) {
      sourceType = 'audio';
      console.log(`[AssistedFlow] 🎙️ Audio recibido de ${user.name} (${telegramId})`);
    } else if (isPhoto) {
      sourceType = 'image';
      console.log(`[AssistedFlow] 📷 Foto recibida de ${user.name} (${telegramId})`);
    } else if (isDocument) {
      sourceType = 'image';
      console.log(`[AssistedFlow] 📄 Documento recibido de ${user.name} (${telegramId})`);
    } else {
      return;
    }

    // Responder inmediatamente en Telegram para confirmar recepción del archivo multimedia
    const statusMsg = await ctx.reply(
      isAudio ? '🎙️ Procesando audio...' :
      isPhoto ? '📷 Procesando imagen...' :
      '📄 Procesando documento...'
    );

    // Descargar archivos si es multimedia
    try {
      if (isAudio) {
        const fileId = ctx.message!.voice?.file_id || ctx.message!.audio?.file_id;
        mimeType = ctx.message!.voice?.mime_type || ctx.message!.audio?.mime_type || 'audio/ogg';
        if (fileId) {
          const downloaded = await downloadTelegramFile(fileId);
          fileBuffer = downloaded.buffer;
          rawFilePath = downloaded.filePath;
        }
      } else if (isPhoto) {
        const photos = ctx.message!.photo!;
        const fileId = photos[photos.length - 1].file_id;
        mimeType = 'image/jpeg';
        const downloaded = await downloadTelegramFile(fileId);
        fileBuffer = downloaded.buffer;
        rawFilePath = downloaded.filePath;
      } else if (isDocument) {
        const doc = ctx.message!.document!;
        mimeType = doc.mime_type || 'application/pdf';
        const downloaded = await downloadTelegramFile(doc.file_id);
        fileBuffer = downloaded.buffer;
        rawFilePath = downloaded.filePath;
      }
    } catch (downloadErr) {
      console.error('[AssistedFlow] Error descargando archivo de Telegram:', downloadErr);
      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
      await ctx.reply('⚠️ No se pudo descargar el archivo desde Telegram. Intenta de nuevo.');
      return;
    }

    // Extraer contenido multimedia con Gemini
    let extraction;
    try {
      if (fileBuffer) {
        extraction = await processMediaWithGemini(fileBuffer, mimeType);
      } else {
        await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
        await ctx.reply('⚠️ No se pudo obtener contenido para procesar.');
        return;
      }
    } catch (geminiErr) {
      console.error('[AssistedFlow] Error procesando contenido multimedia:', geminiErr);
      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
      await ctx.reply('⚠️ Ocurrió un error al analizar la información.');
      return;
    }

    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

    // Si no se extrajo un monto (> 0), pasar al flujo conversacional solicitándolo
    if (!extraction || typeof extraction.amount !== 'number' || extraction.amount <= 0) {
      const detectedConcept = extraction?.concept && extraction.concept !== 'Gasto general' ? extraction.concept : undefined;

      setSession(telegramId, {
        userId: user.id,
        step: 'AWAITING_AMOUNT',
        concept: detectedConcept
      });

      const mediaTitle = isAudio ? '🎙️ *Audio de voz recibido*' : '📄 *Documento recibido*';

      await ctx.reply(
        `${mediaTitle}\n` +
        (detectedConcept ? `*Concepto:* ${detectedConcept}\n\n` : '') +
        `💰 Por favor ingresa el *monto* del gasto (ej: \`1000\` o \`1000 fideos\`):`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Guardar en agyke_queue si se extrajo monto e iniciar clasificación
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

    await supabase
      .from('agyke_queue')
      .update({ telegram_message_id: sentMessage.message_id })
      .eq('id', queueItem.id);

  } catch (err) {
    console.error('[AssistedFlow] Excepción inesperada:', err);
    await ctx.reply('⚠️ Ocurrió un error inesperado al procesar tu solicitud.');
  }
}
