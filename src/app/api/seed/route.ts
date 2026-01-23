import { NextResponse } from "next/server"
import { knowledgeItems, categories, company } from "@/data/jolika-data"

// Company data for Jolika Chocolate
const DEMO_COMPANY = {
  id: "jolika-chocolate",
  name: company.name,
  industry: "chocolate_shop",
}

const DEMO_CATEGORIES = categories

// Try to import Prisma
let prisma: any = null

async function initDB() {
  if (prisma !== null) return prisma
  try {
    const db = await import("@/lib/db")
    prisma = db.default
    await prisma.$connect()
    return prisma
  } catch (e) {
    console.log("Database not available, using mock data")
    prisma = false
    return null
  }
}

export async function POST() {
  const db = await initDB()

  if (!db) {
    return NextResponse.json({
      message: "Demo mode - no database",
      companyId: DEMO_COMPANY.id,
      companyName: DEMO_COMPANY.name,
      knowledgeItems: knowledgeItems.length || 0,
      mode: "demo"
    }, { status: 201 })
  }

  try {
    // Check if data already exists
    const existingCompany = await prisma.company.findFirst()
    if (existingCompany) {
      const kbCount = await prisma.knowledgeItem.count({ where: { companyId: existingCompany.id } })
      return NextResponse.json({
        message: "Data already exists",
        companyId: existingCompany.id,
        companyName: existingCompany.name,
        knowledgeItems: kbCount,
      })
    }

    // Create company - ג'וליקה שוקולד
    const newCompany = await prisma.company.create({
      data: {
        name: DEMO_COMPANY.name,
        industry: DEMO_COMPANY.industry,
      },
    })

    // Create categories from Jolika data
    const categoryMap = new Map<string, string>()

    for (const cat of DEMO_CATEGORIES) {
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          nameHe: cat.nameHe,
          icon: cat.icon || "📁",
          companyId: newCompany.id,
        },
      })
      categoryMap.set(cat.nameHe, created.id)
    }

    // Create knowledge items from Jolika data
    let createdCount = 0

    for (const item of knowledgeItems) {
      try {
        await prisma.knowledgeItem.create({
          data: {
            title: item.title || item.titleHe || "שאלה",
            titleHe: item.titleHe || item.title,
            content: item.content || item.contentHe || "",
            contentHe: item.contentHe || item.content,
            type: item.type || "faq",
            companyId: newCompany.id,
            isActive: true,
          },
        })
        createdCount++
      } catch (e) {
        // Skip duplicates or errors
      }
    }

    return NextResponse.json({
      message: "Data seeded successfully for Jolika Chocolate",
      companyId: newCompany.id,
      companyName: newCompany.name,
      categories: DEMO_CATEGORIES.length,
      knowledgeItems: createdCount,
    }, { status: 201 })

  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json({
      message: "Seed failed",
      error: String(error),
      mode: "error"
    }, { status: 500 })
  }
}

export async function GET() {
  const db = await initDB()

  if (!db) {
    return NextResponse.json({
      seeded: true,
      companyId: DEMO_COMPANY.id,
      companyName: DEMO_COMPANY.name,
      knowledgeItemsCount: knowledgeItems.length || 0,
      mode: "demo"
    })
  }

  try {
    const company = await prisma.company.findFirst()

    if (!company) {
      // No company - trigger seed by returning seeded: false
      return NextResponse.json({
        seeded: false,
        message: "No data found, call POST to seed",
      })
    }

    const [knowledgeItems, categories] = await Promise.all([
      prisma.knowledgeItem.count({ where: { companyId: company.id } }),
      prisma.category.count({ where: { companyId: company.id } }),
    ])

    return NextResponse.json({
      seeded: true,
      companyId: company.id,
      companyName: company.name,
      knowledgeItemsCount: knowledgeItems,
      categoriesCount: categories,
    })

  } catch (error) {
    return NextResponse.json({
      seeded: false,
      error: String(error),
    })
  }
}
