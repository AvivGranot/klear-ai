/**
 * Next.js Middleware
 * Protects dashboard routes, allows public chat routes
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'klear_session'

// Routes that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/pricing',
  '/c/',       // Employee chat (public)
  '/chat/',    // Legacy employee chat (public)
  '/api/chat', // Chat API
  '/api/auth', // Auth endpoints
  '/api/companies/register', // Company registration
]

// Static assets and Next.js internals
const ignoredPaths = [
  '/_next',
  '/favicon',
  '/images',
  '/fonts',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets and Next.js internals
  if (ignoredPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Allow public routes
  if (publicPaths.some(path => pathname.startsWith(path)) || pathname === '/') {
    return NextResponse.next()
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const session = request.cookies.get(SESSION_COOKIE_NAME)

    if (!session?.value) {
      // No session - redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Session exists - allow access (role check happens in layout)
    return NextResponse.next()
  }

  // Protect API routes that need auth (except public ones)
  if (pathname.startsWith('/api/') && !publicPaths.some(p => pathname.startsWith(p))) {
    const session = request.cookies.get(SESSION_COOKIE_NAME)

    if (!session?.value) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
