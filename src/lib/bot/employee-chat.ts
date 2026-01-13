/**
 * Employee Chat Handler
 * Handles employee questions with AI and escalation
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { createEscalation, getManagerNotification } from './escalation-handler';

const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Confidence threshold for escalation
const CONFIDENCE_THRESHOLD = 0.7;

export interface EmployeeResponse {
  messages: string[];
  mediaUrls?: string[];
  confidence: number;
  escalated: boolean;
  knowledgeItemId?: string;
}

export interface AISearchResult {
  answer: string;
  confidence: number;
  knowledgeItemId?: string;
  mediaUrls?: string[];
}

/**
 * Handle employee query
 */
export async function handleEmployeeQuery(
  sessionId: string,
  query: string
): Promise<EmployeeResponse> {
  const session = await prisma.whatsAppSession.findUnique({
    where: { id: sessionId },
    include: { company: true },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Log the query
  await logQuery(session.companyId, query);

  // Search knowledge base and get AI response
  const result = await searchAndAnswer(session.companyId, query);

  // Check confidence
  if (result.confidence < CONFIDENCE_THRESHOLD) {
    // Escalate to manager
    const escalationResult = await createEscalation(sessionId, query);

    if (escalationResult.managerAssigned) {
      // Notify manager (in real implementation, this would send WhatsApp message)
      const notification = await getManagerNotification(escalationResult.escalationId);
      if (notification) {
        console.log(`📤 Would send to manager: ${notification.message}`);
      }
    }

    return {
      messages: [
        `מעביר את השאלה למנהל... 🔄`,
        `תקבל תשובה בהקדם.`,
      ],
      confidence: result.confidence,
      escalated: true,
    };
  }

  // Return AI answer
  const response: EmployeeResponse = {
    messages: [result.answer],
    confidence: result.confidence,
    escalated: false,
    knowledgeItemId: result.knowledgeItemId,
  };

  if (result.mediaUrls && result.mediaUrls.length > 0) {
    response.mediaUrls = result.mediaUrls;
    response.messages.push(`📎 צירפתי גם מדיה רלוונטית.`);
  }

  // Update query log with response
  await updateQueryLog(session.companyId, query, result.answer, true);

  return response;
}

/**
 * Search knowledge base and generate answer
 */
async function searchAndAnswer(
  companyId: string,
  query: string
): Promise<AISearchResult> {
  // Get relevant knowledge items
  const knowledgeItems = await searchKnowledgeBase(companyId, query);

  if (knowledgeItems.length === 0) {
    return {
      answer: 'לא מצאתי מידע רלוונטי במאגר הידע.',
      confidence: 0.3,
    };
  }

  // Build context from knowledge items
  const context = knowledgeItems
    .map(item => `[${item.title}]\n${item.content}`)
    .join('\n\n---\n\n');

  // Generate answer with OpenAI
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `אתה עוזר AI של עסק. עליך לענות לשאלות עובדים בעברית בצורה ברורה ותמציתית.

השתמש במידע הבא ממאגר הידע כדי לענות:

${context}

הנחיות:
- ענה בעברית בלבד
- היה תמציתי וברור
- אם המידע לא מספיק לענות על השאלה, אמור זאת
- אל תמציא מידע שלא נמצא בהקשר`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const answer = completion.choices[0]?.message?.content || 'לא הצלחתי לעבד את השאלה.';

    // Calculate confidence based on relevance
    const confidence = calculateConfidence(answer, knowledgeItems);

    // Get media from best matching knowledge item
    const bestItem = knowledgeItems[0];
    const mediaUrls = await getKnowledgeItemMedia(bestItem.id);

    return {
      answer,
      confidence,
      knowledgeItemId: bestItem.id,
      mediaUrls,
    };
  } catch (error) {
    console.error('OpenAI error:', error);
    return {
      answer: 'מתנצל, יש בעיה טכנית. מעביר למנהל.',
      confidence: 0.2,
    };
  }
}

/**
 * Search knowledge base for relevant items
 */
async function searchKnowledgeBase(
  companyId: string,
  query: string,
  limit: number = 5
): Promise<Array<{ id: string; title: string; content: string; priority: number }>> {
  // For now, simple text search
  // In production, use vector similarity search with embeddings
  const keywords = query.split(/\s+/).filter(w => w.length > 2);

  const items = await prisma.knowledgeItem.findMany({
    where: {
      companyId,
      isActive: true,
      OR: [
        { title: { contains: query } },
        { titleHe: { contains: query } },
        { content: { contains: query } },
        { contentHe: { contains: query } },
        ...keywords.flatMap(kw => [
          { title: { contains: kw } },
          { content: { contains: kw } },
        ]),
      ],
    },
    orderBy: { priority: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      titleHe: true,
      content: true,
      contentHe: true,
      priority: true,
    },
  });

  return items.map(item => ({
    id: item.id,
    title: item.titleHe || item.title,
    content: item.contentHe || item.content,
    priority: item.priority,
  }));
}

/**
 * Get media files for a knowledge item
 */
async function getKnowledgeItemMedia(knowledgeItemId: string): Promise<string[]> {
  const media = await prisma.mediaItem.findMany({
    where: { knowledgeItemId },
    select: { url: true },
  });

  return media.map(m => m.url);
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
  answer: string,
  knowledgeItems: Array<{ content: string }>
): number {
  // Base confidence
  let confidence = 0.5;

  // Check if answer is meaningful (not a deflection)
  if (answer.includes('לא מצאתי') || answer.includes('לא הצלחתי') || answer.includes('אין לי')) {
    confidence = 0.3;
  }

  // Check if we found good knowledge items
  if (knowledgeItems.length >= 3) {
    confidence += 0.2;
  } else if (knowledgeItems.length >= 1) {
    confidence += 0.1;
  }

  // Check answer length (longer = more detailed = higher confidence)
  if (answer.length > 200) {
    confidence += 0.15;
  } else if (answer.length > 100) {
    confidence += 0.1;
  }

  // Check if high priority items were used
  const highPriorityUsed = knowledgeItems.some((item: any) => item.priority > 0);
  if (highPriorityUsed) {
    confidence += 0.1;
  }

  return Math.min(confidence, 0.95);
}

/**
 * Log a query for analytics
 */
async function logQuery(companyId: string, query: string): Promise<void> {
  await prisma.queryLog.create({
    data: {
      companyId,
      query,
    },
  });
}

/**
 * Update query log with response
 */
async function updateQueryLog(
  companyId: string,
  query: string,
  response: string,
  wasHelpful?: boolean
): Promise<void> {
  // Find most recent matching query
  const log = await prisma.queryLog.findFirst({
    where: {
      companyId,
      query,
      response: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (log) {
    await prisma.queryLog.update({
      where: { id: log.id },
      data: {
        response,
        wasHelpful,
      },
    });
  }
}

/**
 * Get suggested questions based on common queries
 */
export async function getSuggestedQuestions(
  companyId: string,
  limit: number = 5
): Promise<string[]> {
  // Get most common queries
  const queries = await prisma.queryLog.groupBy({
    by: ['query'],
    where: {
      companyId,
      wasHelpful: true,
    },
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: limit,
  });

  return queries.map(q => q.query);
}

/**
 * Feedback handler - mark if response was helpful
 */
export async function handleFeedback(
  sessionId: string,
  wasHelpful: boolean
): Promise<void> {
  const session = await prisma.whatsAppSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) return;

  // Update most recent query log for this session
  const recentLog = await prisma.queryLog.findFirst({
    where: {
      companyId: session.companyId,
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }, // Last 10 minutes
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentLog) {
    await prisma.queryLog.update({
      where: { id: recentLog.id },
      data: { wasHelpful },
    });
  }
}
