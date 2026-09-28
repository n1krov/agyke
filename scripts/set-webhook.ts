import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  let webhookUrl = process.env.WEBHOOK_URL;

  if (!token) {
    console.error('❌ Error: La variable TELEGRAM_BOT_TOKEN no está definida.');
    process.exit(1);
  }

  if (!webhookUrl) {
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
      const protocol = vercelUrl.startsWith('http') ? '' : 'https://';
      webhookUrl = `${protocol}${vercelUrl}/api/telegram/webhook`;
    } else {
      webhookUrl = 'https://agyke.vercel.app/api/telegram/webhook';
    }
  }

  console.log(`🔗 Configurando Webhook en Telegram...`);
  console.log(`📍 URL Objetivo: ${webhookUrl}`);

  const secretToken = process.env.TELEGRAM_SECRET_TOKEN;

  const apiUrl = new URL(`https://api.telegram.org/bot${token}/setWebhook`);
  apiUrl.searchParams.append('url', webhookUrl);
  apiUrl.searchParams.append('allowed_updates', JSON.stringify(['message', 'callback_query']));
  if (secretToken) {
    apiUrl.searchParams.append('secret_token', secretToken);
    console.log(`🔑 Secret Token adjuntado.`);
  }

  try {
    const res = await fetch(apiUrl.toString(), { method: 'POST' });
    const data = await res.json();

    if (data.ok) {
      console.log('✅ Webhook configurado exitosamente en Telegram!');
      console.log('Respuesta:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Telegram devolvió un error:', data);
    }
  } catch (err) {
    console.error('❌ Error al comunicarse con Telegram:', err);
  }
}

main();
