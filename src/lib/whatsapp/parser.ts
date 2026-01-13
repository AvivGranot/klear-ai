/**
 * WhatsApp Chat Parser
 * Handles Hebrew date format and media references
 */

export interface WhatsAppMessage {
  id: string;
  timestamp: Date;
  sender: string;
  content: string;
  mediaFilename?: string;
  isSystemMessage: boolean;
  rawLine: string;
}

export interface ParseResult {
  messages: WhatsAppMessage[];
  participants: Set<string>;
  mediaFiles: string[];
  dateRange: { start: Date; end: Date } | null;
  skippedLines: number;
}

// Hebrew system message patterns to skip
const SYSTEM_MESSAGE_PATTERNS = [
  /בהמתנה להודעה זו/,
  /הודעה זו נמחקה/,
  /התמונה הושמטה/,
  /הסרטון הושמט/,
  /צורפת/,
  /הצטרף.*לקבוצה/,
  /יצא.*מהקבוצה/,
  /הקבוצה נוצרה/,
  /שינה.*את שם הקבוצה/,
  /שינה.*את תמונת הקבוצה/,
  /שינה.*את תיאור הקבוצה/,
  /הוסיף.*את/,
  /הסיר.*את/,
  /מספר הטלפון.*הוחלף/,
  /ההודעות והשיחות מוצפנות/,
];

// Media reference pattern: <מצורף: filename>
const MEDIA_PATTERN = /<מצורף:\s*([^>]+)>/;

// WhatsApp message line pattern: [DD.M.YYYY, HH:MM:SS] Sender: Message
// Also handles [DD/M/YYYY, HH:MM:SS] format
const MESSAGE_LINE_PATTERN = /^\[(\d{1,2})[./](\d{1,2})[./](\d{4}),?\s*(\d{1,2}):(\d{2}):?(\d{2})?\]\s*([^:]+):\s*(.*)$/;

/**
 * Parse a WhatsApp chat export file content
 */
export function parseWhatsAppChat(content: string): ParseResult {
  const lines = content.split('\n');
  const messages: WhatsAppMessage[] = [];
  const participants = new Set<string>();
  const mediaFiles: string[] = [];
  let skippedLines = 0;

  let currentMessage: WhatsAppMessage | null = null;
  let messageId = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Try to match a new message line
    const match = trimmedLine.match(MESSAGE_LINE_PATTERN);

    if (match) {
      // Save previous message if exists
      if (currentMessage) {
        messages.push(currentMessage);
      }

      const [, day, month, year, hour, minute, second, sender, content] = match;

      // Parse timestamp
      const timestamp = new Date(
        parseInt(year),
        parseInt(month) - 1, // JS months are 0-indexed
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        second ? parseInt(second) : 0
      );

      // Clean sender name (remove RTL/LTR marks)
      const cleanSender = cleanText(sender);

      // Check if system message
      const isSystemMessage = isSystemMsg(content);

      if (isSystemMessage) {
        skippedLines++;
        currentMessage = null;
        continue;
      }

      // Check for media
      const mediaMatch = content.match(MEDIA_PATTERN);
      const mediaFilename = mediaMatch ? mediaMatch[1].trim() : undefined;

      if (mediaFilename) {
        mediaFiles.push(mediaFilename);
      }

      // Create message
      currentMessage = {
        id: `msg_${++messageId}`,
        timestamp,
        sender: cleanSender,
        content: cleanText(content),
        mediaFilename,
        isSystemMessage: false,
        rawLine: trimmedLine,
      };

      participants.add(cleanSender);
    } else if (currentMessage) {
      // This is a continuation of the previous message (multi-line)
      currentMessage.content += '\n' + cleanText(trimmedLine);
      currentMessage.rawLine += '\n' + trimmedLine;
    } else {
      // Line doesn't match pattern and no current message
      skippedLines++;
    }
  }

  // Don't forget the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  // Calculate date range
  const dateRange = messages.length > 0
    ? {
        start: messages[0].timestamp,
        end: messages[messages.length - 1].timestamp,
      }
    : null;

  return {
    messages,
    participants,
    mediaFiles,
    dateRange,
    skippedLines,
  };
}

/**
 * Check if content is a system message
 */
function isSystemMsg(content: string): boolean {
  return SYSTEM_MESSAGE_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Clean text by removing RTL/LTR marks and other invisible characters
 */
function cleanText(text: string): string {
  return text
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '') // RTL/LTR marks
    .replace(/\u200B/g, '') // Zero-width space
    .replace(/‏/g, '') // Right-to-left mark entity
    .replace(/‫/g, '') // Right-to-left embedding entity
    .replace(/‬/g, '') // Pop directional formatting entity
    .trim();
}

/**
 * Analyze participants to identify likely roles
 */
export interface ParticipantAnalysis {
  name: string;
  messageCount: number;
  questionsAsked: number;
  mediaShared: number;
  instructionsGiven: number;
  avgMessageLength: number;
  firstMessageDate: Date;
  lastMessageDate: Date;
  likelyRole: 'manager' | 'employee' | 'admin' | 'unknown';
  roleIndicators: string[];
}

