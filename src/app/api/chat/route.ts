import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { generateResponse } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, companyId, userId, conversationId } = body

    if (!message || !companyId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      })
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          companyId,
          status: "active",
        },
      })
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: message,
        role: "user",
      },
    })

    // Get conversation history for context
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 10,
    })

    const conversationHistory = history.slice(0, -1).map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    // Generate AI response
    const aiResponse = await generateResponse(
      message,
      companyId,
      conversationHistory
    )

    // Save assistant message
    const assistantMessage = await prisma.message.create({
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
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    // Log query for analytics
    await prisma.queryLog.create({
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

    if (conversationId) {
      const messages = await prisma.message.findMany({
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
    const conversations = await prisma.conversation.findMany({
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
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}
