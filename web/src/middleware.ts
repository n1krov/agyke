import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';

// Rutas públicas que no requieren autenticación
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/check',
  '/api/telegram/webhook',       // Crítico: El webhook de Telegram se autentica por su secret token
  '/api/telegram/setup-webhook',
  '/lab',                        // Laboratorio experimental multimodal
  '/api/lab',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Permitir bypass para rutas explícitamente públicas
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // 2. Extraer y verificar la cookie de sesión
  const sessionToken = req.cookies.get(COOKIE_NAME)?.value;
  const isAuthenticated = await verifySessionToken(sessionToken);

  // 3. Si el usuario ya está autenticado e intenta ir a /login, redirigir al Dashboard
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // 4. Si la ruta es pública, permitir el paso
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 5. Si la ruta es privada y no está autenticado:
  if (!isAuthenticated) {
    // Si es una petición a la API (ej: /api/dashboard), responder 401 JSON
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Ingrese el PIN de Agyke en el sitio web.' },
        { status: 401 }
      );
    }

    // Si es navegación de páginas (ej: /), redirigir a /login
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Sesión válida: continuar
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, sitemap, robots
     * - Archivos con extensiones comunes (.svg, .png, .jpg)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
