import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { applySecurityHeaders } from "@shared/lib/security-headers";

/**
 * Middleware de protección de rutas, session refresh y security headers
 *
 * Funcionalidades:
 * 1. Actualiza automáticamente la sesión de Supabase (previene expiración)
 * 2. Protege rutas según autenticación del usuario
 * 3. Aplica headers de seguridad a todas las respuestas
 *
 * Rutas públicas:
 * - / (landing page)
 * - /coming-soon
 * - /auth/* (login, register, etc.)
 * - /delivery/* (recipients pueden acceder sin login)
 * - /_next/* (assets de Next.js)
 * - /favicon.ico y otros archivos estáticos
 *
 * Rutas protegidas (requieren autenticación):
 * - /dashboard
 * - /onboarding
 * - /send
 * - /audit
 * - /settings
 *
 * Security:
 * - Refresh automático de sesión (previene "Unauthorized" aleatorio)
 * - CSP, HSTS, X-Frame-Options, etc.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    (pathname.includes(".") && !pathname.startsWith("/api"))
  ) {
    return NextResponse.next();
  }

  // Create response object (will be modified by Supabase for cookie management)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for session management
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update request cookies
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Update response cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Remove from request
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          // Remove from response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  // This prevents "Unauthorized" errors when session expires (default: 1 hour)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public and protected paths
  const publicPaths = ["/", "/coming-soon"];
  const protectedPaths = ["/dashboard", "/onboarding", "/send", "/audit", "/settings"];

  // Check if current path is protected
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // Redirect to login if user is not authenticated and trying to access protected route
  if (isProtectedPath && !user) {
    console.log(`[Middleware] Unauthenticated access to ${pathname}, redirecting to login`);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Handle different route types
  if (publicPaths.includes(pathname)) {
    // Public paths - allow access
    response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  } else if (pathname.startsWith("/auth")) {
    // Auth routes - redirect to dashboard if already logged in
    if (user) {
      console.log(`[Middleware] Authenticated user accessing ${pathname}, redirecting to dashboard`);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  } else if (pathname.startsWith("/delivery")) {
    // Delivery routes - public for recipients
    response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  } else if (isProtectedPath) {
    // Protected routes - allow if authenticated
    response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  } else if (pathname.startsWith("/api")) {
    // API routes - handle auth in route handlers
    response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  } else {
    // Unknown routes - redirect to coming soon
    console.log(`🚧 Ruta en desarrollo: ${pathname} → redirigiendo a /coming-soon`);
    response = NextResponse.redirect(new URL("/coming-soon", request.url));
  }

  // Apply security headers to all responses
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
