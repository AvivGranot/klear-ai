import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

// Load WhatsApp data from exported JSON files
let whatsappFaqs: any[] = []
let whatsappCategories: any[] = []

try {
  const faqsPath = join(process.cwd(), "prisma", "whatsapp-faqs.json")
  const categoriesPath = join(process.cwd(), "prisma", "categories.json")
  whatsappFaqs = JSON.parse(readFileSync(faqsPath, "utf-8"))
  whatsappCategories = JSON.parse(readFileSync(categoriesPath, "utf-8"))
} catch (e) {
  console.log("WhatsApp data files not found, using demo data")
}

// Demo data - used when WhatsApp data not available
const DEMO_COMPANY = {
  id: "demo-company-001",
  name: "תחנת דלק אמיר בני ברק",
  industry: "gas_station",
}

const DEMO_CATEGORIES = [
  { name: "Fuel & Pumps", nameHe: "תדלוק ומשאבות", icon: "⛽" },
  { name: "Payments", nameHe: "תשלומים וקופה", icon: "💳" },
  { name: "HR & Shifts", nameHe: "כוח אדם ומשמרות", icon: "👥" },
  { name: "Safety", nameHe: "בטיחות וחירום", icon: "🚨" },
  { name: "Inventory", nameHe: "מלאי והזמנות", icon: "📦" },
  { name: "Maintenance", nameHe: "תקלות ותחזוקה", icon: "🔧" },
]

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
      knowledgeItems: whatsappFaqs.length || 0,
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

    // Create company - תחנת דלק אמיר בני ברק
    const company = await prisma.company.create({
      data: {
        name: "תחנת דלק אמיר בני ברק",
        industry: "gas_station",
      },
    })

    // Use WhatsApp categories if available, otherwise demo
    const categoriesToCreate = whatsappCategories.length > 0 ? whatsappCategories : DEMO_CATEGORIES
    const categoryMap = new Map<string, string>()

    for (const cat of categoriesToCreate) {
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          nameHe: cat.nameHe,
          icon: cat.icon || "📁",
          companyId: company.id,
        },
      })
      categoryMap.set(cat.nameHe, created.id)
    }

    // Create knowledge items from WhatsApp FAQs
    const faqsToCreate = whatsappFaqs.length > 0 ? whatsappFaqs : []
    let createdCount = 0

    for (const faq of faqsToCreate) {
      try {
        await prisma.knowledgeItem.create({
          data: {
            title: faq.title || faq.titleHe || "שאלה",
            titleHe: faq.titleHe || faq.title,
            content: faq.content || faq.contentHe || "",
            contentHe: faq.contentHe || faq.content,
            type: faq.type || "faq",
            companyId: company.id,
            isActive: true,
          },
        })
        createdCount++
      } catch (e) {
        // Skip duplicates or errors
      }
    }

    return NextResponse.json({
      message: "Data seeded successfully from WhatsApp import",
      companyId: company.id,
      companyName: company.name,
      categories: categoriesToCreate.length,
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
      knowledgeItemsCount: whatsappFaqs.length || 0,
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
