import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Sesión cerrada correctamente' });

    response.cookies.set({
      name: COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error('[AuthLogout] Error en cierre de sesión:', err);
    return NextResponse.json(
      { error: 'Error al procesar el cierre de sesión.' },
      { status: 500 }
    );
  }
}
