/**
 * Database Seed Script
 * Creates initial data for development and demo purposes
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Password hashing function using bcrypt (12 rounds)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('🌱 Seeding database...')

  // Create Jolika Chocolate company
  const jolika = await prisma.company.upsert({
    where: { slug: 'jolika-chocolate' },
    update: {},
    create: {
      name: "ג'וליקה שוקולד",
      slug: 'jolika-chocolate',
      industry: 'food',
      primaryColor: '#25D366',
      welcomeMessage: 'שלום! אני הבוט של ג\'וליקה שוקולד 🍫 איך אוכל לעזור לך היום?',
      botName: "בוט ג'וליקה",
      timezone: 'Asia/Jerusalem',
      language: 'he',
    },
  })

  console.log('✅ Created company:', jolika.name)

  // Create subscription for Jolika
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 14)

  await prisma.subscription.upsert({
    where: { companyId: jolika.id },
    update: {},
    create: {
      companyId: jolika.id,
      plan: 'BUSINESS',
      status: 'ACTIVE',
      maxUsers: 50,
      maxKnowledgeItems: 1000,
      maxQueriesPerMonth: 10000,
      currentUsers: 3,
      currentKnowledge: 28,
      queriesThisMonth: 470,
    },
  })

  console.log('✅ Created subscription for', jolika.name)

  // Create admin user (single internal login)
  const adminPassword = await hashPassword('12345678')
  const admin = await prisma.user.upsert({
    where: { email: 'hello@klear.ai' },
    update: {},
    create: {
      email: 'hello@klear.ai',
      name: 'Klear Admin',
      passwordHash: adminPassword,
      role: 'owner',
      companyId: jolika.id,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Created admin user:', admin.email)

  // Create categories
  const categories = [
    { name: 'שעות פעילות', nameHe: 'שעות פעילות', icon: '🕐', order: 0 },
    { name: 'מוצרים', nameHe: 'מוצרים', icon: '🍫', order: 1 },
    { name: 'הזמנות', nameHe: 'הזמנות', icon: '📦', order: 2 },
    { name: 'תשלומים', nameHe: 'תשלומים', icon: '💳', order: 3 },
    { name: 'משלוחים', nameHe: 'משלוחים', icon: '🚚', order: 4 },
    { name: 'כללי', nameHe: 'כללי', icon: '📋', order: 5 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name_companyId: { name: cat.name, companyId: jolika.id } },
      update: {},
      create: {
        ...cat,
        companyId: jolika.id,
      },
    })
  }

  console.log('✅ Created categories')

  // Create some knowledge items (using upsert to avoid duplicates on re-runs)
  const knowledgeItems = [
    {
      title: 'שעות פעילות החנות',
      content: 'החנות פתוחה בימים א-ה בין השעות 09:00-18:00, ביום שישי 09:00-14:00. בשבת סגור.',
      type: 'faq',
    },
    {
      title: 'משלוחים',
      content: 'משלוחים לכל הארץ! משלוח חינם בהזמנה מעל 200₪. משלוח רגיל עד 3 ימי עסקים, משלוח מהיר תוך יום עסקים.',
      type: 'faq',
    },
    {
      title: 'החזרות והחלפות',
      content: 'ניתן להחזיר או להחליף מוצרים תוך 14 יום מיום הקנייה. המוצר חייב להיות באריזה מקורית.',
      type: 'policy',
    },
    {
      title: 'אמצעי תשלום',
      content: 'אנחנו מקבלים כרטיסי אשראי, ביט, PayPal ומזומן בחנות.',
      type: 'faq',
    },
    {
      title: 'הזמנות מיוחדות',
      content: 'להזמנות מיוחדות (אירועים, מתנות לחברות) יש ליצור קשר עם שלי בטלפון או במייל.',
      type: 'procedure',
    },
  ]

  // Check if knowledge items already exist for this company
  const existingItems = await prisma.knowledgeItem.count({
    where: { companyId: jolika.id }
  })

  if (existingItems === 0) {
    for (const item of knowledgeItems) {
      await prisma.knowledgeItem.create({
        data: {
          ...item,
          companyId: jolika.id,
          isActive: true,
        },
      })
    }
    console.log('✅ Created knowledge items')
  } else {
    console.log('⏭️ Knowledge items already exist, skipping')
  }

  console.log('')
  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('📝 Login credentials:')
  console.log('   Email: hello@klear.ai')
  console.log('   Password: 12345678')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
