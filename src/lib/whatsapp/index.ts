/**
 * WhatsApp Module Index
 * Exports parser, chunker, and analysis utilities
 */

// Parser
export {
  parseWhatsAppChat,
  getChatStats,
  analyzeParticipants,
  type WhatsAppMessage,
  type ParseResult,
  type ParticipantAnalysis,
  type ChatStats,
} from './parser';

// Chunker
export {
  chunkMessages,
  extractQAPairs,
  getChunkStats,
  type MessageChunk,
  type ChunkerOptions,
  type QAPair,
  type ChunkStats,
} from './chunker';
