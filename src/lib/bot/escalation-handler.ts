/**
 * Escalation Handler
 * Manages the flow of escalating employee questions to managers
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EscalationResult {
  escalationId: string;
  managerAssigned: boolean;
  managerSessionId?: string;
}

export interface EscalationNotification {
  managerSessionId: string;
  message: string;
  employeeName: string;
  query: string;
}

/**
 * Create a new escalation from an employee question
 */
export async function createEscalation(
  employeeSessionId: string,
  query: string,
  messageId?: string
): Promise<EscalationResult> {
  const session = await prisma.whatsAppSession.findUnique({
    where: { id: employeeSessionId },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Find available manager
  const managerSession = await findAvailableManager(session.companyId);

  const escalation = await prisma.escalation.create({
    data: {
      companyId: session.companyId,
      employeeSessionId,
      employeeQuery: query,
      employeeMessageId: messageId,
      managerSessionId: managerSession?.id,
      status: managerSession ? 'in_progress' : 'pending',
      assignedAt: managerSession ? new Date() : null,
    },
  });

  return {
    escalationId: escalation.id,
    managerAssigned: !!managerSession,
    managerSessionId: managerSession?.id,
  };
}

/**
 * Find an available manager to handle escalation
 * Prioritizes managers with least pending escalations
 */
async function findAvailableManager(
  companyId: string
): Promise<{ id: string; phoneNumber: string } | null> {
  // Find all active managers
  const managers = await prisma.whatsAppSession.findMany({
    where: {
      companyId,
      userRole: 'manager',
      isActive: true,
    },
    include: {
      handledEscalations: {
        where: { status: 'in_progress' },
      },
    },
  });

  if (managers.length === 0) return null;

  // Sort by least busy (fewest in-progress escalations)
  managers.sort((a, b) =>
    a.handledEscalations.length - b.handledEscalations.length
  );

  return {
    id: managers[0].id,
    phoneNumber: managers[0].phoneNumber,
  };
}

/**
 * Get notification message for manager
 */
export async function getManagerNotification(
  escalationId: string
): Promise<EscalationNotification | null> {
  const escalation = await prisma.escalation.findUnique({
    where: { id: escalationId },
    include: {
      employeeSession: true,
      managerSession: true,
    },
  });

  if (!escalation || !escalation.managerSession) {
    return null;
  }

  const employeeName = escalation.employeeSession.userName || 'עובד';

  const message = `❓ שאלה חדשה מ${employeeName}:

"${escalation.employeeQuery}"

ענה כאן בטקסט או שלח תמונה/סרטון.`;

  return {
    managerSessionId: escalation.managerSession.id,
    message,
    employeeName,
    query: escalation.employeeQuery,
  };
}

/**
 * Get pending escalation for a manager
 * Returns the oldest in-progress escalation that needs response
 */
export async function getPendingEscalationForManager(
  managerSessionId: string
): Promise<{
  id: string;
  employeeQuery: string;
  employeeName: string;
  createdAt: Date;
} | null> {
  const escalation = await prisma.escalation.findFirst({
    where: {
      managerSessionId,
      status: 'in_progress',
    },
    orderBy: { assignedAt: 'asc' },
    include: {
      employeeSession: true,
    },
  });

  if (!escalation) return null;

  return {
    id: escalation.id,
    employeeQuery: escalation.employeeQuery,
    employeeName: escalation.employeeSession.userName || 'עובד',
    createdAt: escalation.createdAt,
  };
}

/**
 * Resolve an escalation with manager's response
 */
export async function resolveEscalation(
  escalationId: string,
  response: string,
  mediaUrls?: string[]
): Promise<{
  success: boolean;
  employeeSessionId: string;
  responseMessage: string;
}> {
  const escalation = await prisma.escalation.findUnique({
    where: { id: escalationId },
    include: { employeeSession: true },
  });

  if (!escalation) {
    throw new Error('Escalation not found');
  }

  // Update escalation with response
  await prisma.escalation.update({
    where: { id: escalationId },
    data: {
      status: 'resolved',
      managerResponse: response,
      managerMediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
      resolvedAt: new Date(),
    },
  });

  // Enrich knowledge base with this Q&A
  if (escalation.shouldAddToKB) {
    await enrichKnowledgeBase(
      escalation.companyId,
      escalation.employeeQuery,
      response,
      mediaUrls
    );
  }

  return {
    success: true,
    employeeSessionId: escalation.employeeSessionId,
    responseMessage: response,
  };
}

/**
 * Enrich knowledge base with Q&A from escalation
 */
async function enrichKnowledgeBase(
  companyId: string,
  question: string,
  answer: string,
  mediaUrls?: string[]
): Promise<void> {
  // Create knowledge item from Q&A
  const knowledgeItem = await prisma.knowledgeItem.create({
    data: {
      companyId,
      title: question.slice(0, 100),
      titleHe: question.slice(0, 100),
      content: `שאלה: ${question}\n\nתשובה: ${answer}`,
      contentHe: `שאלה: ${question}\n\nתשובה: ${answer}`,
      type: 'faq',
      tags: JSON.stringify(['escalation', 'manager-answer', 'auto-generated']),
      priority: 1, // Give some priority to manager-approved answers
    },
  });

  // TODO: Generate embedding for the new item
  // await indexKnowledgeItem(knowledgeItem.id);

  // Link media items if any
  if (mediaUrls && mediaUrls.length > 0) {
    for (const url of mediaUrls) {
      await prisma.mediaItem.create({
        data: {
          knowledgeItemId: knowledgeItem.id,
          companyId,
          filename: url.split('/').pop() || 'media',
          originalName: url.split('/').pop() || 'media',
          mimeType: getMimeType(url),
          size: 0, // Unknown
          url,
        },
      });
    }
  }

  console.log(`📚 Added to knowledge base: "${question.slice(0, 50)}..."`);
}

/**
 * Get mime type from URL/filename
 */
function getMimeType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    pdf: 'application/pdf',
    mp3: 'audio/mpeg',
    opus: 'audio/opus',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Get all pending escalations for a company
 */
export async function getPendingEscalations(
  companyId: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  query: string;
  employeeName: string;
  createdAt: Date;
  status: string;
}>> {
  const escalations = await prisma.escalation.findMany({
    where: {
      companyId,
      status: { in: ['pending', 'in_progress'] },
    },
    take: limit,
    orderBy: { createdAt: 'asc' },
    include: {
      employeeSession: true,
    },
  });

  return escalations.map(e => ({
    id: e.id,
    query: e.employeeQuery,
    employeeName: e.employeeSession.userName || 'עובד',
    createdAt: e.createdAt,
    status: e.status,
  }));
}

/**
 * Assign a pending escalation to a manager
 */
export async function assignEscalationToManager(
  escalationId: string,
  managerSessionId: string
): Promise<boolean> {
  const escalation = await prisma.escalation.findUnique({
    where: { id: escalationId },
  });

  if (!escalation || escalation.status !== 'pending') {
    return false;
  }

  await prisma.escalation.update({
    where: { id: escalationId },
    data: {
      managerSessionId,
      status: 'in_progress',
      assignedAt: new Date(),
    },
  });

  return true;
}

/**
 * Get escalation statistics
 */
export async function getEscalationStats(
  companyId: string,
  daysBack: number = 7
): Promise<{
  total: number;
  pending: number;
  resolved: number;
  avgResolutionTimeMinutes: number;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const escalations = await prisma.escalation.findMany({
    where: {
      companyId,
      createdAt: { gte: startDate },
    },
  });

  const resolved = escalations.filter(e => e.status === 'resolved');
  const pending = escalations.filter(e => e.status !== 'resolved');

  // Calculate average resolution time
  let totalResolutionTime = 0;
  for (const e of resolved) {
    if (e.resolvedAt && e.createdAt) {
      totalResolutionTime += e.resolvedAt.getTime() - e.createdAt.getTime();
    }
  }
  const avgResolutionTimeMinutes = resolved.length > 0
    ? Math.round((totalResolutionTime / resolved.length) / (1000 * 60))
    : 0;

  return {
    total: escalations.length,
    pending: pending.length,
    resolved: resolved.length,
    avgResolutionTimeMinutes,
  };
}
