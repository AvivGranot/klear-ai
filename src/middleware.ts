/**
 * Next.js Middleware
 * Currently disabled for MVP - dashboard is public
 * TODO: Re-enable auth after MVP launch
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // MVP: Allow all routes without authentication
  // Auth will be re-enabled after initial launch
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only match API routes that need protection (none for now)
    '/api/protected/:path*',
  ],
}
