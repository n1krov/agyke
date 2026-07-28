import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN no configurado.' }, { status: 500 });
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[SetupWebhook GET] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN no configurado.' }, { status: 500 });
    }

    let targetUrl: string | undefined;
    let secretToken = process.env.TELEGRAM_SECRET_TOKEN;

    try {
      const body = await req.json();
      if (body?.url) targetUrl = body.url;
      if (body?.secret_token) secretToken = body.secret_token;
    } catch {
      // Sin body JSON, usar fallback de VERCEL_URL o env
    }

    if (!targetUrl) {
      const vercelUrl = process.env.VERCEL_URL;
      if (vercelUrl) {
        const protocol = vercelUrl.startsWith('http') ? '' : 'https://';
        targetUrl = `${protocol}${vercelUrl}/api/telegram/webhook`;
      } else if (process.env.WEBHOOK_URL) {
        targetUrl = process.env.WEBHOOK_URL;
      }
    }

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'No se especificó la URL del webhook y VERCEL_URL no está disponible.' },
        { status: 400 }
      );
    }

    const telegramApiUrl = new URL(`https://api.telegram.org/bot${token}/setWebhook`);
    telegramApiUrl.searchParams.append('url', targetUrl);
    if (secretToken) {
      telegramApiUrl.searchParams.append('secret_token', secretToken);
    }

    const res = await fetch(telegramApiUrl.toString(), { method: 'POST' });
    const data = await res.json();

    return NextResponse.json({
      target_url: targetUrl,
      telegram_response: data
    });
  } catch (err: any) {
    console.error('[SetupWebhook POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
