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
    }
  }

  if (!webhookUrl) {
    console.error('❌ Error: Debe especificar WEBHOOK_URL o VERCEL_URL.');
    console.log('Uso: TELEGRAM_BOT_TOKEN="..." WEBHOOK_URL="https://tu-dominio.vercel.app/api/telegram/webhook" npx tsx scripts/set-webhook.ts');
    process.exit(1);
  }

  console.log(`🔗 Configurando Webhook en Telegram...`);
  console.log(`📍 URL Objetivo: ${webhookUrl}`);

  const secretToken = process.env.TELEGRAM_SECRET_TOKEN;

  const apiUrl = new URL(`https://api.telegram.org/bot${token}/setWebhook`);
  apiUrl.searchParams.append('url', webhookUrl);
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
