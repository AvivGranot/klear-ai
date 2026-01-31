/**
 * POST /api/auth/logout
 * Logout current session
 */

import { NextResponse } from 'next/server'
import { getSessionCookie, destroySession, clearSessionCookie } from '@/lib/auth'

export async function POST() {
  try {
    const token = await getSessionCookie()

    if (token) {
      await destroySession(token)
    }

    await clearSessionCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    // Still clear the cookie even if there's an error
    await clearSessionCookie()
    return NextResponse.json({ success: true })
  }
}
