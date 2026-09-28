/**
 * Módulo Criptográfico y Gestión de Sesión Ligera (Obsidian Auth)
 * Utiliza Web Crypto API nativo para máxima compatibilidad con Next.js Middleware y Edge/Serverless.
 */

const encoder = new TextEncoder();

export const COOKIE_NAME = 'agyke_session';
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 días en segundos

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Genera un token de sesión criptográfico con timestamp y firma HMAC-SHA256
 */
export async function createSessionToken(): Promise<string> {
  const secret = process.env.SESSION_SECRET || 'agyke_session_secret_fintech_2026';
  const timestamp = Date.now().toString();
  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp));
  const signatureHex = bufferToHex(signature);
  return `${timestamp}.${signatureHex}`;
}

/**
 * Valida un token de sesión verificando su firma HMAC y vigencia temporal
 */
export async function verifySessionToken(
  token: string | undefined | null,
  maxAgeSeconds: number = SESSION_MAX_AGE
): Promise<boolean> {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return false;
  }

  const [timestampStr, signatureHex] = token.split('.');
  if (!timestampStr || !signatureHex) {
    return false;
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return false;
  }

  // Verificar que el timestamp no haya expirado ni esté en el futuro
  const now = Date.now();
  if (now - timestamp > maxAgeSeconds * 1000 || timestamp > now + 60_000) {
    return false;
  }

  const secret = process.env.SESSION_SECRET || 'agyke_session_secret_fintech_2026';
  const key = await getHmacKey(secret);
  const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(timestampStr));
  const expectedHex = bufferToHex(expectedSignature);

  // Comparación en tiempo constante para mitigar timing attacks
  if (signatureHex.length !== expectedHex.length) {
    return false;
  }

  let match = true;
  for (let i = 0; i < signatureHex.length; i++) {
    if (signatureHex[i] !== expectedHex[i]) {
      match = false;
    }
  }

  return match;
}

/**
 * Verifica si el PIN ingresado por el usuario coincide con la variable configurada
 */
export function verifyPin(inputPin: string | undefined | null): boolean {
  const configuredPin = process.env.DASHBOARD_ACCESS_PIN || '2026';
  if (!inputPin || typeof inputPin !== 'string') {
    return false;
  }
  return inputPin.trim() === configuredPin.trim();
}
