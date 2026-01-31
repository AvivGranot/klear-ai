/**
 * WhatsApp Chat to Knowledge Base Importer
 * Imports Q&A pairs and conversation chunks as knowledge items
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { parseWhatsAppChat, analyzeParticipants, type ParticipantAnalysis } from './parser';
import { chunkMessages, extractQAPairs, type MessageChunk, type QAPair } from './chunker';

const prisma = new PrismaClient();

export interface ImportOptions {
  chatFilePath: string;
  mediaFolderPath?: string;
  companyId: string;
  minConfidence?: number;      // Min confidence for Q&A pairs (default: 0.6)
  createCategories?: boolean;  // Auto-create categories (default: true)
  importMedia?: boolean;       // Import media files (default: true)
  dryRun?: boolean;            // Don't actually save (default: false)
}

export interface ImportResult {
  qaPairsImported: number;
  chunksImported: number;
  categoriesCreated: number;
  mediaFilesImported: number;
  participantsAnalyzed: number;
  errors: string[];
}

// Topic to category mapping
const TOPIC_CATEGORIES: Record<string, { name: string; nameHe: string; icon: string }> = {
  'תדלוק ומשאבות': { name: 'Fuel & Pumps', nameHe: 'תדלוק ומשאבות', icon: '⛽' },
  'תשלומים וקופה': { name: 'Payments', nameHe: 'תשלומים וקופה', icon: '💳' },
  'תיעוד וחשבונות': { name: 'Documentation', nameHe: 'תיעוד וחשבונות', icon: '📄' },
  'כוח אדם ומשמרות': { name: 'HR & Shifts', nameHe: 'כוח אדם ומשמרות', icon: '👥' },
  'מוצרים וצרכניה': { name: 'Products', nameHe: 'מוצרים וצרכניה', icon: '🛒' },
  'בטיחות וחירום': { name: 'Safety', nameHe: 'בטיחות וחירום', icon: '🚨' },
  'מלאי והזמנות': { name: 'Inventory', nameHe: 'מלאי והזמנות', icon: '📦' },
  'שירות לקוחות': { name: 'Customer Service', nameHe: 'שירות לקוחות', icon: '🤝' },
  'מחירים ומבצעים': { name: 'Pricing', nameHe: 'מחירים ומבצעים', icon: '💰' },
  'תקלות ותחזוקה': { name: 'Maintenance', nameHe: 'תקלות ותחזוקה', icon: '🔧' },
};

/**
 * Import WhatsApp chat to knowledge base
 */
