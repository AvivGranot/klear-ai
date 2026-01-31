/**
 * Database Seed Script
 * Creates initial data for development and demo purposes
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Password hashing function (same as in auth/index.ts)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
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

  // Create admin user
  const adminPassword = hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jolika.co.il' },
    update: {},
    create: {
      email: 'admin@jolika.co.il',
      name: 'מנהל ג\'וליקה',
      passwordHash: adminPassword,
      role: 'owner',
      companyId: jolika.id,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Created admin user:', admin.email)

  // Create manager user
  const managerPassword = hashPassword('manager123')
  const manager = await prisma.user.upsert({
    where: { email: 'manager@jolika.co.il' },
    update: {},
    create: {
      email: 'manager@jolika.co.il',
      name: 'שלי',
      passwordHash: managerPassword,
      role: 'manager',
      companyId: jolika.id,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Created manager user:', manager.email)

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

  // Create some knowledge items
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

  // Create a demo company for testing
  const demoCompany = await prisma.company.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      industry: 'technology',
      primaryColor: '#3B82F6',
      welcomeMessage: 'Hello! I\'m the Demo Company AI assistant. How can I help you today?',
      botName: 'Demo AI',
      timezone: 'UTC',
      language: 'en',
    },
  })

  // Create trial subscription for demo
  await prisma.subscription.upsert({
    where: { companyId: demoCompany.id },
    update: {},
    create: {
      companyId: demoCompany.id,
      plan: 'STARTER',
      status: 'TRIAL',
      maxUsers: 10,
      maxKnowledgeItems: 100,
      maxQueriesPerMonth: 1000,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  })

  const demoPassword = hashPassword('demo123')
  await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash: demoPassword,
      role: 'owner',
      companyId: demoCompany.id,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Created demo company')

  console.log('')
  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('📝 Login credentials:')
  console.log('   Jolika Admin: admin@jolika.co.il / admin123')
  console.log('   Jolika Manager: manager@jolika.co.il / manager123')
  console.log('   Demo User: demo@example.com / demo123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
