/**
 * Static data from WhatsApp Chat - צוות ג'וליקה אוסישקין
 * No database needed - data is bundled with the app
 */

import whatsappFaqs from './whatsapp-faqs.json'
import allConversationsData from './all-conversations.json'
import categoriesData from './categories.json'

// Type definitions
export type ConversationType = 'question' | 'employee_report' | 'announcement'

interface Conversation {
  id: string
  type?: ConversationType
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

// Lucide icon name type for topics
export type TopicIconName = 'Truck' | 'ClipboardList' | 'Package' | 'CreditCard' | 'Star' | 'FileText' | 'AlertTriangle' | 'Users' | 'CalendarDays' | 'Gift' | 'MessageCircle'

// Chocolate shop topic configuration
export const CHOCOLATE_SHOP_TOPICS: Array<{
  id: string
  name: string
  icon: TopicIconName
  color: string
  keywords: string[]
}> = [
  { id: 'deliveries', name: 'משלוחים', icon: 'Truck', color: 'blue', keywords: ['משלוח', 'רועי', 'מסירה', 'שליח', 'כתובת', 'תיאום', 'הגעה', 'חלוקה'] },
  { id: 'orders', name: 'הזמנות', icon: 'ClipboardList', color: 'green', keywords: ['הזמנ', 'לקוח', 'קופסא', 'גרנד', 'ג׳וליקה', 'פרימיום', 'חמישי', 'תשיעי', 'מגדל'] },
  { id: 'inventory', name: 'מלאי ופרלינים', icon: 'Package', color: 'amber', keywords: ['טעם', 'פרלינ', 'שוקולד', 'מלאי', 'חסר', 'יש', 'מריר', 'חלב', 'לבן', 'טראפלס'] },
  { id: 'payments', name: 'תשלומים', icon: 'CreditCard', color: 'emerald', keywords: ['תשלום', 'העברה', 'אשראי', 'קופה', 'חיוב', 'שילם', 'בנק', 'חשבונית'] },
  { id: 'loyalty', name: 'מועדון לקוחות', icon: 'Star', color: 'yellow', keywords: ['מועדון', 'נקודות', 'וליוקארד', 'עסקי', 'הנחה', 'צבירה'] },
  { id: 'procedures', name: 'נהלים ותפעול', icon: 'FileText', color: 'purple', keywords: ['נוהל', 'תפעול', 'פתיחה', 'סגירה', 'משימ', 'בבקשה'] },
  { id: 'allergens', name: 'אלרגנים', icon: 'AlertTriangle', color: 'red', keywords: ['אלרג', 'אגוז', 'גלוטן', 'לוז', 'מרציפן', 'אלכוהול', 'ויסקי'] },
  { id: 'customers', name: 'שירות לקוחות', icon: 'Users', color: 'teal', keywords: ['לקוח', 'שירות', 'תלונ', 'בעיה', 'פיצוי'] },
  { id: 'shifts', name: 'משמרות', icon: 'CalendarDays', color: 'indigo', keywords: ['משמרת', 'עבודה', 'יום', 'שעות', 'טבלה', 'שבוע'] },
  { id: 'packaging', name: 'אריזות', icon: 'Gift', color: 'pink', keywords: ['אריז', 'שקית', 'סרט', 'קשירה', 'קופס', 'מדבק'] },
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
  for (const topic of CHOCOLATE_SHOP_TOPICS) {
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
      type: conv.type || 'question',
      topic: topic?.name || 'אחר',
      topicIcon: (topic?.icon || 'MessageCircle') as TopicIconName,
      topicColor: topic?.color || 'gray',
    }
  })
}

// Get conversation type counts
export function getConversationTypeCounts() {
  const counts = {
    question: 0,
    employee_report: 0,
    announcement: 0,
  }

  conversations.forEach(conv => {
    const type = conv.type || 'question'
    if (type in counts) {
      counts[type as keyof typeof counts]++
    }
  })

  return counts
}

