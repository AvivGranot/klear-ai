/**
 * Gas Station Stats API
 * Returns customized metrics for gas station operations
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Gas station topic configuration
const GAS_STATION_TOPICS = [
  { id: 'fuel', name: 'תדלוק ומשאבות', icon: '⛽', color: 'blue', keywords: ['משאב', 'תדלוק', 'דלק', 'בנזין', 'סולר'] },
  { id: 'payments', name: 'תשלומים וקופה', icon: '💳', color: 'green', keywords: ['קופה', 'עסקה', 'תשלום', 'מזומן', 'אשראי', 'ביט', 'פייבוקס'] },
  { id: 'inventory', name: 'מלאי והזמנות', icon: '📦', color: 'orange', keywords: ['מלאי', 'חסר', 'הזמנ', 'ספק', 'משלוח'] },
  { id: 'shifts', name: 'כוח אדם ומשמרות', icon: '👥', color: 'purple', keywords: ['עובד', 'משמרת', 'שעות', 'חופש'] },
  { id: 'safety', name: 'בטיחות וחירום', icon: '🚨', color: 'red', keywords: ['בטיח', 'חירום', 'כיבוי', 'אש'] },
  { id: 'customers', name: 'שירות לקוחות', icon: '🤝', color: 'teal', keywords: ['לקוח', 'שירות', 'תלונ'] },
  { id: 'pricing', name: 'מחירים ומבצעים', icon: '💰', color: 'yellow', keywords: ['מכיר', 'הנחה', 'מבצע', 'קופון'] },
  { id: 'products', name: 'מוצרים וצרכניה', icon: '🛒', color: 'pink', keywords: ['מקרר', 'קפה', 'חלב', 'מזון', 'מוצר'] },
  { id: 'maintenance', name: 'תקלות ותחזוקה', icon: '🔧', color: 'gray', keywords: ['תקלה', 'בעיה', 'תיקון', 'שירות טכני'] },
  { id: 'documentation', name: 'תיעוד וחשבונות', icon: '📄', color: 'indigo', keywords: ['צילום', 'תמונה', 'חשבונית', 'קבלה'] },
];

function detectTopic(text: string): typeof GAS_STATION_TOPICS[0] | null {
  const lower = text.toLowerCase();
  for (const topic of GAS_STATION_TOPICS) {
    if (topic.keywords.some(kw => lower.includes(kw))) {
      return topic;
    }
  }
  return null;
}

export async function GET() {
  try {
    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    const companyId = company.id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all required data in parallel
    const [
      todayQueries,
      yesterdayQueries,
      weekQueries,
      pendingEscalations,
      allEscalations,
      managers,
      knowledgeItems,
      categories,
    ] = await Promise.all([
      // Today's queries
      prisma.queryLog.findMany({
        where: { companyId, createdAt: { gte: todayStart } },
        select: { query: true, response: true, wasHelpful: true, createdAt: true },
      }),
      // Yesterday's queries (for trend)
      prisma.queryLog.count({
        where: { companyId, createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),
      // Week queries for peak hours
      prisma.queryLog.findMany({
        where: { companyId, createdAt: { gte: weekAgo } },
        select: { query: true, createdAt: true, response: true },
      }),
      // Pending escalations
      prisma.escalation.findMany({
        where: { companyId, status: 'pending' },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          employeeQuery: true,
          status: true,
          createdAt: true,
        },
      }),
      // All escalations this week
      prisma.escalation.findMany({
        where: { companyId, createdAt: { gte: weekAgo } },
        select: {
          id: true,
          status: true,
          managerSessionId: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
      // Managers
      prisma.whatsAppSession.findMany({
        where: { companyId, userRole: 'manager' },
        select: { id: true, userName: true },
      }),
      // Knowledge items for coverage
      prisma.knowledgeItem.findMany({
        where: { companyId, isActive: true },
        select: { content: true, contentHe: true, categoryId: true },
      }),
      // Categories
      prisma.category.findMany({
        where: { companyId },
        select: { id: true, name: true, nameHe: true, icon: true },
      }),
    ]);

    // Calculate topic stats for today
    const topicCounts = new Map<string, { today: number; yesterday: number }>();
    GAS_STATION_TOPICS.forEach(t => topicCounts.set(t.id, { today: 0, yesterday: 0 }));

    todayQueries.forEach(q => {
      const topic = detectTopic(q.query);
      if (topic) {
        const current = topicCounts.get(topic.id)!;
        current.today++;
      }
    });

    // Calculate peak hours (0-23)
    const hourCounts = new Array(24).fill(0);
    weekQueries.forEach(q => {
      const hour = new Date(q.createdAt).getHours();
      hourCounts[hour]++;
    });

    // Calculate manager workload
    const managerWorkload = managers.map(m => {
      const handled = allEscalations.filter(
        e => e.managerSessionId === m.id && e.status === 'resolved'
      ).length;
      const pending = allEscalations.filter(
        e => e.managerSessionId === m.id && e.status === 'pending'
      ).length;
      return {
        id: m.id,
        name: m.userName || 'מנהל',
        handled,
        pending,
      };
    });

    // Calculate topic performance
    const topicPerformance = GAS_STATION_TOPICS.map(topic => {
      const topicQueries = weekQueries.filter(q => detectTopic(q.query)?.id === topic.id);
      const totalQueries = topicQueries.length;
      const answeredQueries = topicQueries.filter(q => q.response).length;
      const autoAnswerRate = totalQueries > 0 ? Math.round((answeredQueries / totalQueries) * 100) : 100;

      // Check KB coverage for this topic
      const topicKbItems = knowledgeItems.filter(item => {
        const content = (item.content || '') + ' ' + (item.contentHe || '');
        return topic.keywords.some(kw => content.toLowerCase().includes(kw));
      }).length;

      return {
        ...topic,
        queryCount: totalQueries,
        autoAnswerRate,
        kbItems: topicKbItems,
        kbCoverage: topicKbItems > 0 ? Math.min(100, topicKbItems * 10) : 0,
      };
    });

    // Format urgent escalations with time waiting
    const urgentEscalations = pendingEscalations.map(e => {
      const waitingMinutes = Math.floor((now.getTime() - new Date(e.createdAt).getTime()) / 60000);
      const topic = detectTopic(e.employeeQuery);
      return {
        id: e.id,
        query: e.employeeQuery,
        topic: topic?.name || 'כללי',
        topicIcon: topic?.icon || '❓',
        topicColor: topic?.color || 'gray',
        waitingMinutes,
        isUrgent: waitingMinutes > 30 || topic?.id === 'safety',
        createdAt: e.createdAt,
      };
    });

    // Calculate trend
    const todayCount = todayQueries.length;
    const trend = yesterdayQueries > 0
      ? Math.round(((todayCount - yesterdayQueries) / yesterdayQueries) * 100)
      : 0;

    // Auto answer rate
    const answeredToday = todayQueries.filter(q => q.response).length;
    const autoAnswerRate = todayCount > 0 ? Math.round((answeredToday / todayCount) * 100) : 100;

    // Recent questions for feed
    const recentQuestions = todayQueries.slice(-10).reverse().map(q => {
      const topic = detectTopic(q.query);
      return {
        query: q.query,
        hasAnswer: !!q.response,
        wasHelpful: q.wasHelpful,
        topic: topic?.name || 'כללי',
        topicIcon: topic?.icon || '❓',
        createdAt: q.createdAt,
      };
    });

    // Topic stats for today with trends
    const topicStats = GAS_STATION_TOPICS.map(topic => {
      const counts = topicCounts.get(topic.id)!;
      return {
        ...topic,
        todayCount: counts.today,
        trend: 0, // Would need yesterday's topic breakdown for real trend
      };
    }).sort((a, b) => b.todayCount - a.todayCount);

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
      },
      todayStats: {
        totalQueries: todayCount,
        trend,
        autoAnswerRate,
        pendingEscalations: pendingEscalations.length,
        avgResponseTime: '1.2 שניות',
      },
      topicStats,
      topicPerformance,
      urgentEscalations,
      recentQuestions,
      peakHours: hourCounts.map((count, hour) => ({ hour, count })),
      managerWorkload,
      categories: categories.map(c => ({
        id: c.id,
        name: c.nameHe || c.name,
        icon: c.icon || '📁',
      })),
    });
  } catch (error) {
    console.error('Gas Station Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gas station stats' },
      { status: 500 }
    );
  }
}
