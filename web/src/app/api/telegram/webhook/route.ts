import { webhookCallback } from 'grammy';
import { bot } from '@/shared/bot';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const secretToken = process.env.TELEGRAM_SECRET_TOKEN;
    if (secretToken) {
      const headerSecret = req.headers.get('x-telegram-bot-api-secret-token');
      if (headerSecret !== secretToken) {
        console.warn('[TelegramWebhook] Secret token no coincide, rechazando petición.');
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const clonedReq = req.clone();
    try {
      const body = await clonedReq.json();
      const updateDesc = body?.callback_query ? `callback_query [${body.callback_query.data}] de ${body.callback_query.from?.first_name || body.callback_query.from?.id}` :
                         body?.message?.text ? `texto "${body.message.text}" de ${body.message.from?.first_name || body.message.from?.id}` :
                         body?.message?.voice ? `audio de ${body.message.from?.first_name || body.message.from?.id}` :
                         body?.message?.photo ? `foto de ${body.message.from?.first_name || body.message.from?.id}` :
                         'otro';
      console.log(`[TelegramWebhook] 📥 Update recibido: ${updateDesc}`);
    } catch {
      // Ignorar si el clon no pudo parsearse
    }

    const handleUpdate = webhookCallback(bot, 'std/http');
    return await handleUpdate(req);
  } catch (err) {
    console.error('[TelegramWebhook] ❌ Error procesando webhook de Telegram:', err);
    return new Response('OK', { status: 200 });
  }
}
