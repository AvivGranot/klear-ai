/**
 * POST /api/auth/logout
 * Logout current session
 */

import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

const SESSION_COOKIE_NAME = 'klear_session'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

    if (token) {
      await destroySession(token)
    }

    // Create response and clear cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete(SESSION_COOKIE_NAME)

    return response
  } catch (error) {
    console.error('Logout error:', error)
    // Still clear the cookie even if there's an error
    const response = NextResponse.json({ success: true })
    response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  }
}
