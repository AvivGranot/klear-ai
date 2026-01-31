/**
 * GET /api/auth/verify
 * Verify magic link token and create session
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateMagicLink, createSession, setSessionCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    // Validate magic link
    const email = await validateMagicLink(token)

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=expired_token', request.url))
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.redirect(new URL('/login?error=invalid_user', request.url))
    }

    // Create session
    const sessionToken = await createSession(user.id, {
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      deviceType: 'web',
    })

    // Set cookie
    await setSessionCookie(sessionToken)

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}