export async function importChatToKnowledgeBase(
  options: ImportOptions
): Promise<ImportResult> {
  const {
    chatFilePath,
    mediaFolderPath,
    companyId,
    minConfidence = 0.6,
    createCategories = true,
    importMedia = true,
    dryRun = false,
  } = options;

  const result: ImportResult = {
    qaPairsImported: 0,
    chunksImported: 0,
    categoriesCreated: 0,
    mediaFilesImported: 0,
    participantsAnalyzed: 0,
    errors: [],
  };

  console.log('📥 Starting WhatsApp Chat Import...\n');

  // Read and parse chat
  console.log('📂 Reading chat file...');
  const content = fs.readFileSync(chatFilePath, 'utf-8');
  const parseResult = parseWhatsAppChat(content);

  console.log(`   Parsed ${parseResult.messages.length} messages`);
  console.log(`   Found ${parseResult.participants.size} participants\n`);

  // Analyze participants
  console.log('👥 Analyzing participants...');
  const participants = analyzeParticipants(parseResult.messages);
  result.participantsAnalyzed = participants.length;

  // Identify managers for attribution
  const managerNames = new Set(
    participants
      .filter(p => p.likelyRole === 'manager' || p.likelyRole === 'admin')
      .map(p => p.name)
  );
  console.log(`   Identified ${managerNames.size} managers\n`);

  // Create categories if needed
  const categoryMap = new Map<string, string>();
  if (createCategories && !dryRun) {
    console.log('📁 Creating categories...');
    for (const [topic, info] of Object.entries(TOPIC_CATEGORIES)) {
      try {
        const existing = await prisma.category.findFirst({
          where: { companyId, nameHe: info.nameHe },
        });

        if (existing) {
          categoryMap.set(topic, existing.id);
        } else {
          const category = await prisma.category.create({
            data: {
              companyId,
              name: info.name,
              nameHe: info.nameHe,
              icon: info.icon,
            },
          });
          categoryMap.set(topic, category.id);
          result.categoriesCreated++;
        }
      } catch (error) {
        result.errors.push(`Failed to create category ${topic}: ${error}`);
      }
    }
    console.log(`   Created ${result.categoriesCreated} new categories\n`);
  }

  // Chunk messages
  console.log('📦 Chunking conversations...');
  const chunks = chunkMessages(parseResult.messages);
  console.log(`   Created ${chunks.length} chunks\n`);

  // Extract Q&A pairs
  console.log('❓ Extracting Q&A pairs...');
  const qaPairs = extractQAPairs(chunks);
  const highConfidenceQA = qaPairs.filter(qa => qa.confidence >= minConfidence);
  console.log(`   Found ${qaPairs.length} Q&A pairs`);
  console.log(`   ${highConfidenceQA.length} with confidence >= ${minConfidence}\n`);

  // Import Q&A pairs as FAQ items
  if (!dryRun) {
    console.log('📚 Importing Q&A pairs to knowledge base...');
    for (const qa of highConfidenceQA) {
      try {
        // Determine category from answer context
        const topic = detectTopicFromContent(qa.question + ' ' + qa.answer);
        const categoryId = topic ? categoryMap.get(topic) : undefined;

        // Check if similar item exists
        const existing = await prisma.knowledgeItem.findFirst({
          where: {
            companyId,
            titleHe: { contains: qa.question.slice(0, 50) },
          },
        });

        if (!existing) {
          await prisma.knowledgeItem.create({
            data: {
              companyId,
              title: qa.question.slice(0, 100),
              titleHe: qa.question.slice(0, 100),
              content: `שאלה: ${qa.question}\n\nתשובה: ${qa.answer}`,
              contentHe: `שאלה: ${qa.question}\n\nתשובה: ${qa.answer}`,
              type: 'faq',
              categoryId,
              tags: JSON.stringify([
                'imported',
                'whatsapp',
                managerNames.has(qa.answerBy) ? 'manager-answer' : 'peer-answer',
              ]),
              priority: managerNames.has(qa.answerBy) ? 1 : 0,
            },
          });
          result.qaPairsImported++;
        }
      } catch (error) {
        result.errors.push(`Failed to import Q&A: ${qa.question.slice(0, 30)}... - ${error}`);
      }
    }
    console.log(`   Imported ${result.qaPairsImported} Q&A pairs\n`);
  }

  // Import conversation chunks as procedures/documents
  if (!dryRun) {
    console.log('📄 Importing conversation chunks...');
    const instructionalChunks = chunks.filter(chunk => {
      // Only import chunks with instructional content
      const hasManagerContent = chunk.participants.some(p => managerNames.has(p));
      const isSubstantial = chunk.messages.length >= 4;
      return hasManagerContent && isSubstantial && chunk.topic;
    });

    for (const chunk of instructionalChunks.slice(0, 100)) { // Limit to 100 best chunks
      try {
        const categoryId = chunk.topic ? categoryMap.get(chunk.topic) : undefined;

        // Generate title from topic and date
        const dateStr = chunk.startTime.toLocaleDateString('he-IL');
        const title = `${chunk.topic || 'שיחה'} - ${dateStr}`;

        const existing = await prisma.knowledgeItem.findFirst({
          where: {
            companyId,
            titleHe: title,
          },
        });

        if (!existing) {
          await prisma.knowledgeItem.create({
            data: {
              companyId,
              title,
              titleHe: title,
              content: chunk.content,
              contentHe: chunk.content,
              type: 'document',
              categoryId,
              tags: JSON.stringify(['imported', 'whatsapp', 'conversation']),
            },
          });
          result.chunksImported++;
        }
      } catch (error) {
        result.errors.push(`Failed to import chunk: ${error}`);
      }
    }
    console.log(`   Imported ${result.chunksImported} conversation chunks\n`);
  }

  // Import media files
  if (importMedia && mediaFolderPath && !dryRun) {
    console.log('🖼️  Importing media files...');
    const mediaFiles = fs.readdirSync(mediaFolderPath)
      .filter(f => /\.(jpg|jpeg|png|gif|mp4|pdf)$/i.test(f))
      .slice(0, 200); // Limit to first 200 files

    for (const filename of mediaFiles) {
      try {
        const filePath = path.join(mediaFolderPath, filename);
        const stats = fs.statSync(filePath);
        const ext = filename.split('.').pop()?.toLowerCase() || '';

        const mimeTypes: Record<string, string> = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          mp4: 'video/mp4',
          pdf: 'application/pdf',
        };

        await prisma.mediaItem.create({
          data: {
            companyId,
            filename,
            originalName: filename,
            mimeType: mimeTypes[ext] || 'application/octet-stream',
            size: stats.size,
            url: `/media/${filename}`, // Relative path
          },
        });
        result.mediaFilesImported++;
      } catch (error) {
        // Skip duplicates silently
      }
    }
    console.log(`   Imported ${result.mediaFilesImported} media files\n`);
  }

  // Summary
  console.log('═'.repeat(50));
  console.log('✅ Import Complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Q&A Pairs: ${result.qaPairsImported}`);
  console.log(`   Conversation Chunks: ${result.chunksImported}`);
  console.log(`   Categories: ${result.categoriesCreated}`);
  console.log(`   Media Files: ${result.mediaFilesImported}`);
  if (result.errors.length > 0) {
    console.log(`   Errors: ${result.errors.length}`);
  }
  console.log('═'.repeat(50));

  return result;
}

/**
 * Detect topic from content
 */
function detectTopicFromContent(content: string): string | undefined {
  const lower = content.toLowerCase();

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
    if (pattern.test(lower)) {
      return topic;
    }
  }

  return undefined;
}

/**
 * CLI runner
 */
async function main() {
  const CHAT_PATH = '/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק/_chat.txt';
  const MEDIA_PATH = '/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק';

  // Get or create company
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'תחנת דלק אמיר בני ברק',
        slug: 'amir-bnei-brak',
        industry: 'gas_station',
        botName: 'בוט אמיר',
        welcomeMessage: 'שלום! איך אוכל לעזור?',
      },
    });
  }

  console.log(`\n🏢 Importing to company: ${company.name}\n`);

  const result = await importChatToKnowledgeBase({
    chatFilePath: CHAT_PATH,
    mediaFolderPath: MEDIA_PATH,
    companyId: company.id,
    minConfidence: 0.6,
    createCategories: true,
    importMedia: true,
    dryRun: false,
  });

  if (result.errors.length > 0) {
    console.log('\n⚠️ Errors:');
    for (const error of result.errors.slice(0, 10)) {
      console.log(`   ${error}`);
    }
    if (result.errors.length > 10) {
      console.log(`   ... and ${result.errors.length - 10} more`);
    }
  }

  await prisma.$disconnect();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
