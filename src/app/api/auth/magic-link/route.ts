/**
 * POST /api/auth/magic-link
 * Send magic link for passwordless login
 */

import { NextRequest, NextResponse } from 'next/server'
import { createMagicLink } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    })

    if (!user) {
      // Don't reveal that user doesn't exist - security best practice
      // But still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'אם האימייל קיים במערכת, נשלח לך קישור להתחברות',
      })
    }

    if (!user.isActive) {
      return NextResponse.json({
        success: true,
        message: 'אם האימייל קיים במערכת, נשלח לך קישור להתחברות',
      })
    }

    // Create magic link
    const token = await createMagicLink(email)
    const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`

    // TODO: Send email with magic link
    // For now, log it (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Magic link for', email, ':', magicLinkUrl)
    }

    // In production, integrate with email service:
    // await sendEmail({
    //   to: email,
    //   subject: 'התחברות ל-Klear AI',
    //   template: 'magic-link',
    //   data: { name: user.name, magicLinkUrl, companyName: user.company.name },
    // })

    return NextResponse.json({
      success: true,
      message: 'אם האימייל קיים במערכת, נשלח לך קישור להתחברות',
      // In development, include the link for testing
      ...(process.env.NODE_ENV === 'development' && { debugLink: magicLinkUrl }),
    })
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
