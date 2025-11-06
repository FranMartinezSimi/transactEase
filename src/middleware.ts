import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders } from "@shared/lib/security-headers";

/**
 * Middleware de protección de rutas y security headers
 *
 * Rutas públicas:
 * - / (landing page)
 * - /coming-soon
 * - /auth/* (login, register, etc.)
 * - /_next/* (assets de Next.js)
 * - /favicon.ico y otros archivos estáticos
 *
 * Security:
 * - Aplica headers de seguridad a todas las respuestas
 * - CSP, HSTS, X-Frame-Options, etc.
 *
 * Todas las demás rutas redirigen a /coming-soon
 * hasta que estén listas para producción
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lista de rutas públicas
  const publicPaths = ["/", "/coming-soon"];

  // Permitir assets de Next.js y archivos estáticos (sin security headers)
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") && !pathname.startsWith("/api") // Archivos estáticos
  ) {
    return NextResponse.next();
  }

  let response: NextResponse;

  // Permitir rutas públicas exactas
  if (publicPaths.includes(pathname)) {
    response = NextResponse.next();
  }
  // Permitir rutas de autenticación
  else if (pathname.startsWith("/auth")) {
    response = NextResponse.next();
  }
  // Permitir rutas de delivery (públicas para recipients)
  else if (pathname.startsWith("/delivery")) {
    response = NextResponse.next();
  }
  // Permitir rutas protegidas (dashboard, onboarding, send, audit)
  else if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/send") ||
    pathname.startsWith("/audit")
  ) {
    response = NextResponse.next();
  }
  // Permitir API routes
  else if (pathname.startsWith("/api")) {
    response = NextResponse.next();
  }
  // Por defecto, redirigir a coming soon
  else {
    console.log(
      `🚧 Ruta en desarrollo: ${pathname} → redirigiendo a /coming-soon`
    );
    response = NextResponse.redirect(new URL("/coming-soon", request.url));
  }

  // Aplicar security headers a todas las respuestas
  return applySecurityHeaders(response);
}

/**
 * Configuración del matcher
 * Define en qué rutas se ejecuta el middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
