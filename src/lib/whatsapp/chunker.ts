/**
 * WhatsApp Message Chunker
 * Groups messages into conversation chunks for knowledge base import
 */

import { WhatsAppMessage } from './parser';

export interface MessageChunk {
  id: string;
  messages: WhatsAppMessage[];
  participants: string[];
  startTime: Date;
  endTime: Date;
  content: string; // Formatted content for KB
  topic?: string; // Detected topic
  hasMedia: boolean;
  mediaFiles: string[];
  charCount: number;
}

export interface ChunkerOptions {
  maxChunkChars?: number;      // Max characters per chunk (default: 1500)
  timeGapMinutes?: number;     // New chunk if gap > this (default: 120 = 2 hours)
  minMessagesPerChunk?: number; // Min messages to form a chunk (default: 2)
}

const DEFAULT_OPTIONS: Required<ChunkerOptions> = {
  maxChunkChars: 1500,
  timeGapMinutes: 120,
  minMessagesPerChunk: 2,
};

/**
 * Chunk messages into conversation groups
 */
export function chunkMessages(
  messages: WhatsAppMessage[],
  options: ChunkerOptions = {}
): MessageChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: MessageChunk[] = [];

  if (messages.length === 0) return chunks;

  let currentChunk: WhatsAppMessage[] = [];
  let currentChunkContent = '';
  let chunkId = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prevMsg = messages[i - 1];

    // Check if we should start a new chunk
    const shouldStartNewChunk =
      currentChunk.length === 0 ||
      (prevMsg && isLargeTimeGap(prevMsg.timestamp, msg.timestamp, opts.timeGapMinutes)) ||
      (currentChunkContent.length + formatMessage(msg).length > opts.maxChunkChars);

    if (shouldStartNewChunk && currentChunk.length >= opts.minMessagesPerChunk) {
      // Save current chunk
      chunks.push(createChunk(currentChunk, ++chunkId));
      currentChunk = [];
      currentChunkContent = '';
    } else if (shouldStartNewChunk && currentChunk.length > 0 && currentChunk.length < opts.minMessagesPerChunk) {
      // Not enough messages, but need to start fresh - merge with next
      // Keep going
    }

    // Add message to current chunk
    currentChunk.push(msg);
    currentChunkContent += formatMessage(msg);
  }

  // Don't forget the last chunk
  if (currentChunk.length >= opts.minMessagesPerChunk) {
    chunks.push(createChunk(currentChunk, ++chunkId));
  } else if (currentChunk.length > 0 && chunks.length > 0) {
    // Merge small remaining chunk with the previous one
    const lastChunk = chunks[chunks.length - 1];
    const mergedMessages = [...lastChunk.messages, ...currentChunk];
    chunks[chunks.length - 1] = createChunk(mergedMessages, parseInt(lastChunk.id.split('_')[1]));
  } else if (currentChunk.length > 0) {
    // Only chunk we have
    chunks.push(createChunk(currentChunk, ++chunkId));
  }

  return chunks;
}

/**
 * Check if there's a large time gap between messages
 */
function isLargeTimeGap(time1: Date, time2: Date, gapMinutes: number): boolean {
  const diffMs = Math.abs(time2.getTime() - time1.getTime());
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes > gapMinutes;
}

/**
 * Format a single message for chunk content
 */
function formatMessage(msg: WhatsAppMessage): string {
  const time = msg.timestamp.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit'
  });

  let content = msg.content;

  // Replace media reference with description
  if (msg.mediaFilename) {
    const mediaType = getMediaType(msg.mediaFilename);
    content = content.replace(/<מצורף:[^>]+>/, `[${mediaType}]`);
  }

  return `[${time}] ${msg.sender}: ${content}\n`;
}

/**
 * Get human-readable media type
 */
function getMediaType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const typeMap: Record<string, string> = {
    jpg: 'תמונה',
    jpeg: 'תמונה',
    png: 'תמונה',
    gif: 'GIF',
    webp: 'תמונה',
    mp4: 'סרטון',
    mov: 'סרטון',
    avi: 'סרטון',
    mp3: 'הקלטה',
    opus: 'הקלטה קולית',
    ogg: 'הקלטה קולית',
    pdf: 'מסמך PDF',
    doc: 'מסמך',
    docx: 'מסמך',
    vcf: 'איש קשר',
  };

  return typeMap[ext] || 'קובץ';
}

/**
 * Create a chunk object from messages
 */
function createChunk(messages: WhatsAppMessage[], id: number): MessageChunk {
  const participants = [...new Set(messages.map(m => m.sender))];
  const mediaFiles = messages
    .filter(m => m.mediaFilename)
    .map(m => m.mediaFilename!);

  // Format full content
  const content = messages.map(formatMessage).join('');

  // Try to detect topic from content
  const topic = detectTopic(messages);

  return {
    id: `chunk_${id}`,
    messages,
    participants,
    startTime: messages[0].timestamp,
    endTime: messages[messages.length - 1].timestamp,
    content,
    topic,
    hasMedia: mediaFiles.length > 0,
    mediaFiles,
    charCount: content.length,
  };
}

/**
 * Detect topic from chunk messages
 */
