import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de protección de rutas
 *
 * Rutas públicas:
 * - / (landing page)
 * - /coming-soon
 * - /auth/* (login, register, etc.)
 * - /_next/* (assets de Next.js)
 * - /favicon.ico y otros archivos estáticos
 *
 * Todas las demás rutas redirigen a /coming-soon
 * hasta que estén listas para producción
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lista de rutas públicas
  const publicPaths = ["/", "/coming-soon", "/delivery", "/deliveries"];

  // Permitir assets de Next.js y archivos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/waitlist") || // Permitir API de waitlist
    pathname.includes(".") // Archivos como favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }

  // Permitir rutas públicas exactas
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Permitir rutas de autenticación
  if (pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  // Permitir rutas protegidas (dashboard, onboarding)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    return NextResponse.next();
  }

  // Permitir API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Por defecto, redirigir a coming soon
  console.log(
    `🚧 Ruta en desarrollo: ${pathname} → redirigiendo a /coming-soon`
  );
  return NextResponse.redirect(new URL("/coming-soon", request.url));
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
