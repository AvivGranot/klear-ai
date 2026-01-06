import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// Create answer correction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, managerId, correctedContent, reason, shouldLearn } = body

    if (!messageId || !managerId || !correctedContent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get original message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      )
    }

    if (message.role !== "assistant") {
      return NextResponse.json(
        { error: "Can only correct assistant messages" },
        { status: 400 }
      )
    }

    // Create correction record
    const correction = await prisma.answerCorrection.create({
      data: {
        messageId,
        managerId,
        originalContent: message.content,
        correctedContent,
        reason,
        shouldLearn: shouldLearn ?? true,
      },
    })

    // Update the message as edited
    await prisma.message.update({
      where: { id: messageId },
      data: {
        content: correctedContent,
        isEdited: true,
        editedAt: new Date(),
      },
    })

    // If shouldLearn, we could add this to the knowledge base
    // For MVP, we just record it

    return NextResponse.json({ correction }, { status: 201 })
  } catch (error) {
    console.error("Correction POST error:", error)
    return NextResponse.json(
      { error: "Failed to create correction" },
      { status: 500 }
    )
  }
}

// Get corrections for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const messageId = searchParams.get("messageId")

    if (!companyId && !messageId) {
      return NextResponse.json(
        { error: "Missing companyId or messageId" },
        { status: 400 }
      )
    }

    if (messageId) {
      const corrections = await prisma.answerCorrection.findMany({
        where: { messageId },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json({ corrections })
    }

    // Get all corrections for company (via messages)
    const corrections = await prisma.answerCorrection.findMany({
      where: {
        message: {
          conversation: {
            companyId: companyId!,
          },
        },
      },
      include: {
        message: {
          select: {
            id: true,
            conversationId: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ corrections })
  } catch (error) {
    console.error("Correction GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch corrections" },
      { status: 500 }
    )
  }
}
