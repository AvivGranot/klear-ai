import { NextResponse } from "next/server"

// Demo data - used when database is not available (e.g., on Vercel without cloud DB)
const MOCK_COMPANY = {
  id: "demo-company-001",
  name: "תחנות דלק דמו",
  industry: "gas_station",
}

const MOCK_USERS = [
  { id: "user-001", name: "יוסי המנהל", role: "manager", phone: "050-0000001" },
  { id: "user-002", name: "דני העובד", role: "employee", phone: "050-0000002" },
  { id: "user-003", name: "שרה לוי", role: "employee", phone: "052-9876543" },
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
    // Test connection
    await prisma.$connect()
    return prisma
  } catch (e) {
    console.log("Database not available, using mock data")
    prisma = false
    return null
  }
}

// Demo data for gas station knowledge base
const demoKnowledgeItems = [
  {
    title: "Fuel Pump Emergency Shutdown",
    titleHe: "כיבוי חירום של משאבת דלק",
    content: "In case of emergency, press the big red button located near the cashier station. This will immediately shut down all fuel pumps.",
    contentHe: "במקרה חירום, לחץ על הכפתור האדום הגדול שנמצא ליד עמדת הקופאי. פעולה זו תכבה מיידית את כל משאבות הדלק.",
    type: "procedure",
  },
  {
    title: "Customer Refund Policy",
    titleHe: "מדיניות החזרים ללקוחות",
    content: "Refunds can be issued for prepaid fuel that was not pumped. The customer must present the receipt. Refunds over 200 NIS require manager approval.",
    contentHe: "ניתן לבצע החזר כספי עבור דלק ששולם מראש ולא תודלק. הלקוח חייב להציג קבלה. החזרים מעל 200 ש״ח דורשים אישור מנהל.",
    type: "policy",
  },
  {
    title: "Credit Card Machine Error",
    titleHe: "תקלה במכשיר כרטיסי אשראי",
    content: "If the credit card machine shows an error: 1. Restart the machine using the power button. 2. Wait 30 seconds. 3. If the problem persists, call technical support at *2345.",
    contentHe: "אם מכשיר כרטיסי האשראי מציג שגיאה: 1. הפעל מחדש את המכשיר באמצעות כפתור ההפעלה. 2. המתן 30 שניות. 3. אם הבעיה נמשכת, התקשר לתמיכה טכנית *2345.",
    type: "procedure",
  },
  {
    title: "Shift Handover Checklist",
    titleHe: "רשימת מעבר משמרת",
    content: "Before ending your shift: 1. Count cash register. 2. Check fuel levels. 3. Clean work area. 4. Log any incidents. 5. Brief the next employee.",
    contentHe: "לפני סיום משמרת: 1. ספור קופה רושמת. 2. בדוק מפלסי דלק. 3. נקה את אזור העבודה. 4. תעד כל אירוע חריג. 5. תדרך את העובד הבא.",
    type: "procedure",
  },
  {
    title: "Handling Suspicious Activity",
    titleHe: "טיפול בפעילות חשודה",
    content: "If you notice suspicious activity: 1. Do not confront the person. 2. Activate the silent alarm. 3. Remember details (appearance, vehicle). 4. Call security at *1234.",
    contentHe: "אם אתה מבחין בפעילות חשודה: 1. אל תתעמת עם האדם. 2. הפעל את האזעקה השקטה. 3. זכור פרטים (מראה, רכב). 4. התקשר לאבטחה *1234.",
    type: "policy",
  },
  {
    title: "Daily Store Opening Procedure",
    titleHe: "נוהל פתיחת חנות יומי",
    content: "1. Disarm security system (code: ask manager). 2. Turn on all lights. 3. Check refrigerators temperature. 4. Verify cash register float. 5. Unlock fuel pumps. 6. Check expiration dates on products.",
    contentHe: "1. בטל מערכת אבטחה (קוד: שאל מנהל). 2. הדלק את כל האורות. 3. בדוק טמפרטורת מקררים. 4. ודא קופה קטנה. 5. שחרר משאבות דלק. 6. בדוק תוקף על מוצרים.",
    type: "procedure",
  },
  {
    title: "Coffee Machine Cleaning",
    titleHe: "ניקוי מכונת קפה",
    content: "Clean coffee machine every 4 hours: 1. Run cleaning cycle. 2. Wipe steam nozzle. 3. Empty drip tray. 4. Refill beans and milk if needed.",
    contentHe: "נקה מכונת קפה כל 4 שעות: 1. הפעל מחזור ניקוי. 2. נגב את פיית הקיטור. 3. רוקן מגש טפטוף. 4. מלא פולי קפה וחלב לפי הצורך.",
    type: "procedure",
  },
  {
    title: "Handling Wrong Fuel Type",
    titleHe: "טיפול בתדלוק סוג דלק שגוי",
    content: "If a customer pumps wrong fuel: 1. STOP pumping immediately. 2. Do NOT start the engine. 3. Call our towing service. 4. Document the incident. 5. Manager must be notified.",
    contentHe: "אם לקוח תידלק סוג דלק שגוי: 1. הפסק תדלוק מיידית. 2. אל תתניע את המנוע. 3. התקשר לשירות הגרירה שלנו. 4. תעד את האירוע. 5. יש לעדכן מנהל.",
    type: "procedure",
  },
]

