import { NextRequest, NextResponse } from "next/server"

// Mock data for demo mode
const MOCK_CONVERSATIONS = [
  {
    id: "conv-001",
    userId: "user-002",
    companyId: "demo-company-001",
    status: "resolved",
    rating: 5,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3000000).toISOString(),
    user: {
      id: "user-002",
      name: "דני העובד",
      phone: "050-0000002",
      avatarUrl: null,
    },
    messages: [{
      id: "msg-001",
      content: "איך מכבים משאבת דלק בחירום?",
      role: "user",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      confidence: null,
    }],
    _count: { messages: 4 },
  },
  {
    id: "conv-002",
    userId: "user-003",
    companyId: "demo-company-001",
    status: "active",
    rating: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 6000000).toISOString(),
    user: {
      id: "user-003",
      name: "שרה לוי",
      phone: "052-9876543",
      avatarUrl: null,
    },
    messages: [{
      id: "msg-002",
      content: "מה מדיניות ההחזרים?",
      role: "user",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      confidence: null,
    }],
    _count: { messages: 2 },
  },
  {
    id: "conv-003",
    userId: "user-002",
    companyId: "demo-company-001",
    status: "pending_review",
    rating: 3,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 80000000).toISOString(),
    user: {
      id: "user-002",
      name: "דני העובד",
      phone: "050-0000002",
      avatarUrl: null,
    },
    messages: [{
      id: "msg-003",
      content: "איך מנקים את מכונת הקפה?",
      role: "user",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      confidence: 0.75,
    }],
    _count: { messages: 6 },
  },
]

// Try to import Prisma, but handle gracefully if DB not available
let prisma: any = null

async function initDB() {
  if (prisma !== null) return prisma
  try {
    const db = await import("@/lib/prisma")
    prisma = db.default
    await prisma.$connect()
    return prisma
  } catch (e) {
    console.log("Database not available, using mock data")
    prisma = false
    return null
  }
}

// Get all conversations (for manager dashboard)
export async function GET(request: NextRequest) {
  const db = await initDB()

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get("companyId")
  const status = searchParams.get("status")
  const limit = parseInt(searchParams.get("limit") || "50")
  const offset = parseInt(searchParams.get("offset") || "0")

  if (!companyId) {
    return NextResponse.json(
      { error: "Missing companyId" },
      { status: 400 }
    )
  }

  // If no database, return mock data
  if (!db) {
    let filtered = MOCK_CONVERSATIONS
    if (status) {
      filtered = filtered.filter(c => c.status === status)
    }
    const paginated = filtered.slice(offset, offset + limit)
    return NextResponse.json({
      conversations: paginated,
      total: filtered.length,
      hasMore: offset + paginated.length < filtered.length,
      mode: "demo"
    })
  }

  try {
    const where: Record<string, unknown> = { companyId }
    if (status) where.status = status

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatarUrl: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              content: true,
              role: true,
              createdAt: true,
              confidence: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.conversation.count({ where }),
    ])

    return NextResponse.json({
      conversations,
      total,
      hasMore: offset + conversations.length < total,
    })
  } catch (error) {
    console.error("Conversations GET error:", error)
    // Return mock data on error
    return NextResponse.json({
      conversations: MOCK_CONVERSATIONS.slice(offset, offset + limit),
      total: MOCK_CONVERSATIONS.length,
      hasMore: false,
      mode: "demo"
    })
  }
}

// Get single conversation with all messages
export async function POST(request: NextRequest) {
  const db = await initDB()

  try {
    const body = await request.json()
    const { conversationId } = body

    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId" },
        { status: 400 }
      )
    }

    // If no database, return mock data
    if (!db) {
      const conv = MOCK_CONVERSATIONS.find(c => c.id === conversationId)
      if (!conv) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
      }
      return NextResponse.json({
        conversation: {
          ...conv,
          messages: [
            { id: "m1", content: conv.messages[0].content, role: "user", createdAt: conv.createdAt },
            { id: "m2", content: "הנה המידע שביקשת מהמאגר שלנו...", role: "assistant", createdAt: conv.updatedAt, confidence: 0.95 },
          ]
        },
        mode: "demo"
      })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            knowledgeItem: {
              select: {
                id: true,
                title: true,
                titleHe: true,
              },
            },
            corrections: {
              include: {
                manager: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Conversation detail error:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    )
  }
}

// Update conversation status
export async function PUT(request: NextRequest) {
  const db = await initDB()

  try {
    const body = await request.json()
    const { conversationId, status, rating } = body

    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId" },
        { status: 400 }
      )
    }

    // If no database, return success with mock response
    if (!db) {
      return NextResponse.json({
        conversation: { id: conversationId, status, rating },
        mode: "demo"
      })
    }

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(status && { status }),
        ...(rating !== undefined && { rating }),
      },
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Conversation PUT error:", error)
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    )
  }
}
