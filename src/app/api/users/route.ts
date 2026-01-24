import { NextRequest, NextResponse } from "next/server"

// Mock users for demo mode
const MOCK_USERS = [
  {
    id: "user-001",
    phone: "050-0000001",
    name: "יוסי המנהל",
    role: "manager",
    avatarUrl: null,
    companyId: "demo-company-001",
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    company: { id: "demo-company-001", name: "תחנות דלק דמו", logo: null },
  },
  {
    id: "user-002",
    phone: "050-0000002",
    name: "דני העובד",
    role: "employee",
    avatarUrl: null,
    companyId: "demo-company-001",
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    company: { id: "demo-company-001", name: "תחנות דלק דמו", logo: null },
  },
  {
    id: "user-003",
    phone: "052-9876543",
    name: "שרה לוי",
    role: "employee",
    avatarUrl: null,
    companyId: "demo-company-001",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    company: { id: "demo-company-001", name: "תחנות דלק דמו", logo: null },
  },
]

// Try to import Prisma, but handle gracefully if DB not available
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

// Create user
export async function POST(request: NextRequest) {
  const db = await initDB()

  try {
    const body = await request.json()
    const { phone, name, role, companyId, avatarUrl } = body

    if (!phone || !name || !companyId) {
      return NextResponse.json(
        { error: "Missing required fields (phone, name, companyId)" },
        { status: 400 }
      )
    }

    // If no database, return mock success
    if (!db) {
      const existingUser = MOCK_USERS.find(u => u.phone === phone)
      if (existingUser) {
        return NextResponse.json({ user: existingUser, mode: "demo" })
      }
      return NextResponse.json({
        user: {
          id: `user-${Date.now()}`,
          phone,
          name,
          role: role || "employee",
          companyId,
          avatarUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        mode: "demo"
      }, { status: 201 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    })

    if (existingUser) {
      return NextResponse.json({ user: existingUser })
    }

    const user = await prisma.user.create({
      data: {
        phone,
        name,
        role: role || "employee",
        companyId,
        avatarUrl,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("User POST error:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}

// Get users
export async function GET(request: NextRequest) {
  const db = await initDB()

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get("companyId")
  const phone = searchParams.get("phone")
  const id = searchParams.get("id")

  // If no database, return mock data
  if (!db) {
    if (id) {
      const user = MOCK_USERS.find(u => u.id === id)
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      return NextResponse.json({ user, mode: "demo" })
    }

    if (phone) {
      const user = MOCK_USERS.find(u => u.phone === phone)
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      return NextResponse.json({ user, mode: "demo" })
    }

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 })
    }

    return NextResponse.json({
      users: MOCK_USERS.filter(u => u.companyId === companyId),
      mode: "demo"
    })
  }

  try {
    if (id) {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({ user })
    }

    if (phone) {
      const user = await prisma.user.findUnique({
        where: { phone },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({ user })
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing companyId" },
        { status: 400 }
      )
    }

    const users = await prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("User GET error:", error)
    // Return mock data on error
    return NextResponse.json({ users: MOCK_USERS, mode: "demo" })
  }
}

// Update user
export async function PUT(request: NextRequest) {
  const db = await initDB()

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "Missing user id" },
        { status: 400 }
      )
    }

    // If no database, return mock success
    if (!db) {
      return NextResponse.json({
        user: { id, ...updates, updatedAt: new Date().toISOString() },
        mode: "demo"
      })
    }

    const user = await prisma.user.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("User PUT error:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

// Delete user
export async function DELETE(request: NextRequest) {
  const db = await initDB()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      { error: "Missing user id" },
      { status: 400 }
    )
  }

  // If no database, return mock success
  if (!db) {
    return NextResponse.json({
      success: true,
      deletedId: id,
      mode: "demo"
    })
  }

  try {
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, deletedId: id })
  } catch (error) {
    console.error("User DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
