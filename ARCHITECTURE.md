# Klear AI Multi-Tenant SaaS Architecture

## Vision (Brian Chesky Style)

> "Every business deserves an AI assistant that knows their world deeply."

Klear AI transforms internal communications by giving every employee instant access to company knowledge. Like Airbnb created trust between strangers, we create trust between employees and AI - making every question answered correctly, every time.

---

## Core Principles

### 1. **Belong Anywhere** → **Know Everything**
Each subscription gets a completely isolated, personalized experience. An employee at Jolika Chocolate sees chocolate knowledge. An employee at a gas station sees fuel procedures. Same platform, infinite contexts.

### 2. **End-to-End Experience**
From the moment a manager signs up to when their 100th employee asks their 1000th question - every touchpoint is designed.

### 3. **Trust Through Transparency**
Employees trust the AI because managers curate it. Managers trust the AI because they see exactly what it learns.

---

## Architecture Overview (Boris Cherny Style)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           KLEAR AI PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    AUTHENTICATION LAYER                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │  │
│  │  │   NextAuth  │  │   Magic     │  │    WhatsApp Phone       │  │  │
│  │  │   (Email)   │  │   Links     │  │    Verification         │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    TENANT CONTEXT LAYER                          │  │
│  │                                                                   │  │
│  │   TenantContext = { companyId, userId, role, subscription }     │  │
│  │                                                                   │  │
│  │   Every request, every query, every response is scoped          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│         ┌──────────────────────────┼──────────────────────────┐        │
│         ▼                          ▼                          ▼        │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐    │
│  │  DASHBOARD  │          │   CHAT API  │          │  WHATSAPP   │    │
│  │   (Web)     │          │   (REST)    │          │   (Bot)     │    │
│  └─────────────┘          └─────────────┘          └─────────────┘    │
│         │                          │                          │        │
│         └──────────────────────────┼──────────────────────────┘        │
│                                    ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    DATA ACCESS LAYER                              │  │
│  │                                                                   │  │
│  │   TenantAwarePrisma.conversation.findMany({                      │  │
│  │     where: { companyId: ctx.companyId }  // Auto-injected        │  │
│  │   })                                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         DATABASE                                  │  │
│  │                                                                   │  │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │  │
│  │   │ Jolika  │  │  Paz    │  │ Sonol   │  │  ...    │           │  │
│  │   │ Company │  │ Company │  │ Company │  │ Tenants │           │  │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Subscription (New - Billing & Features)

```prisma
model Subscription {
  id                String   @id @default(cuid())
  companyId         String   @unique
  company           Company  @relation(fields: [companyId], references: [id])

  // Plan Details
  plan              Plan     @default(STARTER)
  status            SubscriptionStatus @default(TRIAL)

  // Limits
  maxUsers          Int      @default(10)
  maxKnowledgeItems Int      @default(100)
  maxQueriesPerMonth Int     @default(1000)

  // Usage Tracking
  currentUsers      Int      @default(0)
  currentKnowledge  Int      @default(0)
  queriesThisMonth  Int      @default(0)

  // Billing
  stripeCustomerId  String?
  stripeSubId       String?

  // Dates
  trialEndsAt       DateTime?
  currentPeriodEnd  DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum Plan {
  STARTER     // 10 users, 100 KB items, 1K queries
  GROWTH      // 50 users, 500 KB items, 10K queries
  BUSINESS    // 200 users, unlimited KB, 50K queries
  ENTERPRISE  // Unlimited everything
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELED
  PAUSED
}
```

### Company (Enhanced)

