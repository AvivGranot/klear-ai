/**
 * Static data from WhatsApp Chat - צוות אמיר בני ברק
 * No database needed - data is bundled with the app
 */

import whatsappFaqs from './whatsapp-faqs.json'
import categoriesData from './categories.json'

// Gas station topic configuration
export const GAS_STATION_TOPICS = [
  { id: 'fuel', name: 'תדלוק ומשאבות', icon: '⛽', color: 'blue', keywords: ['משאב', 'תדלוק', 'דלק', 'בנזין', 'סולר'] },
  { id: 'payments', name: 'תשלומים וקופה', icon: '💳', color: 'green', keywords: ['קופה', 'עסקה', 'תשלום', 'מזומן', 'אשראי', 'ביט', 'פייבוקס'] },
  { id: 'inventory', name: 'מלאי והזמנות', icon: '📦', color: 'orange', keywords: ['מלאי', 'חסר', 'הזמנ', 'ספק', 'משלוח'] },
  { id: 'shifts', name: 'כוח אדם ומשמרות', icon: '👥', color: 'purple', keywords: ['עובד', 'משמרת', 'שעות', 'חופש'] },
  { id: 'safety', name: 'בטיחות וחירום', icon: '🚨', color: 'red', keywords: ['בטיח', 'חירום', 'כיבוי', 'אש'] },
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

export const faqs = whatsappFaqs as Array<{
  title: string
  titleHe: string
  content: string
  contentHe: string
  type: string
}>

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

// Process FAQs with topic detection
export function getProcessedFaqs() {
  return faqs.map((faq, index) => {
    const topic = detectTopic(faq.contentHe || faq.content || '')
    const answer = (faq.contentHe || faq.content || '').replace(/^שאלה:[\s\S]*?\n\nתשובה:\s*/, '')

    return {
      id: `faq-${index}`,
      rank: index + 1,
      question: faq.titleHe || faq.title,
      answer,
      topic: topic?.name,
      topicIcon: topic?.icon,
      topicColor: topic?.color,
    }
  })
}

// Get topic stats from FAQs
export function getTopicStats() {
  const topicCounts = new Map<string, number>()
  GAS_STATION_TOPICS.forEach(t => topicCounts.set(t.id, 0))

  faqs.forEach(faq => {
    const topic = detectTopic(faq.contentHe || faq.content || '')
    if (topic) {
      topicCounts.set(topic.id, (topicCounts.get(topic.id) || 0) + 1)
    }
  })

  return GAS_STATION_TOPICS.map(topic => ({
    ...topic,
    count: topicCounts.get(topic.id) || 0,
  })).sort((a, b) => b.count - a.count)
}

// Get KB summary
export function getKBSummary() {
  return {
    totalItems: faqs.length,
    faqs: faqs.filter(f => f.type === 'faq').length,
    documents: faqs.filter(f => f.type === 'document').length,
    categories: categories.length,
  }
}

// Company info
export const company = {
  id: 'amir-gas-station',
  name: 'תחנת דלק אמיר בני ברק',
}
