/**
 * Debug API - Checks database state
 * DELETE THIS IN PRODUCTION
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check if database connection works
    const userCount = await prisma.user.count()
    const companyCount = await prisma.company.count()

    // Get user emails (without passwords)
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        company: {
          select: {
            name: true,
            slug: true,
          }
        }
      },
      take: 10
    })

    return NextResponse.json({
      status: 'connected',
      counts: {
        users: userCount,
        companies: companyCount,
      },
      users: users,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlStart: process.env.DATABASE_URL?.substring(0, 20) + '...',
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
