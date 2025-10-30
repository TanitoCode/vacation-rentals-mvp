// middleware.ts (RAÍZ DEL PROYECTO)
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Enforce canonical host + HTTPS en producción, sin romper dev.
 * Lee el host deseado desde SITE_URL para que sea configurable por cliente.
 */
export function middleware(req: NextRequest) {
  // 1) Nunca aplicamos en desarrollo local
  const isDev =
    process.env.NODE_ENV !== 'production' ||
    req.headers.get('host')?.startsWith('localhost');

  if (isDev) return NextResponse.next();

  // 2) Dominio canónico desde env
  const siteUrl = process.env.SITE_URL ?? '';
  let desired: URL | null = null;
  try {
    desired = siteUrl ? new URL(siteUrl) : null;
  } catch {
    desired = null;
  }
  if (!desired) return NextResponse.next(); // si no está configurado, no forzamos nada

  // Host/proto actuales (detrás de proxy respeta x-forwarded-*)
  const url = new URL(req.url);
  const currentHost =
    req.headers.get('x-forwarded-host') ??
    req.headers.get('host') ??
    url.host;

  const currentProto =
    req.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');

  // 3) Normalizar trailing slash (opcional, mejora consistencia de URLs)
  //    - quitamos barra final excepto en la home "/"
  const normalizedPath =
    url.pathname !== '/' && url.pathname.endsWith('/')
      ? url.pathname.slice(0, -1)
      : url.pathname;

  const needsHostFix = currentHost !== desired.host;
  const needsHttpsFix = currentProto !== 'https' && desired.protocol === 'https:';
  const needsSlashFix = normalizedPath !== url.pathname;

  if (needsHostFix || needsHttpsFix || needsSlashFix) {
    const redirectTo = new URL(url.toString());
    redirectTo.host = desired.host;
    redirectTo.protocol = desired.protocol || 'https:';
    redirectTo.pathname = normalizedPath;
    // Conserva querystring
    return NextResponse.redirect(redirectTo, 308);
  }

  return NextResponse.next();
}

/**
 * Matcher: excluimos assets y endpoints donde no tiene sentido forzar.
 * Si más adelante querés incluir API, eliminá "api".
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
