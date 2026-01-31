/**
 * Escalations API
 * POST - Create a new escalation from employee chat
 * GET - List escalations for managers (requires auth)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  checkRateLimit,
  rateLimitHeaders,
  getClientIdentifier,
  getRateLimitKey,
  RateLimits,
} from '@/lib/rate-limit'

// In-memory store for MVP (will move to database later)
// TODO: Move to database when WhatsApp session integration is complete
interface WebEscalation {
  id: string
  companyId: string
  question: string
  conversationId: string | null
  status: 'pending' | 'in_progress' | 'resolved'
  managerResponse: string | null
  priority: number
  createdAt: string
  resolvedAt: string | null
  resolvedBy: string | null
  shouldAddToKB: boolean
}

// In-memory store (will be replaced with Prisma)
const escalationsStore: WebEscalation[] = []

/**
 * POST - Create a new escalation
 * Public endpoint for employees
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitKey = getRateLimitKey(clientId, 'escalations')
    const rateLimitResult = checkRateLimit(rateLimitKey, RateLimits.api)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', retryAfter: rateLimitResult.retryAfter },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    const body = await request.json()
    const { companyId, question, conversationId } = body

    if (!companyId || !question) {
      return NextResponse.json(
        { error: 'Company ID and question are required' },
        { status: 400 }
      )
    }

    // Create escalation
    const escalation: WebEscalation = {
      id: `esc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      companyId,
      question: question.trim(),
      conversationId: conversationId || null,
      status: 'pending',
      managerResponse: null,
      priority: 1, // Manual escalation = higher priority
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedBy: null,
      shouldAddToKB: true,
    }

    escalationsStore.push(escalation)

    // TODO: Notify managers via webhook/WebSocket/email

    return NextResponse.json({
      success: true,
      escalationId: escalation.id,
      message: 'השאלה הועברה למנהל. תקבל תשובה בהקדם.',
    })
  } catch (error) {
    console.error('Escalation creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create escalation' },
      { status: 500 }
    )
  }
}

/**
 * GET - List escalations
 * Requires authentication (managers only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only managers, admins, owners can view escalations
    if (user.role === 'employee') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Filter escalations by company and optionally by status
    let escalations = escalationsStore.filter(e => e.companyId === user.companyId)

    if (status) {
      escalations = escalations.filter(e => e.status === status)
    }

    // Sort by creation date (newest first for pending, oldest first for in_progress)
    escalations.sort((a, b) => {
      if (a.status === 'pending' && b.status === 'pending') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    // Get counts
    const counts = {
      pending: escalationsStore.filter(e => e.companyId === user.companyId && e.status === 'pending').length,
      in_progress: escalationsStore.filter(e => e.companyId === user.companyId && e.status === 'in_progress').length,
      resolved: escalationsStore.filter(e => e.companyId === user.companyId && e.status === 'resolved').length,
    }

    return NextResponse.json({
      escalations,
      counts,
    })
  } catch (error) {
    console.error('Escalation list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch escalations' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update an escalation (resolve, respond)
 * Requires authentication (managers only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role === 'employee') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { escalationId, response, status, shouldAddToKB } = body

    if (!escalationId) {
      return NextResponse.json(
        { error: 'Escalation ID is required' },
        { status: 400 }
      )
    }

    const escalation = escalationsStore.find(
      e => e.id === escalationId && e.companyId === user.companyId
    )

    if (!escalation) {
      return NextResponse.json(
        { error: 'Escalation not found' },
        { status: 404 }
      )
    }

    // Update escalation
    if (response !== undefined) {
      escalation.managerResponse = response
    }

    if (status) {
      escalation.status = status
      if (status === 'resolved') {
        escalation.resolvedAt = new Date().toISOString()
        escalation.resolvedBy = user.id
      }
    }

    if (shouldAddToKB !== undefined) {
      escalation.shouldAddToKB = shouldAddToKB
    }

    // TODO: If shouldAddToKB is true and status is resolved, add Q&A to knowledge base
    // TODO: Notify employee of response (if they have a way to receive it)

    return NextResponse.json({
      success: true,
      escalation,
    })
  } catch (error) {
    console.error('Escalation update error:', error)
    return NextResponse.json(
      { error: 'Failed to update escalation' },
      { status: 500 }
    )
  }
}
