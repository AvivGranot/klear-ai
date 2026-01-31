/**
 * Companies API
 * Note: For new company creation, use /api/companies/register instead
 * This endpoint is for admin operations
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, requireRole } from "@/lib/auth"

// Helper to generate URL-safe slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
}

// Get companies (admin only in production)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const slug = searchParams.get("slug")

    if (id) {
      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          subscription: true,
          _count: {
            select: {
              users: true,
              knowledgeItems: true,
              conversations: true,
            },
          },
        },
      })

      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({ company })
    }

    if (slug) {
      const company = await prisma.company.findUnique({
        where: { slug },
        include: {
          subscription: true,
          _count: {
            select: {
              users: true,
              knowledgeItems: true,
              conversations: true,
            },
          },
        },
      })

      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({ company })
    }

    // List all companies (this should be admin-protected in production)
    const companies = await prisma.company.findMany({
      include: {
        subscription: true,
        _count: {
          select: {
            users: true,
            knowledgeItems: true,
            conversations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ companies })
  } catch (error) {
    console.error("Company GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    )
  }
}

// Create company (admin operation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, industry, logo, language = 'he', timezone = 'Asia/Jerusalem' } = body

    if (!name) {
      return NextResponse.json(
        { error: "Missing company name" },
        { status: 400 }
      )
    }

    // Generate unique slug
    let slug = generateSlug(name)
    let counter = 1
    while (await prisma.company.findUnique({ where: { slug } })) {
      slug = `${generateSlug(name)}-${counter}`
      counter++
    }

    const company = await prisma.company.create({
      data: {
        name,
        slug,
        industry,
        logo,
        language,
        timezone,
        welcomeMessage: `שלום! אני ${name} AI, איך אוכל לעזור לך היום?`,
        botName: `${name} AI`,
      },
    })

    // Create default trial subscription
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    await prisma.subscription.create({
      data: {
        companyId: company.id,
        plan: 'STARTER',
        status: 'TRIAL',
        trialEndsAt,
      },
    })

    return NextResponse.json({ company }, { status: 201 })
  } catch (error) {
    console.error("Company POST error:", error)
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    )
  }
}
