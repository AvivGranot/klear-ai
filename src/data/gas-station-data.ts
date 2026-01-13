/**
 * Static data from WhatsApp Chat - צוות אמיר בני ברק
 * No database needed - data is bundled with the app
 */

import whatsappFaqs from './whatsapp-faqs.json'
import allConversationsData from './all-conversations.json'
import categoriesData from './categories.json'

// Type definitions
interface Conversation {
  id: string
  question: string
  questionSender: string
  answer: string
  answerSender: string
  date: string
  time: string
  isMedia: boolean
}

interface ConversationsData {
  total: number
  conversations: Conversation[]
}

// Gas station topic configuration
export const GAS_STATION_TOPICS = [
  { id: 'fuel', name: 'תדלוק ומשאבות', icon: '⛽', color: 'blue', keywords: ['משאב', 'תדלוק', 'דלק', 'בנזין', 'סולר'] },
  { id: 'payments', name: 'תשלומים וקופה', icon: '💳', color: 'green', keywords: ['קופה', 'עסקה', 'תשלום', 'מזומן', 'אשראי', 'ביט', 'פייבוקס'] },
  { id: 'inventory', name: 'מלאי והזמנות', icon: '📦', color: 'orange', keywords: ['מלאי', 'חסר', 'הזמנ', 'ספק', 'משלוח'] },
  { id: 'shifts', name: 'כוח אדם ומשמרות', icon: '👥', color: 'purple', keywords: ['עובד', 'משמרת', 'שעות', 'חופש'] },
  { id: 'safety', name: 'בטיחות וחירום', icon: '🚨', color: 'red', keywords: ['בטיח', 'חירום', 'כיבוי', 'אש', 'נכה', 'חשוד'] },
  { id: 'customers', name: 'שירות לקוחות', icon: '🤝', color: 'teal', keywords: ['לקוח', 'שירות', 'תלונ'] },
  { id: 'pricing', name: 'מחירים ומבצעים', icon: '💰', color: 'yellow', keywords: ['מכיר', 'הנחה', 'מבצע', 'קופון'] },
  { id: 'products', name: 'מוצרים וצרכניה', icon: '🛒', color: 'pink', keywords: ['מקרר', 'קפה', 'חלב', 'מזון', 'מוצר'] },
  { id: 'maintenance', name: 'תקלות ותחזוקה', icon: '🔧', color: 'gray', keywords: ['תקלה', 'בעיה', 'תיקון', 'שירות טכני'] },
  { id: 'documentation', name: 'תיעוד וחשבונות', icon: '📄', color: 'indigo', keywords: ['צילום', 'תמונה', 'חשבונית', 'קבלה'] },
]

export const categories = categoriesData as Array<{
  name: string
  nameHe: string
  icon: string
}>

// Knowledge base items (documents + automation patterns)
export const knowledgeItems = whatsappFaqs as Array<{
  title: string
  titleHe: string
  content: string
  contentHe: string
  type: string
  frequency?: number
  example_questions?: string[]
}>

// All conversations for analytics
export const conversationsData = allConversationsData as ConversationsData
export const conversations = conversationsData.conversations

// Detect topic from text
export function detectTopic(text: string) {
  const lower = text.toLowerCase()
  for (const topic of GAS_STATION_TOPICS) {
    if (topic.keywords.some(kw => lower.includes(kw))) {
      return topic
    }
  }
  return null
}

// Process knowledge items with topic detection
export function getProcessedKnowledge() {
  return knowledgeItems.map((item, index) => {
    const topic = detectTopic(item.contentHe || item.content || '')

    return {
      id: `kb-${index}`,
      rank: index + 1,
      title: item.titleHe || item.title,
      content: item.contentHe || item.content,
      type: item.type,
      frequency: item.frequency || 1,
      topic: topic?.name,
      topicIcon: topic?.icon,
      topicColor: topic?.color,
    }
  })
}

// Get all conversations with topic detection (for analytics)
export function getProcessedConversations() {
  return conversations.map((conv, index) => {
    const text = `${conv.question} ${conv.answer}`
    const topic = detectTopic(text)

    return {
      ...conv,
      id: conv.id || `conv-${index}`,
      topic: topic?.name || 'אחר',
      topicIcon: topic?.icon || '💬',
      topicColor: topic?.color || 'gray',
    }
  })
}

// Get topic stats from ALL conversations (for analytics)
export function getTopicStats() {
  const topicCounts = new Map<string, number>()
  GAS_STATION_TOPICS.forEach(t => topicCounts.set(t.id, 0))
  topicCounts.set('other', 0)

  conversations.forEach(conv => {
    const text = `${conv.question} ${conv.answer}`
    const topic = detectTopic(text)
    if (topic) {
      topicCounts.set(topic.id, (topicCounts.get(topic.id) || 0) + 1)
    } else {
      topicCounts.set('other', (topicCounts.get('other') || 0) + 1)
    }
  })

  const stats = GAS_STATION_TOPICS.map(topic => ({
    ...topic,
    count: topicCounts.get(topic.id) || 0,
  }))

  // Add "other" category
  stats.push({
    id: 'other',
    name: 'אחר',
    icon: '💬',
    color: 'gray',
    keywords: [],
    count: topicCounts.get('other') || 0,
  })

  return stats.sort((a, b) => b.count - a.count)
}

// Get KB summary
export function getKBSummary() {
  const documents = knowledgeItems.filter(f => f.type === 'document').length
  const automationPatterns = knowledgeItems.filter(f => f.type === 'repeated_answer').length

  return {
    totalItems: knowledgeItems.length,
    documents,
    automationPatterns,
    categories: categories.length,
  }
}

// Get automation patterns (repeated answers from manager)
export function getAutomationPatterns() {
  return knowledgeItems
    .filter(item => item.type === 'repeated_answer')
    .map(item => ({
      answer: item.content,
      frequency: item.frequency || 1,
      exampleQuestions: item.example_questions || [],
      topic: detectTopic(item.content)?.name || 'אחר',
    }))
    .sort((a, b) => b.frequency - a.frequency)
}

// Get analytics summary
export function getAnalyticsSummary() {
  const totalConversations = conversations.length
  const topicStats = getTopicStats()

  return {
    totalConversations,
    topicBreakdown: topicStats,
    automationPatternsCount: knowledgeItems.filter(f => f.type === 'repeated_answer').length,
    documentsCount: knowledgeItems.filter(f => f.type === 'document').length,
  }
}

// Company info
export const company = {
  id: 'amir-gas-station',
  name: 'תחנת דלק אמיר בני ברק',
}

// Legacy export for backward compatibility
export const faqs = knowledgeItems
export function getProcessedFaqs() {
  return getProcessedKnowledge()
}
