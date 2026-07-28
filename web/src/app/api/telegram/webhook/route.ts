import { webhookCallback } from 'grammy';
import { bot } from '@/shared/bot';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const handleUpdate = webhookCallback(bot, 'std/http');
    return await handleUpdate(req);
  } catch (err) {
    console.error('[TelegramWebhook] Error al procesar update:', err);
    return new Response('OK', { status: 200 });
  }
}
