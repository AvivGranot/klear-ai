/**
 * GET /api/auth/me
 * Returns current authenticated user and tenant info
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch full company and subscription data
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        subscription: true,
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        industry: company.industry,
        logo: company.logo,
        primaryColor: company.primaryColor,
        welcomeMessage: company.welcomeMessage,
        botName: company.botName,
        timezone: company.timezone,
        language: company.language,
      },
      subscription: company.subscription ? {
        id: company.subscription.id,
        plan: company.subscription.plan,
        status: company.subscription.status,
        maxUsers: company.subscription.maxUsers,
        maxKnowledgeItems: company.subscription.maxKnowledgeItems,
        maxQueriesPerMonth: company.subscription.maxQueriesPerMonth,
        currentUsers: company.subscription.currentUsers,
        currentKnowledge: company.subscription.currentKnowledge,
        queriesThisMonth: company.subscription.queriesThisMonth,
        trialEndsAt: company.subscription.trialEndsAt?.toISOString() || null,
        currentPeriodEnd: company.subscription.currentPeriodEnd?.toISOString() || null,
      } : null,
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
