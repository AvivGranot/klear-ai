import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// Create company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, industry, logo } = body

    if (!name) {
      return NextResponse.json(
        { error: "Missing company name" },
        { status: 400 }
      )
    }

    const company = await prisma.company.create({
      data: {
        name,
        industry,
        logo,
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

// Get companies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const company = await prisma.company.findUnique({
        where: { id },
        include: {
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

    const companies = await prisma.company.findMany({
      include: {
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