// Get topic stats from ALL conversations (for analytics)
export function getTopicStats() {
  const topicCounts = new Map<string, number>()
  CHOCOLATE_SHOP_TOPICS.forEach(t => topicCounts.set(t.id, 0))
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

  const stats = CHOCOLATE_SHOP_TOPICS.map(topic => ({
    ...topic,
    count: topicCounts.get(topic.id) || 0,
  }))

  // Add "other" category
  stats.push({
    id: 'other',
    name: 'אחר',
    icon: 'MessageCircle' as TopicIconName,
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

// Extended type for automation patterns with manager info
interface AutomationPattern {
  title: string
  answer: string
  rawAnswer: string
  frequency: number
  exampleQuestions: string[]
  topic: string
  managerId: string
  managerName: string
  status: string
  mediaInfo: { filename: string; type: string } | null
  associatedMedia: Array<{ filename: string; type: string }>
}

// Get automation patterns (repeated answers from managers)
export function getAutomationPatterns(): AutomationPattern[] {
  return knowledgeItems
    .filter(item => item.type === 'repeated_answer')
    .map(item => {
      // Type assertion for the extended properties
      const extItem = item as typeof item & {
        manager_id?: string
        manager_name?: string
        status?: string
        media_info?: { filename: string; type: string } | null
        associated_media?: Array<{ filename: string; type: string }>
        raw_answer?: string
      }

      return {
        title: item.titleHe || item.title,
        answer: item.contentHe || item.content,
        rawAnswer: extItem.raw_answer || item.contentHe || item.content,
        frequency: item.frequency || 1,
        exampleQuestions: item.example_questions || [],
        topic: detectTopic(item.contentHe || item.content)?.name || 'אחר',
        managerId: extItem.manager_id || 'unknown',
        managerName: extItem.manager_name || 'שלי גולדנברג',
        status: extItem.status || 'pending_approval',
        mediaInfo: extItem.media_info || null,
        associatedMedia: extItem.associated_media || [],
      }
    })
    .sort((a, b) => b.frequency - a.frequency)
}

// Get automation patterns grouped by manager
export function getAutomationPatternsByManager() {
  const patterns = getAutomationPatterns()
  const byManager: Record<string, AutomationPattern[]> = {}

  patterns.forEach(pattern => {
    const manager = pattern.managerName
    if (!byManager[manager]) {
      byManager[manager] = []
    }
    byManager[manager].push(pattern)
  })

  return byManager
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
  id: 'jolika-chocolate',
  name: "ג'וליקה שוקולד",
}

// The 3 managers of Jolika
export const JOLIKA_MANAGERS = [
  { name: 'שלי גולדנברג', role: 'בעלים ומנהלת ראשית', isOwner: true },
  { name: 'שלי בן מויאל', role: 'מנהלת', isOwner: false },
  { name: 'רותם פרחי', role: 'מנהלת', isOwner: false },
]

// Check if someone is a manager
export function isJolikaManager(name: string): boolean {
  return JOLIKA_MANAGERS.some(m => name.includes(m.name))
}

// Get the manager object if the name matches
export function getJolikaManager(name: string) {
  return JOLIKA_MANAGERS.find(m => name.includes(m.name))
}

// Get count of conversations answered by managers
export function getManagerAnswerCount(): number {
  return conversations.filter(c => isJolikaManager(c.answerSender || '')).length
}

// Get count of conversations answered by the owner (שלי גולדנברג)
export function getOwnerAnswerCount(): number {
  return conversations.filter(c => c.answerSender?.includes('שלי גולדנברג')).length
}

// Legacy export for backward compatibility
export const faqs = knowledgeItems
export function getProcessedFaqs() {
  return getProcessedKnowledge()
}

// Re-export with gas station names for backward compatibility
export const GAS_STATION_TOPICS = CHOCOLATE_SHOP_TOPICS

// Get manager contact statistics from conversations
export function getManagerStats() {
  const managerCounts = new Map<string, number>()

  conversations.forEach(conv => {
    const manager = conv.answerSender
    if (manager) {
      managerCounts.set(manager, (managerCounts.get(manager) || 0) + 1)
    }
  })

  // Convert to array and sort by count
  const stats = Array.from(managerCounts.entries())
    .map(([name, count]) => {
      // Extract short name (first name only)
      const shortName = name.split(' ')[0]
      const isShelly = name.includes('שלי')
      return { name, shortName, count, isShelly }
    })
    .sort((a, b) => b.count - a.count)

  return stats
}

// Get repetitive questions sorted by frequency
export function getRepetitiveQuestions() {
  return knowledgeItems
    .filter(item => item.type === 'repeated_answer' && (item.frequency || 0) >= 2)
    .map(item => ({
      title: item.titleHe || item.title,
      content: item.contentHe || item.content,
      frequency: item.frequency || 1,
      exampleQuestions: item.example_questions || [],
      topic: detectTopic(item.contentHe || item.content)?.name || 'אחר',
    }))
    .sort((a, b) => b.frequency - a.frequency)
}

// Get conversations grouped by date for timeline chart
export function getConversationsByDate() {
  const dateMap = new Map<string, number>()

  conversations.forEach(conv => {
    // Parse date from DD/MM/YYYY format (WhatsApp export format)
    const parts = conv.date.split(/[./]/)
    if (parts.length !== 3) return
    const [day, month, year] = parts
    const dateKey = `${year}-${month}-${day}` // ISO format for sorting
    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1)
  })

  // Convert to array and sort by date
  return Array.from(dateMap.entries())
    .map(([date, count]) => {
      const [, month, day] = date.split('-')
      return {
        date,
        displayDate: `${day}/${month}`,
        count,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Get count of times Shelly was contacted
export function getShellyContactCount() {
  return conversations.filter(conv =>
    conv.answerSender?.includes('שלי')
  ).length
}

// Get total repeated questions count (sum of all frequencies)
export function getRepeatedQuestionsCount() {
  return knowledgeItems
    .filter(item => item.type === 'repeated_answer')
    .reduce((sum, item) => sum + (item.frequency || 1), 0)
}
