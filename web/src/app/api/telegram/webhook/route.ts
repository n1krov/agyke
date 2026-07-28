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

    const handleUpdate = webhookCallback(bot, 'std/http');
    return await handleUpdate(req);
  } catch (err) {
    console.error('[TelegramWebhook] Error procesando webhook de Telegram:', err);
    return new Response('OK', { status: 200 });
  }
}
