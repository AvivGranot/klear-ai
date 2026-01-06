import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import prisma from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const companyId = formData.get("companyId") as string
    const knowledgeItemId = formData.get("knowledgeItemId") as string | null

    if (!file || !companyId) {
      return NextResponse.json(
        { error: "Missing file or companyId" },
        { status: 400 }
      )
    }

    // Get file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const ext = file.name.split(".").pop() || "bin"
    const filename = `${uuidv4()}.${ext}`

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", companyId)
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Create database record
    const mediaItem = await prisma.mediaItem.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: `/uploads/${companyId}/${filename}`,
        companyId,
        knowledgeItemId,
      },
    })

    return NextResponse.json({
      mediaItem,
      url: mediaItem.url,
    }, { status: 201 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}

// Get media items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const knowledgeItemId = searchParams.get("knowledgeItemId")

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing companyId" },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { companyId }
    if (knowledgeItemId) where.knowledgeItemId = knowledgeItemId

    const mediaItems = await prisma.mediaItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ mediaItems })
  } catch (error) {
    console.error("Media GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch media items" },
      { status: 500 }
    )
  }
}
