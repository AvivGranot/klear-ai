/**
 * Manager Chat Handler
 * Handles commands and escalation responses from managers
 */

import { PrismaClient } from '@prisma/client';
import {
  getPendingEscalationForManager,
  resolveEscalation,
  getPendingEscalations,
  getEscalationStats,
} from './escalation-handler';

const prisma = new PrismaClient();

export interface ManagerResponse {
  messages: string[];
  mediaUrls?: string[];
  links?: Array<{ title: string; url: string }>;
  isEscalationResponse?: boolean;
}

export type ManagerCommand =
  | 'dashboard'
  | 'analytics'
  | 'knowledge'
  | 'users'
  | 'settings'
  | 'pending'
  | 'help';

// Command mappings (Hebrew + English)
const COMMAND_MAP: Record<string, ManagerCommand> = {
  // Dashboard
  'דשבורד': 'dashboard',
  'לוח בקרה': 'dashboard',
  'dashboard': 'dashboard',

  // Analytics
  'אנליטיקס': 'analytics',
  'אנליטיקה': 'analytics',
  'נתונים': 'analytics',
  'סטטיסטיקה': 'analytics',
  'analytics': 'analytics',
  'stats': 'analytics',

  // Knowledge
  'ידע': 'knowledge',
  'מאגר ידע': 'knowledge',
  'knowledge': 'knowledge',
  'kb': 'knowledge',

  // Users
  'עובדים': 'users',
  'משתמשים': 'users',
  'users': 'users',

  // Settings
  'הגדרות': 'settings',
  'settings': 'settings',

  // Pending questions
  'ממתין': 'pending',
  'שאלות פתוחות': 'pending',
  'שאלות': 'pending',
  'pending': 'pending',

  // Help
  'עזרה': 'help',
  'help': 'help',
  '?': 'help',
};

/**
 * Handle manager message
 */
export async function handleManagerMessage(
  sessionId: string,
  message: string,
  mediaUrls?: string[]
): Promise<ManagerResponse> {
  const session = await prisma.whatsAppSession.findUnique({
    where: { id: sessionId },
    include: { company: true },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  // Check if this is a response to a pending escalation
  const pendingEscalation = await getPendingEscalationForManager(sessionId);

  if (pendingEscalation) {
    // Manager is responding to an escalation
    return handleEscalationResponse(
      pendingEscalation.id,
      message,
      mediaUrls
    );
  }

  // Check for commands
  const command = detectCommand(message);

  if (command) {
    return executeCommand(command, session.companyId);
  }

  // Check if manager wants to handle pending questions
  if (message.toLowerCase().includes('כן') || message.toLowerCase() === 'yes') {
    // Check if there was a recent "pending questions" query
    return startHandlingPendingQuestion(sessionId, session.companyId);
  }

  // Regular message - could be a question to the AI
  return {
    messages: ['במה אוכל לעזור? שלח "עזרה" לרשימת הפקודות.'],
  };
}

/**
 * Detect command from message
 */
function detectCommand(message: string): ManagerCommand | null {
  const lower = message.toLowerCase().trim();

  // Direct match
  if (COMMAND_MAP[lower]) {
    return COMMAND_MAP[lower];
  }

  // Partial match
  for (const [key, command] of Object.entries(COMMAND_MAP)) {
    if (lower.includes(key)) {
      return command;
    }
  }

  return null;
}

/**
 * Execute a manager command
 */
async function executeCommand(
  command: ManagerCommand,
  companyId: string
): Promise<ManagerResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://klear-ai.onrender.com';

  switch (command) {
    case 'dashboard':
      return {
        messages: ['הנה הקישור ללוח הבקרה:'],
        links: [{ title: 'לוח בקרה', url: `${baseUrl}/dashboard` }],
      };

    case 'analytics':
      const stats = await getAnalyticsSummary(companyId);
      return {
        messages: [stats],
        links: [{ title: 'לוח בקרה', url: `${baseUrl}/dashboard` }],
      };

    case 'knowledge':
      return {
        messages: ['הנה הקישור למאגר הידע:'],
        links: [{ title: 'מאגר ידע', url: `${baseUrl}/dashboard/knowledge` }],
      };

    case 'users':
      const userStats = await getUserStats(companyId);
      return {
        messages: [userStats],
        links: [{ title: 'ניהול משתמשים', url: `${baseUrl}/dashboard/users` }],
      };

    case 'settings':
      return {
        messages: ['הנה הקישור להגדרות:'],
        links: [{ title: 'הגדרות', url: `${baseUrl}/dashboard/settings` }],
      };

    case 'pending':
      return getPendingQuestionsResponse(companyId);

    case 'help':
      return {
        messages: [getHelpMessage()],
      };
  }
}

/**
 * Get analytics summary for chat
 */
async function getAnalyticsSummary(companyId: string): Promise<string> {
  const escalationStats = await getEscalationStats(companyId, 7);

  // Get message stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const totalMessages = await prisma.botMessage.count({
    where: {
      session: { companyId },
      direction: 'inbound',
      createdAt: { gte: weekAgo },
    },
  });

  const autoAnswered = totalMessages > 0
    ? Math.round(((totalMessages - escalationStats.total) / totalMessages) * 100)
    : 100;

  return `📊 סיכום שבועי:
- ${totalMessages} שאלות נשאלו
- ${autoAnswered}% נענו אוטומטית
- ${escalationStats.total} הסלמות למנהל
- ${escalationStats.pending} שאלות ממתינות
- זמן תגובה ממוצע: ${escalationStats.avgResolutionTimeMinutes} דקות`;
}

