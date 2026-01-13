/**
 * Onboarding Flow Handler
 * Handles new user registration and role selection
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type OnboardingStep = 'intro' | 'role_select' | 'complete';

export interface OnboardingResponse {
  messages: string[];
  buttons?: Array<{ id: string; title: string }>;
  nextStep: OnboardingStep;
}

// Message templates
const MESSAGES = {
  intro: (companyName: string) => `היי, אני העוזר האישי של ${companyName}.
אני כאן בשביל לעזור לך לקבל תשובות לשאלות מהר יותר, לחסוך התקשרויות עם המנהלים, ובעיקר לתת טיב שירות איכותי ומהיר יותר ללקוחות.`,

  roleSelection: `לפני שנתחיל, האם אתה מנהל או עובד?`,

  roleButtons: [
    { id: 'employee', title: '👷 עובד' },
    { id: 'manager', title: '👔 מנהל' },
  ],

  roleNotUnderstood: `לא הבנתי. אנא בחר:`,

  employeeWelcome: `מעולה! אני כאן לעזור לך עם כל שאלה.
פשוט שלח לי מה שאתה צריך לדעת ואני אנסה לעזור.
אם לא אדע לענות, אעביר למנהל שלך.

במה אוכל לעזור?`,

  managerWelcome: `מעולה! בתור מנהל, אני אשלח אליך:
- שאלות שלא הצלחתי לענות עליהן
- בקשות להסלמה מעובדים
- התראות חשובות

אתה יכול גם לבקש ממני:
- "דשבורד" - קישור ללוח הבקרה
- "אנליטיקס" - סיכום נתונים
- "ידע" - לראות את מאגר הידע

במה אוכל לעזור?`,
};

/**
 * Handle onboarding flow for a session
 */
export async function handleOnboarding(
  sessionId: string,
  userMessage?: string
): Promise<OnboardingResponse> {
  const session = await prisma.whatsAppSession.findUnique({
    where: { id: sessionId },
    include: { company: true },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const companyName = session.company.name;

  switch (session.onboardingStep) {
    case 'intro':
      // First interaction - send intro + role selection
      await prisma.whatsAppSession.update({
        where: { id: sessionId },
        data: { onboardingStep: 'role_select' },
      });

      return {
        messages: [
          MESSAGES.intro(companyName),
          MESSAGES.roleSelection,
        ],
        buttons: MESSAGES.roleButtons,
        nextStep: 'role_select',
      };

    case 'role_select':
      // Process role selection
      const role = detectRole(userMessage);

      if (!role) {
        return {
          messages: [MESSAGES.roleNotUnderstood],
          buttons: MESSAGES.roleButtons,
          nextStep: 'role_select',
        };
      }

      // Update session with role
      await prisma.whatsAppSession.update({
        where: { id: sessionId },
        data: {
          userRole: role,
          onboardingStep: 'complete',
        },
      });

      if (role === 'manager') {
        return {
          messages: [MESSAGES.managerWelcome],
          nextStep: 'complete',
        };
      } else {
        return {
          messages: [MESSAGES.employeeWelcome],
          nextStep: 'complete',
        };
      }

    case 'complete':
    default:
      // Onboarding already complete, shouldn't reach here
      return {
        messages: ['במה אוכל לעזור?'],
        nextStep: 'complete',
      };
  }
}

/**
 * Detect role from user message
 */
function detectRole(message?: string): 'employee' | 'manager' | null {
  if (!message) return null;

  const lower = message.toLowerCase().trim();

  // Button IDs (from interactive buttons)
  if (lower === 'employee' || lower === 'עובד') return 'employee';
  if (lower === 'manager' || lower === 'מנהל') return 'manager';

  // Natural language detection
  if (lower.includes('עובד') || lower.includes('employee')) return 'employee';
  if (lower.includes('מנהל') || lower.includes('manager')) return 'manager';

  // Emoji shortcuts
  if (lower.includes('👷')) return 'employee';
  if (lower.includes('👔')) return 'manager';

  return null;
}

/**
 * Create a new WhatsApp session for a phone number
 */
export async function createSession(
  phoneNumber: string,
  companyId: string
): Promise<string> {
  const session = await prisma.whatsAppSession.create({
    data: {
      phoneNumber,
      companyId,
      onboardingStep: 'intro',
    },
  });

  return session.id;
}

/**
 * Get or create a session for a phone number
 */
export async function getOrCreateSession(
  phoneNumber: string,
  companyId: string
): Promise<{ sessionId: string; isNew: boolean }> {
  // Check for existing session
  const existing = await prisma.whatsAppSession.findUnique({
    where: {
      phoneNumber_companyId: {
        phoneNumber,
        companyId,
      },
    },
  });

  if (existing) {
    // Update last message time
    await prisma.whatsAppSession.update({
      where: { id: existing.id },
      data: { lastMessageAt: new Date() },
    });

    return { sessionId: existing.id, isNew: false };
  }

  // Create new session
  const sessionId = await createSession(phoneNumber, companyId);
  return { sessionId, isNew: true };
}

/**
 * Check if session is in onboarding
 */
export async function isOnboarding(sessionId: string): Promise<boolean> {
  const session = await prisma.whatsAppSession.findUnique({
    where: { id: sessionId },
    select: { onboardingStep: true },
  });

  return session?.onboardingStep !== 'complete';
}

/**
 * Get session role
 */
export async function getSessionRole(
  sessionId: string
): Promise<'employee' | 'manager' | null> {
  const session = await prisma.whatsAppSession.findUnique({
    where: { id: sessionId },
    select: { userRole: true },
  });

  return session?.userRole as 'employee' | 'manager' | null;
}
