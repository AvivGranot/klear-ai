/**
 * Dashboard Stats API
 * Returns aggregated statistics for the dashboard
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get or create company
    let company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    const companyId = company.id;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all stats in parallel
    const [
      totalKnowledgeItems,
      totalCategories,
      totalMediaItems,
      totalUsers,
      totalEmployees,
      totalManagers,
      totalConversations,
      weeklyQueries,
      monthlyQueries,
      escalations,
      pendingEscalations,
      resolvedEscalations,
      recentQueries,
      categoryStats,
      knowledgeByType,
    ] = await Promise.all([
      // Knowledge base
      prisma.knowledgeItem.count({ where: { companyId, isActive: true } }),
      prisma.category.count({ where: { companyId } }),
      prisma.mediaItem.count({ where: { companyId } }),

      // Users
      prisma.user.count({ where: { companyId } }),
      prisma.whatsAppSession.count({ where: { companyId, userRole: 'employee' } }),
      prisma.whatsAppSession.count({ where: { companyId, userRole: 'manager' } }),

      // Conversations
      prisma.conversation.count({ where: { companyId } }),

      // Query logs
      prisma.queryLog.count({ where: { companyId, createdAt: { gte: weekAgo } } }),
      prisma.queryLog.count({ where: { companyId, createdAt: { gte: monthAgo } } }),

      // Escalations
      prisma.escalation.count({ where: { companyId } }),
      prisma.escalation.count({ where: { companyId, status: 'pending' } }),
      prisma.escalation.count({ where: { companyId, status: 'resolved' } }),

      // Recent queries
      prisma.queryLog.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          query: true,
          response: true,
          wasHelpful: true,
          createdAt: true,
        },
      }),

      // Category stats
      prisma.category.findMany({
        where: { companyId },
        include: {
          _count: {
            select: { knowledgeItems: true },
          },
        },
      }),

      // Knowledge by type
      prisma.knowledgeItem.groupBy({
        by: ['type'],
        where: { companyId, isActive: true },
        _count: { type: true },
      }),
    ]);

    // Calculate auto-answer rate
    const autoAnswerRate = monthlyQueries > 0
      ? Math.round(((monthlyQueries - escalations) / monthlyQueries) * 100)
      : 100;

    // Format category stats
    const categories = categoryStats.map(cat => ({
      id: cat.id,
      name: cat.name,
      nameHe: cat.nameHe,
      icon: cat.icon,
      itemCount: cat._count.knowledgeItems,
    }));

    // Format knowledge type stats
    const knowledgeTypes = knowledgeByType.map(t => ({
      type: t.type,
      count: t._count.type,
    }));

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        industry: company.industry,
      },
      knowledgeBase: {
        totalItems: totalKnowledgeItems,
        categories: totalCategories,
        mediaFiles: totalMediaItems,
        byType: knowledgeTypes,
        byCategory: categories,
      },
      users: {
        total: totalUsers,
        employees: totalEmployees,
        managers: totalManagers,
      },
      conversations: {
        total: totalConversations,
        weeklyQueries,
        monthlyQueries,
        autoAnswerRate,
      },
      escalations: {
        total: escalations,
        pending: pendingEscalations,
        resolved: resolvedEscalations,
        resolutionRate: escalations > 0
          ? Math.round((resolvedEscalations / escalations) * 100)
          : 100,
      },
      recentQueries: recentQueries.map(q => ({
        id: q.id,
        query: q.query,
        hasResponse: !!q.response,
        wasHelpful: q.wasHelpful,
        createdAt: q.createdAt,
      })),
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
