/**
 * Message Router
 * Main entry point for handling incoming WhatsApp messages
 * Routes to appropriate handler based on session state and role
 */

import { PrismaClient } from '@prisma/client';
import {
  handleOnboarding,
  getOrCreateSession,
  isOnboarding,
  getSessionRole,
} from './onboarding';
import { handleManagerMessage } from './manager-chat';
import { handleEmployeeQuery } from './employee-chat';

const prisma = new PrismaClient();

export interface IncomingMessage {
  from: string;           // Phone number
  companyId: string;      // Company ID
  content: string;        // Message content
  mediaUrls?: string[];   // Media attachments
  waMessageId?: string;   // WhatsApp message ID
}

export interface OutgoingMessage {
  to: string;
  messages: string[];
  buttons?: Array<{ id: string; title: string }>;
  mediaUrls?: string[];
  links?: Array<{ title: string; url: string }>;
}

export interface RouteResult {
  responses: OutgoingMessage[];
  sessionId: string;
}

/**
 * Route incoming message to appropriate handler
 */
export async function routeMessage(
  incoming: IncomingMessage
): Promise<RouteResult> {
  const { from, companyId, content, mediaUrls, waMessageId } = incoming;

  // Get or create session
  const { sessionId, isNew } = await getOrCreateSession(from, companyId);

  // Log inbound message
  await logMessage(sessionId, 'inbound', content, mediaUrls, waMessageId);

  // Check if in onboarding
  if (isNew || await isOnboarding(sessionId)) {
    const response = await handleOnboarding(sessionId, content);

    return {
      sessionId,
      responses: [{
        to: from,
        messages: response.messages,
        buttons: response.buttons,
      }],
    };
  }

  // Get user role
  const role = await getSessionRole(sessionId);

  if (role === 'manager') {
    // Handle manager message
    const response = await handleManagerMessage(sessionId, content, mediaUrls);

    const outgoing: OutgoingMessage = {
      to: from,
      messages: response.messages,
      links: response.links,
    };

    if (response.mediaUrls) {
      outgoing.mediaUrls = response.mediaUrls;
    }

    return {
      sessionId,
      responses: [outgoing],
    };
  } else {
    // Handle employee query
    const response = await handleEmployeeQuery(sessionId, content);

    const outgoing: OutgoingMessage = {
      to: from,
      messages: response.messages,
    };

    if (response.mediaUrls) {
      outgoing.mediaUrls = response.mediaUrls;
    }

    return {
      sessionId,
      responses: [outgoing],
    };
  }
}

/**
 * Log a message to the database
 */
async function logMessage(
  sessionId: string,
  direction: 'inbound' | 'outbound',
  content: string,
  mediaUrls?: string[],
  waMessageId?: string
): Promise<string> {
  const message = await prisma.botMessage.create({
    data: {
      sessionId,
      direction,
      content,
      mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
      waMessageId,
      messageType: mediaUrls && mediaUrls.length > 0 ? 'media' : 'text',
    },
  });

  return message.id;
}

/**
 * Send outgoing messages
 * This function would integrate with the WhatsApp Business API
 */
export async function sendMessages(
  sessionId: string,
  outgoing: OutgoingMessage
): Promise<void> {
  // Log outbound messages
  for (const message of outgoing.messages) {
    await logMessage(sessionId, 'outbound', message);
  }

  // TODO: Integrate with META WhatsApp Business API
  // This is where you would send the actual WhatsApp messages
  console.log(`📤 Would send to ${outgoing.to}:`);
  for (const msg of outgoing.messages) {
    console.log(`   ${msg}`);
  }

  if (outgoing.buttons) {
    console.log(`   Buttons: ${outgoing.buttons.map(b => b.title).join(', ')}`);
  }

  if (outgoing.links) {
    for (const link of outgoing.links) {
      console.log(`   Link: ${link.title} - ${link.url}`);
    }
  }

  if (outgoing.mediaUrls) {
    console.log(`   Media: ${outgoing.mediaUrls.join(', ')}`);
  }
}

/**
 * Forward manager response to employee
 * Called after manager resolves an escalation
 */
export async function forwardToEmployee(
  employeeSessionId: string,
  response: string,
  mediaUrls?: string[]
): Promise<void> {
  const session = await prisma.whatsAppSession.findUnique({
    where: { id: employeeSessionId },
  });

  if (!session) {
    console.error('Employee session not found:', employeeSessionId);
    return;
  }

  const outgoing: OutgoingMessage = {
    to: session.phoneNumber,
    messages: [
      `📬 התקבלה תשובה מהמנהל:`,
      response,
    ],
  };

  if (mediaUrls && mediaUrls.length > 0) {
    outgoing.mediaUrls = mediaUrls;
    outgoing.messages.push(`📎 צורפה גם מדיה רלוונטית.`);
  }

  await sendMessages(employeeSessionId, outgoing);
}

/**
 * Notify manager about new escalation
 */
export async function notifyManager(
  managerSessionId: string,
  employeeName: string,
  query: string
): Promise<void> {
  const session = await prisma.whatsAppSession.findUnique({
    where: { id: managerSessionId },
  });

  if (!session) {
    console.error('Manager session not found:', managerSessionId);
    return;
  }

  const outgoing: OutgoingMessage = {
    to: session.phoneNumber,
    messages: [
      `❓ שאלה חדשה מ${employeeName}:\n\n"${query}"\n\nענה כאן בטקסט או שלח תמונה/סרטון.`,
    ],
  };

  await sendMessages(managerSessionId, outgoing);
}

/**
 * Broadcast message to all users of a role
 */
export async function broadcastToRole(
  companyId: string,
  role: 'employee' | 'manager',
  message: string
): Promise<number> {
  const sessions = await prisma.whatsAppSession.findMany({
    where: {
      companyId,
      userRole: role,
      isActive: true,
    },
  });

  let sentCount = 0;
  for (const session of sessions) {
    try {
      await sendMessages(session.id, {
        to: session.phoneNumber,
        messages: [message],
      });
      sentCount++;
    } catch (error) {
      console.error(`Failed to send to ${session.phoneNumber}:`, error);
    }
  }

  return sentCount;
}
