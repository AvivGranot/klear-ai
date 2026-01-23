/**
 * Static AI module that works without database
 * Uses JSON knowledge base and keyword matching
 */

import OpenAI from 'openai'
import { knowledgeItems, getAutomationPatterns, detectTopic } from '@/data/jolika-data'

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
    })
  }
  return openai
}

// Normalize text for matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[?.!,\-'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Calculate simple text similarity based on keyword matching
function calculateSimilarity(query: string, content: string): number {
  const queryWords = normalizeText(query).split(' ').filter(w => w.length > 2)
  const contentNorm = normalizeText(content)

  if (queryWords.length === 0) return 0

  let matches = 0
  for (const word of queryWords) {
    if (contentNorm.includes(word)) {
      matches++
    }
  }

  return matches / queryWords.length
}

// Find relevant knowledge using keyword matching
export function findRelevantKnowledgeStatic(
  query: string,
  limit: number = 5
): Array<{
  id: string
  title: string
  content: string
  type: string
  similarity: number
  isAutomation: boolean
}> {
  const results: Array<{
    id: string
    title: string
    content: string
    type: string
    similarity: number
    isAutomation: boolean
  }> = []

  // First check automation patterns (highest priority)
  const automationPatterns = getAutomationPatterns()
  for (let i = 0; i < automationPatterns.length; i++) {
    const pattern = automationPatterns[i]

    // Check if query matches any of the example questions
    let maxSimilarity = 0
    for (const exampleQ of pattern.exampleQuestions) {
      const sim = calculateSimilarity(query, exampleQ)
      if (sim > maxSimilarity) maxSimilarity = sim
    }

    // Also check against the answer itself
    const answerSim = calculateSimilarity(query, pattern.rawAnswer)
    if (answerSim > maxSimilarity) maxSimilarity = answerSim

    if (maxSimilarity > 0.3) {
      results.push({
        id: `automation-${i}`,
        title: pattern.rawAnswer.slice(0, 100),
        content: `תשובת מנהל (${pattern.managerName}): ${pattern.rawAnswer}`,
        type: 'automation',
        similarity: maxSimilarity + 0.2, // Boost automation patterns
        isAutomation: true,
      })
    }
  }

  // Then check regular knowledge items
  for (let i = 0; i < knowledgeItems.length; i++) {
    const item = knowledgeItems[i]
    const title = item.titleHe || item.title
    const content = item.contentHe || item.content

    const titleSim = calculateSimilarity(query, title)
    const contentSim = calculateSimilarity(query, content)
    const similarity = Math.max(titleSim * 1.5, contentSim) // Title matches are more important

    if (similarity > 0.2) {
      results.push({
        id: `kb-${i}`,
        title,
        content,
        type: item.type,
        similarity,
        isAutomation: false,
      })
    }
  }

  // Sort by similarity and return top results
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

// Generate response using static knowledge base
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
  // Find relevant knowledge
  const relevantKnowledge = findRelevantKnowledgeStatic(query, 5)

  // Check if we have a high-confidence automation match
  const topMatch = relevantKnowledge[0]
  if (topMatch && topMatch.isAutomation && topMatch.similarity > 0.6) {
    // Return automated response directly
    const automationPatterns = getAutomationPatterns()
    const patternIndex = parseInt(topMatch.id.replace('automation-', ''))
    const pattern = automationPatterns[patternIndex]

    return {
      response: pattern.rawAnswer,
      responseHe: pattern.rawAnswer,
      knowledgeItemId: topMatch.id,
      confidence: topMatch.similarity,
      mediaUrls: [],
      isAutomatedResponse: true,
    }
  }

  // Build context from knowledge base
  const context = relevantKnowledge
    .map((k) => `[${k.type.toUpperCase()}] ${k.title}:\n${k.content}`)
    .join('\n\n---\n\n')

  // Calculate confidence
  const confidence = relevantKnowledge.length > 0 ? relevantKnowledge[0].similarity : 0

  // If no OpenAI key, return a simple response based on knowledge
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
    if (relevantKnowledge.length > 0) {
      return {
        response: `לפי מאגר הידע:\n\n${relevantKnowledge[0].content.slice(0, 500)}...`,
        responseHe: `לפי מאגר הידע:\n\n${relevantKnowledge[0].content.slice(0, 500)}...`,
        knowledgeItemId: relevantKnowledge[0].id,
        confidence,
        mediaUrls: [],
        isAutomatedResponse: false,
      }
    } else {
      return {
        response: 'מצטער, לא מצאתי מידע רלוונטי במאגר הידע. אנא נסה לנסח את השאלה בצורה אחרת או פנה למנהל.',
        responseHe: 'מצטער, לא מצאתי מידע רלוונטי במאגר הידע. אנא נסה לנסח את השאלה בצורה אחרת או פנה למנהל.',
        knowledgeItemId: null,
        confidence: 0,
        mediaUrls: [],
        isAutomatedResponse: false,
      }
    }
  }

  // Use OpenAI for response generation
  try {
    const systemPrompt = `אתה עוזר ידע פנימי לעובדי ג'וליקה שוקולד - חנות שוקולד ומתנות. תפקידך לענות על שאלות בהתבסס על מאגר הידע של החברה.

כללים חשובים:
1. ענה בעברית תמיד
2. היה תמציתי וברור
3. אם אתה לא בטוח, אמור זאת
4. אם המידע לא קיים במאגר הידע, ציין זאת
5. השתמש בשפה פשוטה ומובנת

מאגר הידע הרלוונטי:
${context || 'לא נמצא מידע רלוונטי במאגר הידע.'}`

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: query },
    ]

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const responseText = completion.choices[0].message.content || 'מצטער, לא הצלחתי לעבד את הבקשה.'

    return {
      response: responseText,
      responseHe: responseText,
      knowledgeItemId: relevantKnowledge.length > 0 ? relevantKnowledge[0].id : null,
      confidence,
      mediaUrls: [],
      isAutomatedResponse: false,
    }
  } catch (error) {
    console.error('OpenAI error:', error)

    // Fallback to simple response
    if (relevantKnowledge.length > 0) {
      return {
        response: `לפי מאגר הידע:\n\n${relevantKnowledge[0].content.slice(0, 500)}`,
        responseHe: `לפי מאגר הידע:\n\n${relevantKnowledge[0].content.slice(0, 500)}`,
        knowledgeItemId: relevantKnowledge[0].id,
        confidence,
        mediaUrls: [],
        isAutomatedResponse: false,
      }
    }

    return {
      response: 'מצטער, אירעה שגיאה. אנא נסה שוב.',
      responseHe: 'מצטער, אירעה שגיאה. אנא נסה שוב.',
      knowledgeItemId: null,
      confidence: 0,
      mediaUrls: [],
      isAutomatedResponse: false,
    }
  }
}