```prisma
model Company {
  id            String   @id @default(cuid())

  // Identity
  name          String
  slug          String   @unique  // URL-safe identifier
  logo          String?
  industry      String?

  // Branding
  primaryColor  String   @default("#25D366")
  welcomeMessage String?

  // Settings
  timezone      String   @default("Asia/Jerusalem")
  language      String   @default("he")

  // Relations
  subscription  Subscription?
  users         User[]
  knowledge     KnowledgeItem[]
  conversations Conversation[]
  escalations   Escalation[]
  whatsappConfig WhatsAppConfig?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### User (Enhanced with Auth)

```prisma
model User {
  id            String   @id @default(cuid())

  // Authentication
  email         String?  @unique
  phone         String?  @unique
  passwordHash  String?

  // Profile
  name          String
  avatarUrl     String?

  // Authorization
  role          Role     @default(EMPLOYEE)
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id])

  // Status
  isActive      Boolean  @default(true)
  lastLoginAt   DateTime?

  // Sessions & Activity
  sessions      Session[]
  conversations Conversation[]
  corrections   AnswerCorrection[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([phone, companyId])
  @@index([companyId, role])
}

enum Role {
  EMPLOYEE
  MANAGER
  ADMIN
  OWNER
}
```

### Session (Auth Sessions)

```prisma
model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Token
  token        String   @unique

  // Context
  userAgent    String?
  ipAddress    String?

  // Validity
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  @@index([token])
  @@index([userId])
}
```

---

## Authentication Flows

### Flow 1: Manager Dashboard Login

```
┌─────────────────────────────────────────────────────────────────┐
│                    MANAGER LOGIN FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Manager visits: klear-ai.com/login                          │
│                          │                                       │
│                          ▼                                       │
│  2. Enters email: manager@jolika.com                            │
│                          │                                       │
│                          ▼                                       │
│  3. System sends magic link to email                            │
│     "Click to login to Klear AI"                                │
│                          │                                       │
│                          ▼                                       │
│  4. Manager clicks link → validates token                        │
│                          │                                       │
│                          ▼                                       │
│  5. System looks up user → gets companyId                       │
│                          │                                       │
│                          ▼                                       │
│  6. Creates session → sets cookie                                │
│                          │                                       │
│                          ▼                                       │
│  7. Redirects to: /dashboard                                     │
│     (Company context auto-loaded from session)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Employee Chat Access

```
┌─────────────────────────────────────────────────────────────────┐
│                   EMPLOYEE CHAT FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option A: Direct Link (from manager)                            │
│  ────────────────────────────────────                           │
│  1. Employee receives link: klear-ai.com/chat/jolika            │
│                          │                                       │
│                          ▼                                       │
│  2. Opens chat interface (no login needed)                       │
│                          │                                       │
│                          ▼                                       │
│  3. First message → create anonymous session                     │
│     (linked to companyId from URL slug)                          │
│                                                                  │
│  Option B: WhatsApp Integration                                  │
│  ─────────────────────────────────                              │
│  1. Employee sends message to company WhatsApp number           │
│                          │                                       │
│                          ▼                                       │
│  2. Webhook receives → extracts phone number                     │
│                          │                                       │
│                          ▼                                       │
│  3. Lookup phone → company mapping (from onboarding)            │
│                          │                                       │
│                          ▼                                       │
│  4. Route to correct company's knowledge base                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 3: New Company Signup

```
┌─────────────────────────────────────────────────────────────────┐
│                   NEW COMPANY SIGNUP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Visit: klear-ai.com/pricing → Select plan                   │
│                          │                                       │
│                          ▼                                       │
│  2. Signup form:                                                 │
│     - Company name: "פז תחנות דלק"                              │
│     - Your name: "יוסי כהן"                                      │
│     - Email: yossi@paz.co.il                                    │
│     - Phone (optional): 054-1234567                             │
│                          │                                       │
│                          ▼                                       │
│  3. System creates:                                              │
│     - Company record (slug: "paz-stations")                     │
│     - Subscription (14-day trial)                                │
│     - Owner user (role: OWNER)                                   │
│     - Session → auto-login                                       │
│                          │                                       │
│                          ▼                                       │
│  4. Redirect to: /dashboard/onboarding                          │
│     - Upload existing docs                                       │
│     - Set up WhatsApp number                                     │
│     - Invite team members                                        │
│                          │                                       │
│                          ▼                                       │
│  5. Dashboard ready at: klear-ai.com/dashboard                  │
│     Employee chat at: klear-ai.com/chat/paz-stations            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Design

