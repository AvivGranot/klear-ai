import { NextRequest, NextResponse } from "next/server"
import { generateResponseStatic } from "@/lib/ai-static"

// Try to import prisma, but handle if it fails
let prisma: typeof import("@/lib/db").default | null = null
let generateResponse: typeof import("@/lib/ai").generateResponse | null = null

// Lazy load database dependencies
async function loadDbDependencies() {
  if (prisma === null) {
    try {
      const dbModule = await import("@/lib/db")
      prisma = dbModule.default
      const aiModule = await import("@/lib/ai")
      generateResponse = aiModule.generateResponse
    } catch (e) {
      console.log("Database not available, using static mode")
      prisma = null
      generateResponse = null
    }
  }
  return { prisma, generateResponse }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, companyId, userId, conversationId, conversationHistory: clientHistory } = body

    if (!message || !companyId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Try to load database dependencies
    const { prisma: db, generateResponse: dbGenerateResponse } = await loadDbDependencies()

    // If database is available, use full flow
    if (db && dbGenerateResponse) {
      try {
        // Get or create conversation
        let conversation
        if (conversationId) {
          conversation = await db.conversation.findUnique({
            where: { id: conversationId },
          })
        }

        if (!conversation) {
          conversation = await db.conversation.create({
            data: {
              userId,
              companyId,
              status: "active",
            },
          })
        }

        // Save user message
        await db.message.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            content: message,
            role: "user",
          },
        })

        // Get conversation history for context
        const history = await db.message.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: "asc" },
          take: 10,
        })

        const conversationHistory = history.slice(0, -1).map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))

        // Generate AI response
        const aiResponse = await dbGenerateResponse(
          message,
          companyId,
          conversationHistory
        )

        // Save assistant message
        const assistantMessage = await db.message.create({
          data: {
            conversationId: conversation.id,
            content: aiResponse.response,
            contentHe: aiResponse.responseHe,
            role: "assistant",
            knowledgeItemId: aiResponse.knowledgeItemId,
            confidence: aiResponse.confidence,
            mediaUrls: JSON.stringify(aiResponse.mediaUrls),
          },
        })

        // Update conversation
        await db.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        })

        // Log query for analytics
        await db.queryLog.create({
          data: {
            companyId,
            query: message,
            response: aiResponse.response,
            responseTime: Date.now(),
          },
        })

        return NextResponse.json({
          response: aiResponse.response,
          messageId: assistantMessage.id,
          conversationId: conversation.id,
          confidence: aiResponse.confidence,
          mediaUrls: aiResponse.mediaUrls,
          knowledgeItemId: aiResponse.knowledgeItemId,
        })
      } catch (dbError) {
        console.log("Database error, falling back to static mode:", dbError)
        // Fall through to static mode
      }
    }

    // Static mode - no database needed
    console.log("Using static AI mode for chat")

    // Use client-provided history or empty array
    const conversationHistory = clientHistory || []

    // Generate response using static knowledge base
    const aiResponse = await generateResponseStatic(message, conversationHistory)

    return NextResponse.json({
      response: aiResponse.responseHe || aiResponse.response,
      messageId: `static-${Date.now()}`,
      conversationId: conversationId || `static-conv-${Date.now()}`,
      confidence: aiResponse.confidence,
      mediaUrls: aiResponse.mediaUrls,
      knowledgeItemId: aiResponse.knowledgeItemId,
      isStaticMode: true,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    )
  }
}

// Get chat history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")
    const userId = searchParams.get("userId")

    if (!conversationId && !userId) {
      return NextResponse.json(
        { error: "Missing conversationId or userId" },
        { status: 400 }
      )
    }

    // Try to load database
    const { prisma: db } = await loadDbDependencies()

    // If no database, return empty results (static mode)
    if (!db) {
      return NextResponse.json({
        messages: [],
        conversations: [],
        isStaticMode: true,
      })
    }

    if (conversationId) {
      const messages = await db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        include: {
          knowledgeItem: {
            select: {
              id: true,
              title: true,
              titleHe: true,
            },
          },
        },
      })

      return NextResponse.json({ messages })
    }

    // Get all conversations for user
    const conversations = await db.conversation.findMany({
      where: { userId: userId! },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Chat GET error:", error)
    // Return empty in static mode on error
    return NextResponse.json({
      messages: [],
      conversations: [],
      isStaticMode: true,
    })
  }
}
