import { InlineKeyboard } from 'grammy';
import { AgykeContext } from '../../types/context';
import { supabase } from '../../lib/supabase';
import { processMediaWithGemini } from '../../services/gemini';
import { parseAudioMessage } from '../../services/multimodal/audio-parser';
import { parseReceiptImage } from '../../services/multimodal/receipt-parser';
import { parsePdfDocument } from '../../services/multimodal/pdf-parser';
import type { ExtractedExpenseDraft } from '../../types/multimodal';
import { SourceType, ClassificationType } from '../../types/database';
import { getSession, setSession, clearSession } from '../../services/session';
import { gastoCommandHandler, getClassificationKeyboard, VALID_CLASSIFICATIONS } from '../commands/gasto';
import { calculateDebtImpact, updateBalance } from '../../services/balance';
import { saldoCommandHandler } from '../commands/saldo';
import { helpCommandHandler } from '../commands/help';

export function tryParseNumberPrefix(text: string): number | null {
  const firstToken = text.split(/\s+/)[0];
  if (!firstToken) return null;
  const rawAmount = firstToken.replace('$', '').replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(rawAmount);
  if (!isNaN(amount) && amount > 0 && /^\$?[\d.,]+$/.test(firstToken)) {
    return amount;
  }
  return null;
}

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
      // Si el texto empieza con / de otro comando (ej: /saldo, /help, /cancelar, /start), dejar que grammy lo maneje
      if (textMsg.startsWith('/') && !textMsg.toLowerCase().startsWith('/gasto')) {
        return;
      }

      // Caso A: El texto coincide con "gasto" o "/gasto" (ej: "gasto", "gasto 1000", "gasto 1000 pollo 50")
      const gastoMatch = textMsg.match(/^(\/)?gasto(?:\s+(.*))?$/i);
      if (gastoMatch) {
        const args = gastoMatch[2] || '';
        await gastoCommandHandler(ctx, args);
        return;
      }

      // Caso B: El texto empieza con un número / monto (ej: "3344 carne", "1000 pollo 50", "$15000 Coto")
      const leadingAmount = tryParseNumberPrefix(textMsg);
      if (leadingAmount !== null) {
        await gastoCommandHandler(ctx, textMsg);
        return;
      }

      const normalizedText = textMsg.toLowerCase().trim();

      // Caso C: Consultar saldo en lenguaje natural (ej: "ver saldo", "saldo", "balance", "ver balance", "cuanto debemos")
      const isSaldoQuery = /^(ver\s+)?(saldo|balance)s?$/i.test(normalizedText) ||
                           normalizedText === 'cuanto debemos' ||
                           normalizedText === 'cuánto debemos' ||
                           normalizedText === 'estado';
      if (isSaldoQuery) {
        await saldoCommandHandler(ctx);
        return;
      }

      // Caso D: Consultar ayuda en lenguaje natural (ej: "ayuda", "help", "comandos")
      const isHelpQuery = /^(ayuda|help|comandos)$/i.test(normalizedText);
      if (isHelpQuery) {
        await helpCommandHandler(ctx);
        return;
      }

      // Caso E: Cancelar en lenguaje natural (ej: "cancelar", "cancel")
      const isCancelQuery = /^(cancelar|cancel)$/i.test(normalizedText);
      if (isCancelQuery) {
        clearSession(telegramId);
        await ctx.reply('❌ Operación cancelada.');
        return;
      }

      // Caso F: Cualquier otro texto plano (ej: "hola", "buenas", "que tal")
      // Responder con un menú interactivo de botones de acceso rápido
      const quickMenuKeyboard = new InlineKeyboard()
        .text('💰 Registrar Gasto', 'action:gasto')
        .text('📊 Ver Saldo', 'action:saldo')
        .row()
        .text('💡 Ayuda / Comandos', 'action:help');

      await ctx.reply(
        `👋 ¿Qué te gustaría hacer en *Agyke*?\nSelecciona una opción rápida:`,
        {
          parse_mode: 'Markdown',
          reply_markup: quickMenuKeyboard
        }
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

    // Extraer contenido multimedia con el parser correspondiente
    let draft: ExtractedExpenseDraft | null = null;
    try {
      if (!fileBuffer) {
        await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
        await ctx.reply('⚠️ No se pudo obtener el archivo para procesar.');
        return;
      }

      if (isAudio) {
        const res = await parseAudioMessage(fileBuffer, mimeType);
        if (res.success && res.draft) {
          draft = res.draft;
        }
      } else if (isPhoto) {
        const res = await parseReceiptImage(fileBuffer, mimeType);
        if (res.success && res.draft) {
          draft = res.draft;
        }
      } else if (isDocument) {
        if (mimeType === 'application/pdf' || rawFilePath?.toLowerCase().endsWith('.pdf')) {
          const res = await parsePdfDocument(fileBuffer);
          if (res.success && res.draft) {
            draft = res.draft;
          }
        } else if (mimeType.startsWith('image/')) {
          const res = await parseReceiptImage(fileBuffer, mimeType);
          if (res.success && res.draft) {
            draft = res.draft;
          }
        } else {
          await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
          await ctx.reply('⚠️ Formato de documento no soportado. Envía una factura en PDF o una foto.');
          return;
        }
      }
    } catch (geminiErr) {
      console.error('[AssistedFlow] Error procesando contenido multimedia con Gemini:', geminiErr);
      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
      await ctx.reply('⚠️ Ocurrió un error al analizar la información.');
      return;
    }

    await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});

    // Si no se extrajo un monto (> 0), pasar al flujo conversacional solicitándolo
    if (!draft || typeof draft.amount !== 'number' || draft.amount <= 0) {
      const detectedConcept = draft?.concept && draft.concept !== 'Gasto general' && draft.concept !== 'Comprobante' ? draft.concept : undefined;

      setSession(telegramId, {
        userId: user.id,
        step: 'AWAITING_AMOUNT',
        concept: detectedConcept
      });

      const mediaTitle = isAudio ? '🎙️ *Audio de voz recibido*' :
                         isPhoto ? '📷 *Comprobante recibido*' :
                         '📄 *Documento recibido*';

      await ctx.reply(
        `${mediaTitle}\n` +
        `⚠️ No se pudo identificar el monto total con certeza.\n\n` +
        (detectedConcept ? `*Concepto:* ${detectedConcept}\n` : '') +
        (draft?.raw_transcription ? `🗣️ *Detectado:* _"${draft.raw_transcription}"_\n\n` : '\n') +
        `💰 Por favor responde este mensaje con el *monto* del gasto (ej: \`15000\` o \`15000 ${detectedConcept || 'gasto'}\`):`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Guardar en agyke_queue si se extrajo monto e iniciar clasificación
    const { data: queueItem, error: queueError } = await supabase
      .from('agyke_queue')
      .insert({
        user_id: user.id,
        amount: draft.amount,
        concept: draft.concept || 'Gasto general',
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

    // Botonera interactiva de Agyke con sugerencia destacada (si aplica) y botón de descarte (MULTI-17 & MULTI-18)
    const suggested = draft.suggested_classification;
    const keyboard = new InlineKeyboard()
      .text(suggested === '50' ? '✨ 50 (Mitad y Mitad)' : '50 (Mitad y Mitad)', `agyke:${queueItem.id}:50`)
      .text(suggested === '100' ? '✨ 100 (Favor 100%)' : '100 (Favor 100%)', `agyke:${queueItem.id}:100`)
      .row()
      .text(suggested === '-100' ? '✨ -100 (Deuda Mía)' : '-100 (Deuda Mía)', `agyke:${queueItem.id}:-100`)
      .text(suggested === '0' ? '✨ 0 (Personal)' : '0 (Personal)', `agyke:${queueItem.id}:0`)
      .row()
      .text('❌ Descartar Gasto', `agyke:${queueItem.id}:discard`);

    const formattedAmount = draft.amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const header = isAudio ? '🎙️ *Nota de voz procesada*' :
                   isPhoto ? '📷 *Comprobante analizado*' :
                   '📄 *Documento analizado*';

    const lines: string[] = [
      header,
      `*Monto:* $${formattedAmount}`,
      `*Concepto:* ${draft.concept}`
    ];

    if (draft.metadata?.merchant) {
      lines.push(`*Comercio:* ${draft.metadata.merchant}`);
    }
    if (draft.date) {
      lines.push(`*Fecha:* ${draft.date}`);
    }
    if (draft.raw_transcription) {
      lines.push(`🗣️ *Detectado:* _"${draft.raw_transcription}"_`);
    }
    if (suggested) {
      const label = suggested === '50' ? '50/50 (Mitad y Mitad)' :
                    suggested === '100' ? 'Favor 100%' :
                    suggested === '-100' ? 'Deuda Propia' : 'Personal';
      lines.push(`⚖️ *Sugerencia:* ${label}`);
    }

    lines.push('\nSelecciona la clasificación:');

    const sentMessage = await ctx.reply(lines.join('\n'), {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    await supabase
      .from('agyke_queue')
      .update({ telegram_message_id: sentMessage.message_id })
      .eq('id', queueItem.id);

  } catch (err) {
    console.error('[AssistedFlow] Excepción inesperada:', err);
    await ctx.reply('⚠️ Ocurrió un error inesperado al procesar tu solicitud.');
  }
}
