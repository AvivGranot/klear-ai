/**
 * Klear AI Authentication System
 * Boris Cherny principles: Type-safe, secure, composable
 * Brian Chesky principles: Frictionless, delightful, trust-building
 */

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// ==================== TYPES ====================

export interface AuthUser {
  id: string
  email: string | null
  name: string
  role: 'employee' | 'manager' | 'admin' | 'owner'
  companyId: string
  company: {
    id: string
    name: string
    slug: string
    primaryColor: string
    botName: string
  }
}

export interface SessionData {
  userId: string
  token: string
  expiresAt: Date
}

// ==================== CONSTANTS ====================

const SESSION_COOKIE_NAME = 'klear_session'
const SESSION_EXPIRY_DAYS = 30
const MAGIC_LINK_EXPIRY_MINUTES = 15

// ==================== PASSWORD HASHING ====================

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return hash === verifyHash
}

// ==================== TOKEN GENERATION ====================

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateSecureCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase() // 6-char code like "A1B2C3"
}

// ==================== SESSION MANAGEMENT ====================

export async function createSession(
  userId: string,
  metadata?: { userAgent?: string; ipAddress?: string; deviceType?: string }
): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS)

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
      deviceType: metadata?.deviceType || 'web',
    },
  })

  // Update user's last login
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  })

  return token
}

export async function validateSession(token: string): Promise<AuthUser | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          company: true,
        },
      },
    },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }

  // Update last used
  await prisma.session.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  })

  // Update user's last active
  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastActiveAt: new Date() },
  })

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as AuthUser['role'],
    companyId: session.user.companyId,
    company: {
      id: session.user.company.id,
      name: session.user.company.name,
      slug: session.user.company.slug,
      primaryColor: session.user.company.primaryColor,
      botName: session.user.company.botName,
    },
  }
}

export async function destroySession(token: string): Promise<void> {
  await prisma.session.delete({ where: { token } }).catch(() => {})
}

export async function destroyAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } })
}

// ==================== MAGIC LINK ====================

export async function createMagicLink(email: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + MAGIC_LINK_EXPIRY_MINUTES)

  // Delete any existing magic links for this email
  await prisma.magicLink.deleteMany({ where: { email } })

  await prisma.magicLink.create({
    data: {
      email,
      token,
      expiresAt,
    },
  })

  return token
}

export async function validateMagicLink(token: string): Promise<string | null> {
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
  })

  if (!magicLink) return null
  if (magicLink.expiresAt < new Date()) {
    await prisma.magicLink.delete({ where: { id: magicLink.id } })
    return null
  }
  if (magicLink.usedAt) return null

  // Mark as used
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() },
  })

  // Verify email if user exists
  const user = await prisma.user.findUnique({ where: { email: magicLink.email } })
  if (user && !user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    })
  }

  return magicLink.email
}

// ==================== COOKIE HELPERS ====================

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  })
}

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

// ==================== AUTH HELPERS ====================

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionCookie()
  if (!token) return null
  return validateSession(token)
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(allowedRoles: AuthUser['role'][]): Promise<AuthUser> {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  return user
}

// ==================== COMPANY/TENANT HELPERS ====================

export async function getCompanyBySlug(slug: string) {
  return prisma.company.findUnique({
    where: { slug },
    include: {
      subscription: true,
    },
  })
}

export async function validateCompanyAccess(userId: string, companyId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId,
      isActive: true,
    },
  })
  return !!user
}

// ==================== USER MANAGEMENT ====================

export async function createUser(data: {
  email: string
  name: string
  password?: string
  role?: 'employee' | 'manager' | 'admin' | 'owner'
  companyId: string
}) {
  const passwordHash = data.password ? await hashPassword(data.password) : null

  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role || 'employee',
      companyId: data.companyId,
    },
  })
}

export async function authenticateWithPassword(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  })

  if (!user || !user.passwordHash || !user.isActive) return null

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AuthUser['role'],
    companyId: user.companyId,
    company: {
      id: user.company.id,
      name: user.company.name,
      slug: user.company.slug,
      primaryColor: user.company.primaryColor,
      botName: user.company.botName,
    },
  }
}
