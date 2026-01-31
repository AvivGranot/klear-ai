/**
 * POST /api/companies/register
 * Register a new company (tenant) with owner account
 * Brian Chesky: Make signup so easy it feels magical
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth'

// Helper to generate a URL-safe slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .substring(0, 50)         // Limit length
}

// Helper to ensure unique slug
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.company.findUnique({ where: { slug } })
    if (!existing) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyName,
      ownerName,
      ownerEmail,
      ownerPassword,
      industry,
      language = 'he',
      timezone = 'Asia/Jerusalem',
    } = body

    // Validation
    if (!companyName || !ownerName || !ownerEmail || !ownerPassword) {
      return NextResponse.json(
        { error: 'כל השדות חובה' },
        { status: 400 }
      )
    }

    if (ownerPassword.length < 8) {
      return NextResponse.json(
        { error: 'הסיסמה חייבת להכיל לפחות 8 תווים' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ownerEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'כתובת האימייל כבר קיימת במערכת' },
        { status: 400 }
      )
    }

    // Generate unique slug
    const baseSlug = generateSlug(companyName)
    const slug = await ensureUniqueSlug(baseSlug)

    // Hash password
    const passwordHash = await hashPassword(ownerPassword)

    // Create company with subscription and owner in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          slug,
          industry,
          language,
          timezone,
          welcomeMessage: `שלום! אני ${companyName} AI, איך אוכל לעזור לך היום?`,
          botName: `${companyName} AI`,
        },
      })

      // Create subscription (starts with trial)
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14) // 14-day trial

      await tx.subscription.create({
        data: {
          companyId: company.id,
          plan: 'STARTER',
          status: 'TRIAL',
          maxUsers: 10,
          maxKnowledgeItems: 100,
          maxQueriesPerMonth: 1000,
          currentUsers: 1,
          trialEndsAt,
        },
      })

      // Create owner user
      const owner = await tx.user.create({
        data: {
          email: ownerEmail,
          name: ownerName,
          passwordHash,
          role: 'owner',
          companyId: company.id,
          emailVerified: new Date(), // Auto-verify for signup
        },
      })

      // Create default categories
      const defaultCategories = [
        { name: 'כללי', nameHe: 'כללי', icon: '📋', order: 0 },
        { name: 'שעות פעילות', nameHe: 'שעות פעילות', icon: '🕐', order: 1 },
        { name: 'מוצרים', nameHe: 'מוצרים', icon: '📦', order: 2 },
        { name: 'מדיניות', nameHe: 'מדיניות', icon: '📜', order: 3 },
        { name: 'יצירת קשר', nameHe: 'יצירת קשר', icon: '📞', order: 4 },
      ]

      for (const cat of defaultCategories) {
        await tx.category.create({
          data: {
            ...cat,
            companyId: company.id,
          },
        })
      }

      return { company, owner }
    })

    // Create session for the new owner
    const sessionToken = await createSession(result.owner.id, {
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      deviceType: 'web',
    })

    // Set cookie
    await setSessionCookie(sessionToken)

    return NextResponse.json({
      success: true,
      company: {
        id: result.company.id,
        name: result.company.name,
        slug: result.company.slug,
      },
      user: {
        id: result.owner.id,
        name: result.owner.name,
        email: result.owner.email,
        role: result.owner.role,
      },
      redirectTo: '/dashboard/onboarding',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'שגיאה בהרשמה, אנא נסה שוב' },
      { status: 500 }
    )
  }
}