### Authentication Middleware

```typescript
// src/lib/auth/middleware.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getTenantContext } from './session'

export type TenantContext = {
  userId: string
  companyId: string
  role: Role
  subscription: {
    plan: Plan
    status: SubscriptionStatus
    limits: {
      maxUsers: number
      maxKnowledge: number
      maxQueries: number
    }
    usage: {
      users: number
      knowledge: number
      queriesThisMonth: number
    }
  }
}

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, ctx: TenantContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = request.cookies.get('session')?.value

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const ctx = await getTenantContext(token)

  if (!ctx) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }

  // Check subscription status
  if (ctx.subscription.status === 'CANCELED') {
    return NextResponse.json(
      { error: 'Subscription canceled', code: 'SUBSCRIPTION_CANCELED' },
      { status: 403 }
    )
  }

  return handler(request, ctx)
}

export function withRole(allowedRoles: Role[]) {
  return async function(
    request: NextRequest,
    ctx: TenantContext,
    handler: (req: NextRequest, ctx: TenantContext) => Promise<NextResponse>
  ): Promise<NextResponse> {
    if (!allowedRoles.includes(ctx.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    return handler(request, ctx)
  }
}
```

### Tenant-Aware Database Queries

```typescript
// src/lib/db/tenant-prisma.ts

import { PrismaClient } from '@prisma/client'
import { TenantContext } from '../auth/middleware'

export function createTenantPrisma(ctx: TenantContext) {
  const prisma = new PrismaClient()

  return {
    // All queries automatically scoped to tenant
    conversation: {
      findMany: (args?: any) => prisma.conversation.findMany({
        ...args,
        where: { ...args?.where, companyId: ctx.companyId }
      }),
      create: (args: any) => prisma.conversation.create({
        ...args,
        data: { ...args.data, companyId: ctx.companyId }
      }),
      // ... other methods
    },

    knowledgeItem: {
      findMany: (args?: any) => prisma.knowledgeItem.findMany({
        ...args,
        where: { ...args?.where, companyId: ctx.companyId }
      }),
      create: (args: any) => {
        // Check subscription limits
        if (ctx.subscription.usage.knowledge >= ctx.subscription.limits.maxKnowledge) {
          throw new Error('Knowledge base limit reached. Upgrade your plan.')
        }
        return prisma.knowledgeItem.create({
          ...args,
          data: { ...args.data, companyId: ctx.companyId }
        })
      },
      // ... other methods
    },

    user: {
      findMany: (args?: any) => prisma.user.findMany({
        ...args,
        where: { ...args?.where, companyId: ctx.companyId }
      }),
      create: (args: any) => {
        // Check subscription limits
        if (ctx.subscription.usage.users >= ctx.subscription.limits.maxUsers) {
          throw new Error('User limit reached. Upgrade your plan.')
        }
        return prisma.user.create({
          ...args,
          data: { ...args.data, companyId: ctx.companyId }
        })
      },
    },

    // Raw prisma for admin operations
    $raw: prisma,
  }
}
```

### API Routes Structure

