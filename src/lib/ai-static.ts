/**
 * AI module with multiple LLM backends
 * Priority: 1) Groq Llama 3.1 (free) 2) OpenAI 3) Knowledge base fallback
 */

import { knowledgeItems, getAutomationPatterns, JOLIKA_MANAGERS, company } from '@/data/jolika-data'

// ========== GREETING & INTENT DETECTION ==========

// Common Hebrew greetings and their responses
const GREETINGS: Record<string, string> = {
  'היי': 'היי! מה אפשר לעזור?',
  'שלום': 'שלום! איך אפשר לעזור לך?',
  'הי': 'היי! במה אוכל לסייע?',
  'בוקר טוב': 'בוקר טוב! איך אפשר לעזור?',
  'ערב טוב': 'ערב טוב! איך אפשר לעזור?',
  'צהריים טובים': 'צהריים טובים! במה אוכל לסייע?',
  'מה נשמע': 'הכל טוב! איך אפשר לעזור?',
  'מה קורה': 'הכל טוב! במה אוכל לעזור?',
}

// Subject topics for guidance
const AVAILABLE_TOPICS = [
  { name: 'משלוחים', examples: ['מתי יש משלוחים?', 'איזורי משלוח'] },
  { name: 'הזמנות', examples: ['איך מקבלים הזמנה?', 'איך לארוז הזמנה?'] },
  { name: 'מלאי ופרלינים', examples: ['מה הטעמים במלאי?', 'אילו פרלינים יש?'] },
  { name: 'תשלומים', examples: ['איך מקבלים תשלום?', 'העברה בנקאית'] },
  { name: 'מועדון לקוחות', examples: ['מה זה וליוקארד?', 'הנחות לעסקים'] },
  { name: 'אלרגנים', examples: ['מה מכיל אגוזים?', 'אלרגיה לגלוטן'] },
  { name: 'נהלים', examples: ['פתיחת משמרת', 'סגירת קופה'] },
]

// Generate helpful guidance message
function getGuidanceMessage(): string {
  const topicsList = AVAILABLE_TOPICS.map(t => `• ${t.name}`).join('\n')
  return `אני יכול לעזור בנושאים הבאים:
${topicsList}

שאל שאלה ספציפית יותר, למשל:
"מתי יש משלוחים ביום שישי?" או "מה הטעמים הכי פופולריים?"`
}

// Get topic suggestion based on partial query
function suggestTopics(query: string): string | null {
  const lower = query.toLowerCase()
  const suggestions: string[] = []

  // Check for partial matches
  if (lower.includes('משלו') || lower.includes('שליח')) {
    suggestions.push('משלוחים - "מתי יש משלוחים?", "לאיפה מגיעים?"')
  }
  if (lower.includes('הזמנ') || lower.includes('לקוח')) {
    suggestions.push('הזמנות - "איך מקבלים הזמנה?", "איך לארוז?"')
  }
  if (lower.includes('מלאי') || lower.includes('פרלינ') || lower.includes('שוקולד') || lower.includes('טעם')) {
    suggestions.push('מלאי - "מה הטעמים הפופולריים?", "מה חדש במלאי?"')
  }
  if (lower.includes('תשלום') || lower.includes('כסף') || lower.includes('העבר')) {
    suggestions.push('תשלומים - "איך מקבלים תשלום?", "העברה בנקאית"')
  }
  if (lower.includes('מועדון') || lower.includes('הנח') || lower.includes('עסק')) {
    suggestions.push('מועדון לקוחות - "מה זה וליוקארד?", "הנחות לעסקים"')
  }
  if (lower.includes('אלרג') || lower.includes('אגוז') || lower.includes('גלוטן')) {
    suggestions.push('אלרגנים - "מה מכיל אגוזים?", "ללא גלוטן"')
  }

  if (suggestions.length > 0) {
    return `התכוונת לשאול על:\n${suggestions.map(s => `• ${s}`).join('\n')}`
  }
  return null
}

// Manager info response
const MANAGER_INFO = `המנהלות של ג'וליקה שוקולד:
${JOLIKA_MANAGERS.map(m => `• ${m.name} - ${m.role}`).join('\n')}

לשאלות דחופות פנה לשלי גולדנברג (בעלים ומנהלת ראשית).`

// Check if query is a greeting
function isGreeting(query: string): string | null {
  const normalized = query.trim().replace(/[?.!,]/g, '')
  for (const [greeting, response] of Object.entries(GREETINGS)) {
    if (normalized === greeting || normalized.startsWith(greeting + ' ')) {
      return response
    }
  }
  return null
}