export async function POST() {
  const db = await initDB()

  // If no database, return mock data
  if (!db) {
    return NextResponse.json({
      message: "Demo mode - using mock data (no database)",
      companyId: MOCK_COMPANY.id,
      companyName: MOCK_COMPANY.name,
      users: MOCK_USERS,
      knowledgeItems: demoKnowledgeItems.length,
      mode: "demo"
    }, { status: 201 })
  }

  try {
    // Check if data already exists
    const existingCompany = await prisma.company.findFirst()
    if (existingCompany) {
      return NextResponse.json({
        message: "Demo data already exists",
        companyId: existingCompany.id,
      })
    }

    // Create demo company
    const company = await prisma.company.create({
      data: {
        name: "תחנות דלק דמו",
        industry: "gas_station",
      },
    })

    // Create demo manager
    const manager = await prisma.user.create({
      data: {
        phone: "050-0000001",
        name: "יוסי המנהל",
        role: "manager",
        companyId: company.id,
      },
    })

    // Create demo employee
    const employee = await prisma.user.create({
      data: {
        phone: "050-0000002",
        name: "דני העובד",
        role: "employee",
        companyId: company.id,
      },
    })

    // Create categories
    const procedures = await prisma.category.create({
      data: {
        name: "Procedures",
        nameHe: "נהלים",
        companyId: company.id,
      },
    })

    const policies = await prisma.category.create({
      data: {
        name: "Policies",
        nameHe: "מדיניות",
        companyId: company.id,
      },
    })

    // Create knowledge items
    const createdItems = []
    for (const item of demoKnowledgeItems) {
      const knowledgeItem = await prisma.knowledgeItem.create({
        data: {
          ...item,
          companyId: company.id,
          categoryId: item.type === "procedure" ? procedures.id : policies.id,
        },
      })
      createdItems.push(knowledgeItem)

      // Index the item (generate embeddings)
      if (indexKnowledgeItem) {
        try {
          await indexKnowledgeItem(knowledgeItem.id)
        } catch (e) {
          console.error(`Failed to index item ${knowledgeItem.id}:`, e)
        }
      }
    }

    return NextResponse.json({
      message: "Demo data created successfully",
      companyId: company.id,
      managerId: manager.id,
      employeeId: employee.id,
      knowledgeItems: createdItems.length,
    }, { status: 201 })
  } catch (error) {
    console.error("Seed error:", error)
    // Return mock data on error
    return NextResponse.json({
      message: "Demo mode - database error, using mock data",
      companyId: MOCK_COMPANY.id,
      companyName: MOCK_COMPANY.name,
      users: MOCK_USERS,
      knowledgeItems: demoKnowledgeItems.length,
      mode: "demo",
      error: String(error)
    }, { status: 200 })
  }
}

export async function GET() {
  const db = await initDB()

  // If no database, return mock data
  if (!db) {
    return NextResponse.json({
      seeded: true,
      companyId: MOCK_COMPANY.id,
      companyName: MOCK_COMPANY.name,
      users: MOCK_USERS,
      knowledgeItemsCount: demoKnowledgeItems.length,
      mode: "demo"
    })
  }

  try {
    // Return existing demo data info
    const company = await prisma.company.findFirst()

    if (!company) {
      return NextResponse.json({
        seeded: true, // Return true with mock data for demo
        companyId: MOCK_COMPANY.id,
        companyName: MOCK_COMPANY.name,
        users: MOCK_USERS,
        knowledgeItemsCount: demoKnowledgeItems.length,
        mode: "demo"
      })
    }

    const [users, knowledgeItems] = await Promise.all([
      prisma.user.findMany({ where: { companyId: company.id } }),
      prisma.knowledgeItem.count({ where: { companyId: company.id } }),
    ])

    return NextResponse.json({
      seeded: true,
      companyId: company.id,
      companyName: company.name,
      users: users.map((u: any) => ({ id: u.id, name: u.name, role: u.role })),
      knowledgeItemsCount: knowledgeItems,
    })
  } catch (error) {
    // Return mock data on error
    return NextResponse.json({
      seeded: true,
      companyId: MOCK_COMPANY.id,
      companyName: MOCK_COMPANY.name,
      users: MOCK_USERS,
      knowledgeItemsCount: demoKnowledgeItems.length,
      mode: "demo"
    })
  }
}