```
src/app/api/
├── auth/
│   ├── login/route.ts        # Magic link request
│   ├── verify/route.ts       # Magic link verification
│   ├── logout/route.ts       # Session termination
│   └── me/route.ts           # Current user info
│
├── companies/
│   ├── route.ts              # POST: Create company (signup)
│   └── [slug]/
│       ├── route.ts          # GET/PUT: Company details
│       └── settings/route.ts # Company settings
│
├── users/
│   ├── route.ts              # GET: List, POST: Invite
│   └── [id]/route.ts         # GET/PUT/DELETE: User management
│
├── knowledge/
│   ├── route.ts              # GET: List, POST: Create
│   ├── [id]/route.ts         # GET/PUT/DELETE: Item management
│   └── import/route.ts       # Bulk import from docs
│
├── conversations/
│   ├── route.ts              # GET: List (filtered by tenant)
│   ├── [id]/route.ts         # GET: Conversation details
│   └── [id]/correct/route.ts # POST: Manager correction
│
├── chat/
│   └── route.ts              # POST: Send message (employee chat)
│
├── stats/
│   └── route.ts              # GET: Dashboard analytics
│
├── subscription/
│   ├── route.ts              # GET: Current plan
│   ├── upgrade/route.ts      # POST: Upgrade plan
│   └── webhook/route.ts      # Stripe webhook
│
└── webhooks/
    └── whatsapp/route.ts     # WhatsApp message webhook
```

---

## Frontend Architecture

### Route Protection

```typescript
// src/middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/pricing', '/chat']
const AUTH_ROUTES = ['/dashboard']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('session')

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Protect dashboard routes
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Tenant Context Provider

```typescript
// src/providers/TenantProvider.tsx

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type TenantContextType = {
  company: {
    id: string
    name: string
    slug: string
    logo?: string
    primaryColor: string
  }
  user: {
    id: string
    name: string
    email?: string
    role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN' | 'OWNER'
    avatarUrl?: string
  }
  subscription: {
    plan: string
    status: string
    limits: Record<string, number>
    usage: Record<string, number>
  }
  isLoading: boolean
}

const TenantContext = createContext<TenantContextType | null>(null)

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<TenantContextType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadContext() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setContext({ ...data, isLoading: false })
        } else {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }
    loadContext()
  }, [router])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <TenantContext.Provider value={context}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}
```

### Dashboard Layout with Dynamic Company

```typescript
// src/app/dashboard/layout.tsx

import { TenantProvider } from '@/providers/TenantProvider'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TenantProvider>
      <div className="min-h-screen bg-gray-50 flex" dir="rtl">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </TenantProvider>
  )
}
```

---

## Employee Chat (Public Access)

### Company-Specific Chat Page

```typescript
// src/app/chat/[slug]/page.tsx

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ChatInterface } from '@/components/chat/ChatInterface'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    select: { name: true }
  })

  if (!company) return { title: 'Not Found' }

  return {
    title: `צ'אט עובדים - ${company.name}`,
    description: `שאל שאלות וקבל תשובות מיידיות מ-${company.name}`
  }
}

export default async function ChatPage({ params }: { params: { slug: string } }) {
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    include: {
      subscription: true,
    }
  })

  if (!company) {
    notFound()
  }

  // Check if subscription is active
  if (company.subscription?.status === 'CANCELED') {
    return <SubscriptionExpiredPage company={company} />
  }

  return (
    <ChatInterface
      companyId={company.id}
      companyName={company.name}
      primaryColor={company.primaryColor}
      welcomeMessage={company.welcomeMessage}
    />
  )
}
```

---

## Subscription & Billing

### Pricing Tiers

| Feature | Starter | Growth | Business | Enterprise |
|---------|---------|--------|----------|------------|
| **Price** | ₪199/mo | ₪499/mo | ₪999/mo | Custom |
| **Users** | 10 | 50 | 200 | Unlimited |
| **Knowledge Items** | 100 | 500 | Unlimited | Unlimited |
| **Queries/Month** | 1,000 | 10,000 | 50,000 | Unlimited |
| **WhatsApp** | ✓ | ✓ | ✓ | ✓ |
| **Dashboard** | Basic | Full | Full | Full |
| **Analytics** | - | Basic | Advanced | Custom |
| **Support** | Email | Email | Priority | Dedicated |
| **API Access** | - | - | ✓ | ✓ |

### Stripe Integration

```typescript
// src/lib/billing/stripe.ts