function detectTopic(messages: WhatsAppMessage[]): string | undefined {
  const allContent = messages.map(m => m.content).join(' ').toLowerCase();

  // Topic patterns for gas station domain
  const topicPatterns: Array<{ pattern: RegExp; topic: string }> = [
    { pattern: /משאב|תדלוק|דלק|בנזין|סולר/i, topic: 'תדלוק ומשאבות' },
    { pattern: /קופה|עסקה|תשלום|מזומן|אשראי|ביט|פייבוקס/i, topic: 'תשלומים וקופה' },
    { pattern: /מלאי|חסר|הזמנ|ספק|משלוח/i, topic: 'מלאי והזמנות' },
    { pattern: /עובד|משמרת|שעות|חופש/i, topic: 'כוח אדם ומשמרות' },
    { pattern: /לקוח|שירות|תלונ/i, topic: 'שירות לקוחות' },
    { pattern: /מכיר|הנחה|מבצע|קופון/i, topic: 'מחירים ומבצעים' },
    { pattern: /בטיח|חירום|כיבוי|אש/i, topic: 'בטיחות וחירום' },
    { pattern: /מקרר|קפה|חלב|מזון|מוצר/i, topic: 'מוצרים וצרכניה' },
    { pattern: /תקלה|בעיה|תיקון|שירות טכני/i, topic: 'תקלות ותחזוקה' },
    { pattern: /צילום|תמונה|חשבונית|קבלה/i, topic: 'תיעוד וחשבונות' },
  ];

  for (const { pattern, topic } of topicPatterns) {
    if (pattern.test(allContent)) {
      return topic;
    }
  }

  return undefined;
}

/**
 * Extract Q&A pairs from chunks
 * Useful for building FAQ knowledge base
 */
export interface QAPair {
  question: string;
  questionBy: string;
  answer: string;
  answerBy: string;
  timestamp: Date;
  confidence: number; // How confident we are this is a real Q&A
}

export function extractQAPairs(chunks: MessageChunk[]): QAPair[] {
  const qaPairs: QAPair[] = [];

  for (const chunk of chunks) {
    const messages = chunk.messages;

    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      const nextMsg = messages[i + 1];

      // Check if current message is a question
      if (isQuestion(msg.content)) {
        // Find answer (next message from different sender)
        const answerMsg = findAnswer(messages, i);

        if (answerMsg) {
          const confidence = calculateQAConfidence(msg, answerMsg);

          if (confidence > 0.5) {
            qaPairs.push({
              question: msg.content,
              questionBy: msg.sender,
              answer: answerMsg.content,
              answerBy: answerMsg.sender,
              timestamp: msg.timestamp,
              confidence,
            });
          }
        }
      }
    }
  }

  return qaPairs;
}

/**
 * Check if message is a question
 */
function isQuestion(content: string): boolean {
  // Direct question mark
  if (content.includes('?')) return true;

  // Hebrew question patterns
  const questionPatterns = [
    /^(מה|מי|איך|איפה|מתי|למה|כמה|האם|איזה)/,
    /^(יש|אין|צריך|אפשר)/,
    /מישהו (יודע|ראה|יכול)/,
  ];

  return questionPatterns.some(p => p.test(content));
}

/**
 * Find the most likely answer to a question
 */
function findAnswer(
  messages: WhatsAppMessage[],
  questionIndex: number
): WhatsAppMessage | null {
  const questionMsg = messages[questionIndex];
  const maxLookAhead = 5; // Look at next 5 messages max

  for (let i = questionIndex + 1; i < Math.min(messages.length, questionIndex + maxLookAhead + 1); i++) {
    const msg = messages[i];

    // Answer should be from different sender
    if (msg.sender === questionMsg.sender) continue;

    // Skip very short responses (likely just acknowledgments)
    if (msg.content.length < 10 && !msg.mediaFilename) continue;

    // Skip questions (someone else asking)
    if (isQuestion(msg.content)) continue;

    // This looks like an answer
    return msg;
  }

  return null;
}

/**
 * Calculate confidence that this is a real Q&A pair
 */
function calculateQAConfidence(
  question: WhatsAppMessage,
  answer: WhatsAppMessage
): number {
  let confidence = 0.5; // Base confidence

  // Time gap (answer within 30 minutes = higher confidence)
  const gapMinutes = (answer.timestamp.getTime() - question.timestamp.getTime()) / (1000 * 60);
  if (gapMinutes < 5) confidence += 0.2;
  else if (gapMinutes < 30) confidence += 0.1;
  else if (gapMinutes > 120) confidence -= 0.2;

  // Answer length (longer = more informative)
  if (answer.content.length > 100) confidence += 0.1;
  if (answer.content.length > 200) confidence += 0.1;

  // Answer has media (instructional media = high confidence)
  if (answer.mediaFilename) confidence += 0.15;

  // Question specificity
  if (question.content.includes('איך') || question.content.includes('מה עושים')) {
    confidence += 0.1; // "How" questions likely get instructional answers
  }

  return Math.min(confidence, 1.0);
}

/**
 * Get chunking statistics
 */
export interface ChunkStats {
  totalChunks: number;
  avgMessagesPerChunk: number;
  avgCharsPerChunk: number;
  chunksWithMedia: number;
  topicDistribution: Map<string, number>;
}

export function getChunkStats(chunks: MessageChunk[]): ChunkStats {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgMessagesPerChunk: 0,
      avgCharsPerChunk: 0,
      chunksWithMedia: 0,
      topicDistribution: new Map(),
    };
  }

  const totalMessages = chunks.reduce((sum, c) => sum + c.messages.length, 0);
  const totalChars = chunks.reduce((sum, c) => sum + c.charCount, 0);
  const chunksWithMedia = chunks.filter(c => c.hasMedia).length;

  const topicDistribution = new Map<string, number>();
  for (const chunk of chunks) {
    const topic = chunk.topic || 'לא מזוהה';
    topicDistribution.set(topic, (topicDistribution.get(topic) || 0) + 1);
  }

  return {
    totalChunks: chunks.length,
    avgMessagesPerChunk: Math.round(totalMessages / chunks.length * 10) / 10,
    avgCharsPerChunk: Math.round(totalChars / chunks.length),
    chunksWithMedia,
    topicDistribution,
  };
}