export function analyzeParticipants(messages: WhatsAppMessage[]): ParticipantAnalysis[] {
  const participantData = new Map<string, {
    messages: WhatsAppMessage[];
    questions: number;
    media: number;
    instructions: number;
  }>();

  // Collect data for each participant
  for (const msg of messages) {
    if (!participantData.has(msg.sender)) {
      participantData.set(msg.sender, {
        messages: [],
        questions: 0,
        media: 0,
        instructions: 0,
      });
    }

    const data = participantData.get(msg.sender)!;
    data.messages.push(msg);

    if (msg.content.includes('?')) {
      data.questions++;
    }

    if (msg.mediaFilename) {
      data.media++;
    }

    // Detect instruction-like messages (imperatives, announcements)
    if (isInstructionLike(msg.content)) {
      data.instructions++;
    }
  }

  const results: ParticipantAnalysis[] = [];

  for (const [name, data] of participantData) {
    const totalMessages = data.messages.length;
    const avgLength = data.messages.reduce((sum, m) => sum + m.content.length, 0) / totalMessages;

    const roleIndicators: string[] = [];
    let likelyRole: ParticipantAnalysis['likelyRole'] = 'unknown';

    // Check name for role indicators
    if (name.includes('מנהל')) {
      roleIndicators.push('Has "מנהל" (manager) in name');
      likelyRole = 'manager';
    }
    if (name.includes('עובד')) {
      roleIndicators.push('Has "עובד" (worker) in name');
      likelyRole = 'employee';
    }
    if (name.includes('משרד')) {
      roleIndicators.push('Has "משרד" (office) in name');
      likelyRole = 'admin';
    }

    // Behavioral indicators
    const questionRatio = data.questions / totalMessages;
    const instructionRatio = data.instructions / totalMessages;
    const mediaRatio = data.media / totalMessages;

    if (likelyRole === 'unknown') {
      // High instruction ratio + media sharing = likely manager
      if (instructionRatio > 0.2 && totalMessages > 50) {
        roleIndicators.push('High instruction ratio');
        likelyRole = 'manager';
      }
      // High question ratio = likely employee
      else if (questionRatio > 0.3 && totalMessages < 100) {
        roleIndicators.push('High question ratio');
        likelyRole = 'employee';
      }
      // Many messages + mixed = could be either
      else if (totalMessages > 200) {
        roleIndicators.push('Very active participant');
        likelyRole = 'manager';
      }
    }

    results.push({
      name,
      messageCount: totalMessages,
      questionsAsked: data.questions,
      mediaShared: data.media,
      instructionsGiven: data.instructions,
      avgMessageLength: Math.round(avgLength),
      firstMessageDate: data.messages[0].timestamp,
      lastMessageDate: data.messages[data.messages.length - 1].timestamp,
      likelyRole,
      roleIndicators,
    });
  }

  // Sort by message count descending
  return results.sort((a, b) => b.messageCount - a.messageCount);
}

/**
 * Detect if a message is instruction-like
 */
function isInstructionLike(content: string): boolean {
  const instructionPatterns = [
    /^(נא|אנא|בבקשה)/,           // Please / Please
    /^(שימו לב|חשוב)/,           // Pay attention / Important
    /^(אני מבקש|מבקש)/,          // I request
    /לא (לעשות|להשתמש|לשלוח)/,  // Don't do/use/send
    /(חייבים|צריכים|חובה)/,      // Must / Need to / Required
    /^(תודה|כל הכבוד)/,          // Thank you / Well done (often follows instructions)
    /(👍|✅|🙏)/,                 // Approval emojis often from managers
  ];

  return instructionPatterns.some(pattern => pattern.test(content));
}

/**
 * Get chat statistics
 */
export interface ChatStats {
  totalMessages: number;
  totalParticipants: number;
  totalMediaFiles: number;
  dateRange: { start: Date; end: Date } | null;
  messagesPerDay: number;
  messagesPerParticipant: Map<string, number>;
  topParticipants: Array<{ name: string; count: number }>;
  mediaTypes: Map<string, number>;
}

export function getChatStats(parseResult: ParseResult): ChatStats {
  const { messages, participants, mediaFiles, dateRange } = parseResult;

  // Messages per participant
  const messagesPerParticipant = new Map<string, number>();
  for (const msg of messages) {
    messagesPerParticipant.set(
      msg.sender,
      (messagesPerParticipant.get(msg.sender) || 0) + 1
    );
  }

  // Top participants
  const topParticipants = Array.from(messagesPerParticipant.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Media types
  const mediaTypes = new Map<string, number>();
  for (const file of mediaFiles) {
    const ext = file.split('.').pop()?.toLowerCase() || 'unknown';
    mediaTypes.set(ext, (mediaTypes.get(ext) || 0) + 1);
  }

  // Messages per day
  let messagesPerDay = 0;
  if (dateRange) {
    const days = Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    messagesPerDay = Math.round(messages.length / Math.max(days, 1) * 10) / 10;
  }

  return {
    totalMessages: messages.length,
    totalParticipants: participants.size,
    totalMediaFiles: mediaFiles.length,
    dateRange,
    messagesPerDay,
    messagesPerParticipant,
    topParticipants,
    mediaTypes,
  };
}