import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PLAN_PRICES = {
  STARTER: 'price_starter_monthly',
  GROWTH: 'price_growth_monthly',
  BUSINESS: 'price_business_monthly',
}

export async function createCheckoutSession(
  companyId: string,
  plan: keyof typeof PLAN_PRICES
) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscription: true, users: { where: { role: 'OWNER' } } }
  })

  if (!company) throw new Error('Company not found')

  // Create or retrieve Stripe customer
  let customerId = company.subscription?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: company.users[0]?.email ?? undefined,
      metadata: { companyId },
    })
    customerId = customer.id
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PLAN_PRICES[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings`,
    metadata: { companyId, plan },
  })

  return session
}

export async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const { companyId, plan } = session.metadata!

      await prisma.subscription.update({
        where: { companyId },
        data: {
          plan: plan as any,
          status: 'ACTIVE',
          stripeCustomerId: session.customer as string,
          stripeSubId: session.subscription as string,
        }
      })
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await prisma.subscription.update({
        where: { stripeSubId: subscription.id },
        data: { status: 'CANCELED' }
      })
      break
    }

    // Handle other events...
  }
}
```

---

## Migration Path

### Phase 1: Authentication (Week 1)
1. Add Session and Subscription models to Prisma
2. Implement magic link auth flow
3. Create auth middleware
4. Update dashboard layout to use TenantProvider

### Phase 2: Multi-Tenant Isolation (Week 2)
1. Add company slug-based routing
2. Create tenant-aware Prisma wrapper
3. Audit all queries for companyId filtering
4. Add subscription limit checks

### Phase 3: Billing (Week 3)
1. Integrate Stripe
2. Create pricing page with plan selection
3. Implement upgrade/downgrade flows
4. Add usage tracking and limit enforcement

### Phase 4: Onboarding (Week 4)
1. Build company setup wizard
2. Knowledge base import tools
3. Team invitation flow
4. WhatsApp number configuration

---

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── verify/page.tsx
│   ├── (marketing)/
│   │   ├── page.tsx              # Landing
│   │   └── pricing/page.tsx
│   ├── chat/
│   │   └── [slug]/page.tsx       # Employee chat
│   ├── dashboard/
│   │   ├── layout.tsx            # Protected + TenantProvider
│   │   ├── page.tsx              # Overview
│   │   ├── conversations/
│   │   ├── knowledge/
│   │   ├── users/
│   │   ├── settings/
│   │   └── onboarding/
│   └── api/
│       ├── auth/
│       ├── chat/
│       ├── companies/
│       ├── subscription/
│       └── webhooks/
├── components/
│   ├── auth/
│   ├── chat/
│   ├── dashboard/
│   └── ui/
├── lib/
│   ├── auth/
│   │   ├── middleware.ts
│   │   ├── session.ts
│   │   └── magic-link.ts
│   ├── billing/
│   │   └── stripe.ts
│   ├── db/
│   │   ├── prisma.ts
│   │   └── tenant-prisma.ts
│   └── bot/
├── providers/
│   └── TenantProvider.tsx
└── middleware.ts
```

---

## Security Considerations

1. **Data Isolation**: Every query MUST include companyId filter
2. **Rate Limiting**: Per-company query limits enforced
3. **Audit Logging**: Track all data access with tenant context
4. **Encryption**: Sensitive data encrypted at rest
5. **RBAC**: Role checks on every protected endpoint

---

## Summary

This architecture transforms Klear AI from a single-tenant demo to a production-ready multi-tenant SaaS:

- **For Managers**: Direct login → see only their company's data
- **For Employees**: Company-specific chat URLs or WhatsApp
- **For Billing**: Subscription-based with usage limits
- **For Growth**: Infinitely scalable tenant isolation

Every customer gets their own world, powered by shared infrastructure.
