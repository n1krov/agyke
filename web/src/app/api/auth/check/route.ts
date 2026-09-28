import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;
    const isValid = await verifySessionToken(sessionCookie);

    return NextResponse.json({ authenticated: isValid });
  } catch (err) {
    console.error('[AuthCheck] Error al verificar sesión:', err);
    return NextResponse.json({ authenticated: false });
  }
}
