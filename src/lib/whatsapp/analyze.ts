/**
 * WhatsApp Chat Analysis Script
 * Run with: npx tsx src/lib/whatsapp/analyze.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  parseWhatsAppChat,
  getChatStats,
  analyzeParticipants,
  type ParseResult,
  type ChatStats,
  type ParticipantAnalysis,
} from './parser';
import {
  chunkMessages,
  extractQAPairs,
  getChunkStats,
  type MessageChunk,
  type QAPair,
} from './chunker';

const CHAT_PATH = '/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק/_chat.txt';

async function main() {
  console.log('📱 WhatsApp Chat Analysis for Klear-AI\n');
  console.log('='.repeat(60));

  // Read chat file
  console.log('\n📂 Reading chat file...');
  const content = fs.readFileSync(CHAT_PATH, 'utf-8');
  console.log(`   File size: ${(content.length / 1024 / 1024).toFixed(2)} MB`);

  // Parse chat
  console.log('\n🔍 Parsing messages...');
  const parseResult = parseWhatsAppChat(content);
  const stats = getChatStats(parseResult);

  // Print basic stats
  console.log('\n' + '='.repeat(60));
  console.log('📊 CHAT STATISTICS');
  console.log('='.repeat(60));

  console.log(`\n📨 Total Messages: ${stats.totalMessages.toLocaleString()}`);
  console.log(`👥 Total Participants: ${stats.totalParticipants}`);
  console.log(`🖼️  Total Media Files: ${stats.totalMediaFiles.toLocaleString()}`);

  if (stats.dateRange) {
    console.log(`\n📅 Date Range:`);
    console.log(`   Start: ${stats.dateRange.start.toLocaleDateString('he-IL')}`);
    console.log(`   End: ${stats.dateRange.end.toLocaleDateString('he-IL')}`);
    const days = Math.ceil(
      (stats.dateRange.end.getTime() - stats.dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    console.log(`   Duration: ${days} days`);
  }

  console.log(`\n📈 Messages per day: ${stats.messagesPerDay}`);
  console.log(`⏭️  Skipped lines: ${parseResult.skippedLines}`);

  // Media types
  console.log('\n🎬 Media Types:');
  const sortedMedia = Array.from(stats.mediaTypes.entries()).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedMedia) {
    console.log(`   .${type}: ${count}`);
  }

  // Participant analysis
  console.log('\n' + '='.repeat(60));
  console.log('👥 PARTICIPANT ANALYSIS');
  console.log('='.repeat(60));

  const participants = analyzeParticipants(parseResult.messages);

  console.log('\n📊 Messages per participant:');
  for (const p of participants) {
    const roleEmoji = getRoleEmoji(p.likelyRole);
    console.log(`   ${roleEmoji} ${p.name}: ${p.messageCount} messages`);
    console.log(`      Questions: ${p.questionsAsked} | Media: ${p.mediaShared} | Instructions: ${p.instructionsGiven}`);
    console.log(`      Role: ${p.likelyRole} ${p.roleIndicators.length > 0 ? `(${p.roleIndicators.join(', ')})` : ''}`);
    console.log('');
  }

  // Identified Managers vs Employees
  console.log('\n' + '='.repeat(60));
  console.log('🏷️  ROLE CLASSIFICATION');
  console.log('='.repeat(60));

  const managers = participants.filter(p => p.likelyRole === 'manager' || p.likelyRole === 'admin');
  const employees = participants.filter(p => p.likelyRole === 'employee');
  const unknown = participants.filter(p => p.likelyRole === 'unknown');

  console.log('\n👔 Managers/Admins:');
  for (const p of managers) {
    console.log(`   • ${p.name} (${p.messageCount} msgs)`);
  }

  console.log('\n👷 Employees:');
  for (const p of employees) {
    console.log(`   • ${p.name} (${p.messageCount} msgs)`);
  }

  if (unknown.length > 0) {
    console.log('\n❓ Unknown:');
    for (const p of unknown) {
      console.log(`   • ${p.name} (${p.messageCount} msgs)`);
    }
  }

  // Chunking analysis
  console.log('\n' + '='.repeat(60));
  console.log('📦 CONVERSATION CHUNKS');
  console.log('='.repeat(60));

  const chunks = chunkMessages(parseResult.messages);
  const chunkStats = getChunkStats(chunks);

  console.log(`\n📊 Chunk Statistics:`);
  console.log(`   Total chunks: ${chunkStats.totalChunks}`);
  console.log(`   Avg messages/chunk: ${chunkStats.avgMessagesPerChunk}`);
  console.log(`   Avg chars/chunk: ${chunkStats.avgCharsPerChunk}`);
  console.log(`   Chunks with media: ${chunkStats.chunksWithMedia}`);

  console.log('\n📁 Topic Distribution:');
  const sortedTopics = Array.from(chunkStats.topicDistribution.entries()).sort((a, b) => b[1] - a[1]);
  for (const [topic, count] of sortedTopics) {
    console.log(`   ${topic}: ${count} chunks`);
  }

  // Q&A Extraction
  console.log('\n' + '='.repeat(60));
  console.log('❓ EXTRACTED Q&A PAIRS');
  console.log('='.repeat(60));

  const qaPairs = extractQAPairs(chunks);
  console.log(`\n📊 Found ${qaPairs.length} Q&A pairs`);

  // Show top 5 high-confidence Q&A pairs
  const topQA = qaPairs
    .filter(qa => qa.confidence > 0.6)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  console.log('\n🌟 Top 5 High-Confidence Q&A Pairs:');
  for (const qa of topQA) {
    console.log(`\n   Q (${qa.questionBy}): ${qa.question.slice(0, 80)}${qa.question.length > 80 ? '...' : ''}`);
    console.log(`   A (${qa.answerBy}): ${qa.answer.slice(0, 100)}${qa.answer.length > 100 ? '...' : ''}`);
    console.log(`   Confidence: ${(qa.confidence * 100).toFixed(0)}%`);
  }

  // Sample chunk
  console.log('\n' + '='.repeat(60));
  console.log('📝 SAMPLE CHUNK');
  console.log('='.repeat(60));

  const sampleChunk = chunks.find(c => c.topic && c.messages.length > 3) || chunks[0];
  if (sampleChunk) {
    console.log(`\n📌 Chunk ID: ${sampleChunk.id}`);
    console.log(`   Topic: ${sampleChunk.topic || 'Not detected'}`);
    console.log(`   Messages: ${sampleChunk.messages.length}`);
    console.log(`   Participants: ${sampleChunk.participants.join(', ')}`);
    console.log(`   Time: ${sampleChunk.startTime.toLocaleString('he-IL')} - ${sampleChunk.endTime.toLocaleTimeString('he-IL')}`);
    console.log(`\n   Content Preview:`);
    console.log('   ' + '-'.repeat(50));
    console.log(sampleChunk.content.split('\n').slice(0, 10).map(l => '   ' + l).join('\n'));
    if (sampleChunk.messages.length > 10) {
      console.log('   ...');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Analysis Complete!');
  console.log('='.repeat(60));

  // Return data for potential further use
  return {
    parseResult,
    stats,
    participants,
    chunks,
    chunkStats,
    qaPairs,
  };
}

function getRoleEmoji(role: string): string {
  switch (role) {
    case 'manager': return '👔';
    case 'admin': return '🏢';
    case 'employee': return '👷';
    default: return '❓';
  }
}

// Run analysis
main().catch(console.error);
