import { NextRequest, NextResponse } from "next/server"

// Mock knowledge items for demo mode
const MOCK_KNOWLEDGE_ITEMS = [
  {
    id: "ki-001",
    title: "Fuel Pump Emergency Shutdown",
    titleHe: "כיבוי חירום של משאבת דלק",
    content: "In case of emergency, press the big red button located near the cashier station.",
    contentHe: "במקרה חירום, לחץ על הכפתור האדום הגדול שנמצא ליד עמדת הקופאי.",
    type: "procedure",
    categoryId: "cat-001",
    companyId: "demo-company-001",
    isActive: true,
    viewCount: 45,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    category: { id: "cat-001", name: "Procedures", nameHe: "נהלים" },
    media: [],
  },
  {
    id: "ki-002",
    title: "Customer Refund Policy",
    titleHe: "מדיניות החזרים ללקוחות",
    content: "Refunds can be issued for prepaid fuel that was not pumped.",
    contentHe: "ניתן לבצע החזר כספי עבור דלק ששולם מראש ולא תודלק.",
    type: "policy",
    categoryId: "cat-002",
    companyId: "demo-company-001",
    isActive: true,
    viewCount: 32,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    category: { id: "cat-002", name: "Policies", nameHe: "מדיניות" },
    media: [],
  },
  {
    id: "ki-003",
    title: "Credit Card Machine Error",
    titleHe: "תקלה במכשיר כרטיסי אשראי",
    content: "If the credit card machine shows an error: 1. Restart the machine. 2. Wait 30 seconds.",
    contentHe: "אם מכשיר כרטיסי האשראי מציג שגיאה: 1. הפעל מחדש. 2. המתן 30 שניות.",
    type: "procedure",
    categoryId: "cat-001",
    companyId: "demo-company-001",
    isActive: true,
    viewCount: 78,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    category: { id: "cat-001", name: "Procedures", nameHe: "נהלים" },
    media: [],
  },
  {
    id: "ki-004",
    title: "Coffee Machine Cleaning",
    titleHe: "ניקוי מכונת קפה",
    content: "Clean coffee machine every 4 hours: Run cleaning cycle, wipe steam nozzle.",
    contentHe: "נקה מכונת קפה כל 4 שעות: הפעל מחזור ניקוי, נגב את פיית הקיטור.",
    type: "procedure",
    categoryId: "cat-001",
    companyId: "demo-company-001",
    isActive: true,
    viewCount: 56,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    category: { id: "cat-001", name: "Procedures", nameHe: "נהלים" },
    media: [],
  },
]

// Try to import Prisma, but handle gracefully if DB not available
let prisma: any = null
let indexKnowledgeItem: any = null

async function initDB() {
  if (prisma !== null) return prisma
  try {
    const db = await import("@/lib/db")
    prisma = db.default
    const ai = await import("@/lib/ai")
    indexKnowledgeItem = ai.indexKnowledgeItem
    await prisma.$connect()
    return prisma
  } catch (e) {
    console.log("Database not available, using mock data")
    prisma = false
    return null
  }
}

// Create knowledge item
export async function POST(request: NextRequest) {
  const db = await initDB()

  try {
    const body = await request.json()
    const {
      title,
      titleHe,
      content,
      contentHe,
      type,
      categoryId,
      companyId,
      tags,
    } = body

    if (!title || !content || !companyId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // If no database, return mock success
    if (!db) {
      return NextResponse.json({
        knowledgeItem: {
          id: `ki-${Date.now()}`,
          title,
          titleHe,
          content,
          contentHe,
          type: type || "document",
          categoryId,
          companyId,
          isActive: true,
          viewCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        mode: "demo"
      }, { status: 201 })
    }

    // Create knowledge item
    const knowledgeItem = await prisma.knowledgeItem.create({
      data: {
        title,
        titleHe,
        content,
        contentHe,
        type: type || "document",
        categoryId,
        companyId,
        tags: tags ? JSON.stringify(tags) : null,
      },
    })

    // Index the item for search (generate embeddings)
    if (indexKnowledgeItem) {
      try {
        await indexKnowledgeItem(knowledgeItem.id)
      } catch (indexError) {
        console.error("Failed to index knowledge item:", indexError)
      }
    }

    return NextResponse.json({ knowledgeItem }, { status: 201 })
  } catch (error) {
    console.error("Knowledge POST error:", error)
    return NextResponse.json(
      { error: "Failed to create knowledge item" },
      { status: 500 }
    )
  }
}

// Get knowledge items
export async function GET(request: NextRequest) {
  const db = await initDB()

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get("companyId")
  const categoryId = searchParams.get("categoryId")
  const type = searchParams.get("type")
  const search = searchParams.get("search")

  if (!companyId) {
    return NextResponse.json(
      { error: "Missing companyId" },
      { status: 400 }
    )
  }

  // If no database, return mock data
  if (!db) {
    let filtered = MOCK_KNOWLEDGE_ITEMS
    if (categoryId) {
      filtered = filtered.filter(k => k.categoryId === categoryId)
    }
    if (type) {
      filtered = filtered.filter(k => k.type === type)
    }
    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(k =>
        k.title.toLowerCase().includes(s) ||
        k.titleHe?.toLowerCase().includes(s) ||
        k.content.toLowerCase().includes(s) ||
        k.contentHe?.toLowerCase().includes(s)
      )
    }
    return NextResponse.json({ knowledgeItems: filtered, mode: "demo" })
  }

  try {
    const where: Record<string, unknown> = {
      companyId,
      isActive: true,
    }

    if (categoryId) where.categoryId = categoryId
    if (type) where.type = type

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleHe: { contains: search } },
        { content: { contains: search } },
        { contentHe: { contains: search } },
      ]
    }

    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameHe: true,
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            mimeType: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ knowledgeItems })
  } catch (error) {
    console.error("Knowledge GET error:", error)
    // Return mock data on error
    return NextResponse.json({ knowledgeItems: MOCK_KNOWLEDGE_ITEMS, mode: "demo" })
  }
}

// Update knowledge item
export async function PUT(request: NextRequest) {
  const db = await initDB()

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "Missing knowledge item id" },
        { status: 400 }
      )
    }

    // If no database, return mock success
    if (!db) {
      return NextResponse.json({
        knowledgeItem: { id, ...updates, updatedAt: new Date().toISOString() },
        mode: "demo"
      })
    }

    // Update the item
    const knowledgeItem = await prisma.knowledgeItem.update({
      where: { id },
      data: {
        ...updates,
        tags: updates.tags ? JSON.stringify(updates.tags) : undefined,
      },
    })

    // Re-index if content changed
    if (indexKnowledgeItem && (updates.title || updates.content || updates.titleHe || updates.contentHe)) {
      try {
        await indexKnowledgeItem(id)
      } catch (indexError) {
        console.error("Failed to re-index knowledge item:", indexError)
      }
    }

    return NextResponse.json({ knowledgeItem })
  } catch (error) {
    console.error("Knowledge PUT error:", error)
    return NextResponse.json(
      { error: "Failed to update knowledge item" },
      { status: 500 }
    )
  }
}

// Delete knowledge item
export async function DELETE(request: NextRequest) {
  const db = await initDB()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      { error: "Missing knowledge item id" },
      { status: 400 }
    )
  }

  // If no database, return mock success
  if (!db) {
    return NextResponse.json({ success: true, mode: "demo" })
  }

  try {
    // Soft delete
    await prisma.knowledgeItem.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Knowledge DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete knowledge item" },
      { status: 500 }
    )
  }
}
