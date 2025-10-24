import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware de protección de rutas
 *
 * Rutas públicas:
 * - / (landing page)
 * - /coming-soon
 * - /_next/* (assets de Next.js)
 * - /favicon.ico y otros archivos estáticos
 *
 * Todas las demás rutas redirigen a /coming-soon
 * hasta que estén listas para producción
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Lista de rutas públicas
  const publicPaths = [
    '/',
    '/coming-soon',
  ]

  // Permitir assets de Next.js y archivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.includes('.') // Archivos como favicon.ico, images, etc.
  ) {
    return NextResponse.next()
  }

  // Permitir rutas públicas exactas
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // TODO: Cuando implementes auth, descomenta esto:
  // if (pathname.startsWith('/auth')) {
  //   return NextResponse.next()
  // }

  // TODO: Para rutas protegidas con auth, agrega:
  // const token = request.cookies.get('auth-token')
  // if (!token && pathname.startsWith('/dashboard')) {
  //   return NextResponse.redirect(new URL('/auth', request.url))
  // }

  // Por defecto, redirigir a coming soon
  console.log(`🚧 Ruta en desarrollo: ${pathname} → redirigiendo a /coming-soon`)
  return NextResponse.redirect(new URL('/coming-soon', request.url))
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
