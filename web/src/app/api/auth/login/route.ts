import { NextResponse } from 'next/server';
import { verifyPin, createSessionToken, COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pin = body?.pin;

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json(
        { error: 'Por favor ingresa el PIN o contraseña de acceso.' },
        { status: 400 }
      );
    }

    if (!verifyPin(pin)) {
      return NextResponse.json(
        { error: 'PIN o contraseña incorrecta. Verifica e intenta nuevamente.' },
        { status: 401 }
      );
    }

    // PIN correcto: generar token firmado
    const token = await createSessionToken();

    const response = NextResponse.json({ success: true, message: 'Acceso autorizado' });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (err) {
    console.error('[AuthLogin] Error en login de acceso:', err);
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al validar el acceso.' },
      { status: 500 }
    );
  }
}