// Check if query is asking about managers
function isAskingAboutManager(query: string): boolean {
  const managerKeywords = ['מנהל', 'מנהלת', 'בעלים', 'אחראי', 'אחראית', 'מי האחראי', 'מי המנהל', 'מי הבוס']
  const lower = query.toLowerCase()
  return managerKeywords.some(kw => lower.includes(kw))
}

// Check if query is unclear or too short
function isUnclearQuery(query: string): boolean {
  const normalized = query.trim().replace(/[?.!,]/g, '')
  // Very short queries that aren't greetings
  if (normalized.length <= 3) return true
  // Single characters or words like "מה" without context
  if (['מה', 'למה', 'איך', 'מתי', 'איפה', 'כמה'].includes(normalized)) return true
  return false
}

// ========== TEXT NORMALIZATION ==========

// Text normalization for Hebrew
function normalizeHebrew(text: string): string {
  return text
    .toLowerCase()
    .replace(/[?.!,\-'"()״׳]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Hebrew word stemming (basic)
function stemHebrew(word: string): string {
  // Remove common Hebrew prefixes
  const prefixes = ['ה', 'ו', 'ב', 'ל', 'מ', 'כ', 'ש']
  let result = word
  for (const prefix of prefixes) {
    if (result.startsWith(prefix) && result.length > 2) {
      result = result.slice(1)
      break
    }
  }
  // Remove common suffixes
  const suffixes = ['ים', 'ות', 'ה', 'ת']
  for (const suffix of suffixes) {
    if (result.endsWith(suffix) && result.length > 3) {
      result = result.slice(0, -suffix.length)
      break
    }
  }
  return result
}

// Extract meaningful keywords from query
function extractKeywords(text: string): string[] {
  const stopWords = ['את', 'של', 'על', 'עם', 'אל', 'זה', 'זו', 'זאת', 'הוא', 'היא', 'הם', 'הן', 'אני', 'אתה', 'את', 'אנחנו', 'לי', 'לך', 'לו', 'לה', 'כן', 'לא', 'גם', 'רק', 'כל', 'כמו', 'או', 'אם', 'כי', 'אבל', 'עוד', 'כבר', 'פה', 'שם', 'איך', 'מה', 'מתי', 'איפה', 'למה', 'כמה', 'מי', 'אז', 'יש', 'אין']

  const words = normalizeHebrew(text).split(' ')
  return words.filter(w => w.length > 1 && !stopWords.includes(w))
}

// ========== IMPROVED SIMILARITY CALCULATION ==========

// Calculate semantic similarity between query and content
function calculateSimilarity(query: string, content: string, exampleQuestions: string[] = []): number {
  const queryKeywords = extractKeywords(query)
  const contentNorm = normalizeHebrew(content)

  if (queryKeywords.length === 0) return 0

  let score = 0
  let matchedWords = 0
  let exactPhraseMatch = false

  // Check for exact phrase match in content or examples
  const queryNorm = normalizeHebrew(query)
  if (contentNorm.includes(queryNorm) && queryNorm.length > 3) {
    exactPhraseMatch = true
    score += 0.5
  }

  // Check example questions for strong matches
  for (const example of exampleQuestions) {
    const exampleNorm = normalizeHebrew(example)
    // Exact match with example question
    if (exampleNorm === queryNorm) {
      return 1.0 // Perfect match
    }
    // High similarity with example
    if (exampleNorm.includes(queryNorm) || queryNorm.includes(exampleNorm)) {
      score += 0.4
      break
    }
  }

  // Keyword matching
  for (const word of queryKeywords) {
    const stemmed = stemHebrew(word)

    // Exact word match
    if (contentNorm.includes(word)) {
      matchedWords++
      score += 0.15
    }
    // Stemmed match (partial credit)
    else if (contentNorm.includes(stemmed) && stemmed.length > 2) {
      matchedWords++
      score += 0.08
    }
  }

  // Calculate keyword coverage ratio
  const coverageRatio = matchedWords / queryKeywords.length

  // Penalize low coverage even if some words match
  if (coverageRatio < 0.3 && !exactPhraseMatch) {
    score *= 0.3 // Heavy penalty for low relevance
  }

  // Normalize score to 0-1 range
  return Math.min(score, 1.0)
}

// ========== KNOWLEDGE RETRIEVAL ==========

// Find relevant knowledge items with improved matching
export function findRelevantKnowledgeStatic(query: string, limit = 5) {
  const results: Array<{
    id: string
    title: string
    content: string
    type: string
    similarity: number
    isAutomation: boolean
    matchReason: string
  }> = []

  // Check automation patterns first (these have example questions)
  const patterns = getAutomationPatterns()
  for (let i = 0; i < patterns.length; i++) {
    const p = patterns[i]
    const similarity = calculateSimilarity(query, p.answer, p.exampleQuestions)

    // Also check title match
    const titleSim = calculateSimilarity(query, p.title)
    const finalSim = Math.max(similarity, titleSim * 0.8)

    // Only include if similarity is meaningful
    if (finalSim > 0.25) {
      results.push({
        id: `automation-${i}`,
        title: p.title,
        content: p.answer,
        type: 'automation',
        similarity: finalSim + 0.1, // Boost automation patterns
        isAutomation: true,
        matchReason: similarity > titleSim ? 'content' : 'title',
      })
    }
  }

  // Check knowledge items
  for (let i = 0; i < knowledgeItems.length; i++) {
    const item = knowledgeItems[i]
    const title = item.titleHe || item.title
    const content = item.contentHe || item.content
    const questions = item.example_questions || []

    const contentSim = calculateSimilarity(query, content, questions)
    const titleSim = calculateSimilarity(query, title)
    const finalSim = Math.max(contentSim, titleSim * 1.2)

    // Only include if similarity is meaningful
    if (finalSim > 0.2) {
      results.push({
        id: `kb-${i}`,
        title,
        content,
        type: item.type,
        similarity: finalSim,
        isAutomation: false,
        matchReason: contentSim > titleSim ? 'content' : 'title',
      })
    }
  }

  // Sort by similarity and return top results
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

// ========== LLM INTEGRATION ==========

// Try Ollama (local LLM - llama3.2 or any installed model) - Enhanced with interactive guidance
async function tryOllama(
  query: string,
  context: string,
  history: Array<{ role: string; content: string }>
): Promise<string | null> {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2'

  try {
    // First check if Ollama is running
    const healthCheck = await fetch(`${ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(2000), // 2 second timeout for health check
    }).catch(() => null)

    if (!healthCheck?.ok) {
      console.log('Ollama not available, skipping...')
      return null
    }

    // Determine if we have good context or need to guide the user
    const hasGoodContext = context && !context.includes('אין מידע ספציפי')

    const systemPrompt = hasGoodContext
      ? `אתה עוזר AI פנימי לעובדי ${company.name} - חנות שוקולד ומתנות ברמת השרון.

כללים חשובים:
1. ענה בעברית תמיד
2. היה תמציתי וברור - עד 3 משפטים
3. השתמש במידע מהמאגר
4. תן תשובה מועילה גם אם לא בטוח ב-100%
5. אם השאלה לא ברורה - הצע שאלות המשך

מאגר ידע:
${context}`
      : `אתה עוזר AI חכם וידידותי לעובדי ${company.name} - חנות שוקולד ומתנות ברמת השרון.

אין לך מידע ספציפי על השאלה הזו, אבל עליך לעזור בצורה אינטראקטיבית:

1. ענה בעברית תמיד
2. הכר בכך שאין לך את המידע המדויק
3. הצע 2-3 שאלות ממוקדות שיעזרו לך להבין מה המשתמש צריך
4. הצע לפנות לשלי (המנהלת) אם זה דחוף
5. תן הרגשה טובה - אתה כאן לעזור!

דוגמה לתשובה טובה:
"אני לא מצאתי את המידע הספציפי הזה במאגר, אבל אשמח לעזור!
• האם אתה מחפש מידע על [אפשרות 1]?
• או אולי על [אפשרות 2]?
• אם זה דחוף, שלי תמיד שמחה לעזור ישירות."

נושאים שאני יודע עליהם: משלוחים, הזמנות, מלאי ופרלינים, תשלומים, מועדון לקוחות, אלרגנים, נהלים.`

    // Build messages for Ollama chat format
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: query },
    ]

    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        messages,
        stream: false,
        options: {
          temperature: hasGoodContext ? 0.3 : 0.6, // Higher creativity when guiding
          num_predict: 500,
        },
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout for response
    })

    if (!res.ok) {
      console.error('Ollama error:', res.status)
      return null
    }

    const data = await res.json()
    return data.message?.content || null
  } catch (e) {
    console.error('Ollama error:', e)
    return null
  }
}

// Try Groq API (free Llama 3.1) - Enhanced with interactive guidance
async function tryGroq(
  query: string,
  context: string,
  history: Array<{ role: string; content: string }>
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  try {
    // Determine if we have good context or need to guide the user
    const hasGoodContext = context && !context.includes('אין מידע ספציפי')

    const systemPrompt = hasGoodContext
      ? `אתה עוזר AI פנימי לעובדי ${company.name} - חנות שוקולד ומתנות ברמת השרון.

כללים חשובים:
1. ענה בעברית תמיד
2. היה תמציתי וברור - עד 3 משפטים
3. השתמש במידע מהמאגר
4. תן תשובה מועילה גם אם לא בטוח ב-100%
5. אם השאלה לא ברורה - הצע שאלות המשך

מאגר ידע:
${context}`
      : `אתה עוזר AI חכם וידידותי לעובדי ${company.name} - חנות שוקולד ומתנות ברמת השרון.

אין לך מידע ספציפי על השאלה הזו, אבל עליך לעזור בצורה אינטראקטיבית:

1. ענה בעברית תמיד
2. הכר בכך שאין לך את המידע המדויק
3. הצע 2-3 שאלות ממוקדות שיעזרו לך להבין מה המשתמש צריך
4. הצע לפנות לשלי (המנהלת) אם זה דחוף
5. תן הרגשה טובה - אתה כאן לעזור!

דוגמה לתשובה טובה:
"אני לא מצאתי את המידע הספציפי הזה במאגר, אבל אשמח לעזור!
• האם אתה מחפש מידע על [אפשרות 1]?
• או אולי על [אפשרות 2]?
• אם זה דחוף, שלי תמיד שמחה לעזור ישירות."

נושאים שאני יודע עליהם: משלוחים, הזמנות, מלאי ופרלינים, תשלומים, מועדון לקוחות, אלרגנים, נהלים.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: query },
    ]

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: hasGoodContext ? 0.3 : 0.6, // Higher creativity when guiding
        max_tokens: 500,
      }),
    })

    if (!res.ok) {
      console.error('Groq error:', res.status)
      return null
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (e) {
    console.error('Groq error:', e)
    return null
  }
}

// Try OpenAI API - Enhanced with interactive guidance
async function tryOpenAI(
  query: string,
  context: string,
  history: Array<{ role: string; content: string }>
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    // Determine if we have good context or need to guide the user
    const hasGoodContext = context && !context.includes('אין מידע ספציפי')

    const systemPrompt = hasGoodContext
      ? `אתה עוזר AI פנימי לעובדי ${company.name} - חנות שוקולד ומתנות.

כללים:
1. ענה בעברית בלבד
2. תשובות קצרות וממוקדות
3. השתמש במידע מהמאגר
4. תן תשובה מועילה גם אם לא בטוח ב-100%

מאגר ידע:
${context}`
      : `אתה עוזר AI חכם וידידותי לעובדי ${company.name} - חנות שוקולד ומתנות.

אין לך מידע ספציפי על השאלה הזו, אבל עליך לעזור בצורה אינטראקטיבית:

1. ענה בעברית בלבד
2. הכר שאין לך המידע המדויק
3. הצע 2-3 שאלות ממוקדות שיעזרו להבין מה המשתמש צריך
4. הצע לפנות לשלי (המנהלת) אם דחוף
5. תן הרגשה טובה - אתה כאן לעזור!

נושאים שאתה יודע עליהם: משלוחים, הזמנות, מלאי ופרלינים, תשלומים, מועדון לקוחות, אלרגנים, נהלים.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: query },
    ]

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: hasGoodContext ? 0.3 : 0.6, // Higher creativity when guiding
        max_tokens: 500,
      }),
    })

    if (!res.ok) {
      console.error('OpenAI error:', res.status)
      return null
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (e) {
    console.error('OpenAI error:', e)
    return null
  }
}

// ========== MAIN RESPONSE GENERATION ==========

export async function generateResponseStatic(
  query: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{
  response: string
  responseHe: string
  knowledgeItemId: string | null
  confidence: number
  mediaUrls: string[]
  isAutomatedResponse: boolean
}> {
  // 1. Check for greetings first
  const greetingResponse = isGreeting(query)
  if (greetingResponse) {
    return {
      response: greetingResponse,
      responseHe: greetingResponse,
      knowledgeItemId: null,
      confidence: 1.0,
      mediaUrls: [],
      isAutomatedResponse: true,
    }
  }

  // 2. Check for unclear/too short queries - provide guidance
  if (isUnclearQuery(query)) {
    const response = getGuidanceMessage()
    return {
      response,
      responseHe: response,
      knowledgeItemId: null,
      confidence: 0,
      mediaUrls: [],
      isAutomatedResponse: true,
    }
  }

  // 3. Check for manager-related questions
  if (isAskingAboutManager(query)) {
    return {
      response: MANAGER_INFO,
      responseHe: MANAGER_INFO,
      knowledgeItemId: null,
      confidence: 1.0,
      mediaUrls: [],
      isAutomatedResponse: true,
    }
  }

  // 4. Find relevant knowledge
  const relevantKnowledge = findRelevantKnowledgeStatic(query, 5)
  const topMatch = relevantKnowledge[0]

  // 5. High-confidence direct match - return automation answer
  if (topMatch?.isAutomation && topMatch.similarity > 0.6) {
    return {
      response: topMatch.content,
      responseHe: topMatch.content,
      knowledgeItemId: topMatch.id,
      confidence: topMatch.similarity,
      mediaUrls: [],
      isAutomatedResponse: true,
    }
  }

  // 6. Build context from relevant knowledge (only high-quality matches)
  const qualityMatches = relevantKnowledge.filter(k => k.similarity > 0.3)
  const context = qualityMatches.length > 0
    ? qualityMatches.map(k => `📌 ${k.title}:\n${k.content}`).join('\n\n')
    : 'אין מידע ספציפי במאגר על שאלה זו.'

  const confidence = qualityMatches.length > 0 ? topMatch?.similarity || 0 : 0
  const history = conversationHistory.map(m => ({ role: m.role, content: m.content }))

  // 7. Try LLM providers in order: Groq (free) → OpenAI → Ollama (local)
  let llmResponse = await tryGroq(query, context, history)
  if (!llmResponse) {
    llmResponse = await tryOpenAI(query, context, history)
  }
  if (!llmResponse) {
    llmResponse = await tryOllama(query, context, history)
  }

  if (llmResponse) {
    return {
      response: llmResponse,
      responseHe: llmResponse,
      knowledgeItemId: topMatch?.id || null,
      confidence,
      mediaUrls: [],
      isAutomatedResponse: false,
    }
  }

  // 8. Fallback to knowledge base only if we have a good match
  if (qualityMatches.length > 0 && topMatch && topMatch.similarity > 0.4) {
    const response = topMatch.content.length > 400
      ? topMatch.content.slice(0, 400) + '...'
      : topMatch.content

    return {
      response,
      responseHe: response,
      knowledgeItemId: topMatch.id,
      confidence,
      mediaUrls: [],
      isAutomatedResponse: false,
    }
  }

  // 9. No good match found - try to provide a helpful response anyway (Grok style)
  // Instead of just saying "I don't know", provide best-effort answer with disclaimer

  // Build a helpful response based on what we know about the business
  const query_lower = query.toLowerCase()
  let helpfulResponse = ''

  // Try to infer intent and provide helpful guidance
  if (query_lower.includes('מחיר') || query_lower.includes('עלות') || query_lower.includes('כמה עולה')) {
    helpfulResponse = `לגבי מחירים - אני לא בטוח במחיר המדויק, אבל אתה מוזמן לבדוק באתר או לשאול את שלי ישירות. היא תוכל לתת לך את המחיר המעודכן.`
  } else if (query_lower.includes('שעות') || query_lower.includes('פתוח') || query_lower.includes('סגור')) {
    helpfulResponse = `לגבי שעות פעילות - כדאי לבדוק מול שלי או באתר לשעות המעודכנות. בדרך כלל החנות פתוחה בשעות העבודה הרגילות.`
  } else if (query_lower.includes('משלוח') || query_lower.includes('שליח')) {
    helpfulResponse = `לגבי משלוחים - יש משלוחים באזור רמת השרון והסביבה. לפרטים מדויקים על אזורי המשלוח והמחירים, כדאי לבדוק עם שלי.`
  } else if (query_lower.includes('הזמנה') || query_lower.includes('להזמין')) {
    helpfulResponse = `לגבי הזמנות - אפשר להזמין דרך החנות, באתר, או בטלפון. לפרטים נוספים או הזמנות מיוחדות, פנה לשלי.`
  } else {
    // Generic helpful response
    helpfulResponse = `אני לא מצאתי תשובה מדויקת לשאלה הזו במאגר הידע שלי.

אבל אל דאגה! הנה מה שאני יכול להציע:
• נסה לנסח את השאלה בצורה קצת שונה
• שאל את שלי ישירות - היא תמיד שמחה לעזור
• אם זה דחוף, התקשר לחנות

איך עוד אוכל לעזור?`
  }

  const topicSuggestion = suggestTopics(query)
  if (topicSuggestion) {
    helpfulResponse += `\n\n${topicSuggestion}`
  }

  return {
    response: helpfulResponse,
    responseHe: helpfulResponse,
    knowledgeItemId: null,
    confidence: 0.3, // Low but not zero - we're still trying to help
    mediaUrls: [],
    isAutomatedResponse: true,
  }
}