/**
 * Get user statistics
 */
async function getUserStats(companyId: string): Promise<string> {
  const employees = await prisma.whatsAppSession.count({
    where: { companyId, userRole: 'employee', isActive: true },
  });

  const managers = await prisma.whatsAppSession.count({
    where: { companyId, userRole: 'manager', isActive: true },
  });

  return `👥 משתמשים פעילים:
- ${employees} עובדים
- ${managers} מנהלים`;
}

/**
 * Get pending questions response
 */
async function getPendingQuestionsResponse(
  companyId: string
): Promise<ManagerResponse> {
  const pending = await getPendingEscalations(companyId, 5);

  if (pending.length === 0) {
    return {
      messages: ['🎉 אין שאלות ממתינות!'],
    };
  }

  const questionsList = pending
    .map((e, i) => `${i + 1}. "${e.query.slice(0, 50)}${e.query.length > 50 ? '...' : ''}" (${e.employeeName})`)
    .join('\n');

  return {
    messages: [
      `📋 יש ${pending.length} שאלות ממתינות:\n\n${questionsList}`,
      `לענות על השאלה הראשונה? (שלח "כן")`,
    ],
  };
}

/**
 * Start handling a pending question
 */
async function startHandlingPendingQuestion(
  managerSessionId: string,
  companyId: string
): Promise<ManagerResponse> {
  const pending = await getPendingEscalations(companyId, 1);

  if (pending.length === 0) {
    return {
      messages: ['🎉 אין שאלות ממתינות!'],
    };
  }

  const question = pending[0];

  // Assign to this manager
  await prisma.escalation.update({
    where: { id: question.id },
    data: {
      managerSessionId,
      status: 'in_progress',
      assignedAt: new Date(),
    },
  });

  return {
    messages: [
      `❓ שאלה מ${question.employeeName}:\n\n"${question.query}"\n\nענה כאן בטקסט או שלח תמונה/סרטון.`,
    ],
  };
}

/**
 * Handle manager's response to an escalation
 */
async function handleEscalationResponse(
  escalationId: string,
  response: string,
  mediaUrls?: string[]
): Promise<ManagerResponse> {
  try {
    const result = await resolveEscalation(escalationId, response, mediaUrls);

    return {
      messages: [
        `✅ התשובה נשלחה לעובד.`,
        `📚 המידע נוסף למאגר הידע.`,
      ],
      isEscalationResponse: true,
    };
  } catch (error) {
    console.error('Error resolving escalation:', error);
    return {
      messages: ['❌ שגיאה בשליחת התשובה. אנא נסה שוב.'],
    };
  }
}

/**
 * Get help message for managers
 */
function getHelpMessage(): string {
  return `📖 פקודות זמינות:

📊 "אנליטיקס" / "נתונים" - סיכום נתונים
📋 "ממתין" / "שאלות" - שאלות ממתינות
📚 "ידע" / "מאגר ידע" - קישור למאגר הידע
🖥️ "דשבורד" / "לוח בקרה" - קישור ללוח הבקרה
👥 "עובדים" / "משתמשים" - סטטיסטיקת משתמשים
⚙️ "הגדרות" - קישור להגדרות

כשיש שאלה ממתינה, פשוט ענה בטקסט או שלח מדיה.`;
}

/**
 * Check if message looks like a command
 */
export function isLikelyCommand(message: string): boolean {
  const lower = message.toLowerCase().trim();

  // Check all command keywords
  for (const key of Object.keys(COMMAND_MAP)) {
    if (lower.includes(key)) {
      return true;
    }
  }

  return false;
}
