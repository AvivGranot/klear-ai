/**
 * AI module with Groq Llama 3.1 8B - Free, Fast, Multilingual
 * Falls back to knowledge base matching if no API key
 */

import { knowledgeItems, getAutomationPatterns, detectTopic } from '@/data/jolika-data'

// Groq client (OpenAI-compatible)
let groqClient: { chat: { completions: { create: (params: GroqParams) => Promise<GroqResponse> } } } | null = null

interface GroqParams {
  model: string
  messages: Array<{ role: string; content: string }>
  temperature: number
  max_tokens: number
}

interface GroqResponse {
  choices: Array<{ message: { content: string } }>
}

function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return null

    groqClient = {
      chat: {
        completions: {
          create: async (params: GroqParams): Promise<GroqResponse> => {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(params),
            })
            if (!res.ok) throw new Error(`Groq API error: ${res.status}`)
            return res.json()
          }
        }
      }
    }
  }
  return groqClient
}

// Text normalization for matching
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[?.!,\-'"()]/g, '').replace(/\s+/g, ' ').trim()
}

// Keyword similarity scoring
function calculateSimilarity(query: string, content: string): number {
  const queryWords = normalizeText(query).split(' ').filter(w => w.length > 2)
  const contentNorm = normalizeText(content)
  if (queryWords.length === 0) return 0
  let matches = 0
  for (const word of queryWords) {
    if (contentNorm.includes(word)) matches++
  }
  return matches / queryWords.length
}

// Find relevant knowledge
export function findRelevantKnowledgeStatic(query: string, limit = 5) {
  const results: Array<{ id: string; title: string; content: string; type: string; similarity: number; isAutomation: boolean }> = []

  // Check automation patterns first (higher priority)
  const patterns = getAutomationPatterns()
  for (let i = 0; i < patterns.length; i++) {
    const p = patterns[i]
    let maxSim = 0
    for (const q of p.exampleQuestions) {
      const sim = calculateSimilarity(query, q)
      if (sim > maxSim) maxSim = sim
    }
    const answerSim = calculateSimilarity(query, p.rawAnswer)
    if (answerSim > maxSim) maxSim = answerSim
    if (maxSim > 0.3) {
      results.push({
        id: `automation-${i}`,
        title: p.rawAnswer.slice(0, 100),
        content: `תשובת מנהל (${p.managerName}): ${p.rawAnswer}`,
        type: 'automation',
        similarity: maxSim + 0.2,
        isAutomation: true,
      })
    }
  }

  // Check knowledge items
  for (let i = 0; i < knowledgeItems.length; i++) {
    const item = knowledgeItems[i]
    const title = item.titleHe || item.title
    const content = item.contentHe || item.content
    const titleSim = calculateSimilarity(query, title)
    const contentSim = calculateSimilarity(query, content)
    const similarity = Math.max(titleSim * 1.5, contentSim)
    if (similarity > 0.2) {
      results.push({ id: `kb-${i}`, title, content, type: item.type, similarity, isAutomation: false })
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
}

// Generate response with Llama 3.1 via Groq
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
  const relevantKnowledge = findRelevantKnowledgeStatic(query, 5)

  // High-confidence automation match - return directly
  const topMatch = relevantKnowledge[0]
  if (topMatch?.isAutomation && topMatch.similarity > 0.6) {
    const patterns = getAutomationPatterns()
    const idx = parseInt(topMatch.id.replace('automation-', ''))
    const pattern = patterns[idx]
    return {
      response: pattern.rawAnswer,
      responseHe: pattern.rawAnswer,
      knowledgeItemId: topMatch.id,
      confidence: topMatch.similarity,
      mediaUrls: [],
      isAutomatedResponse: true,
    }
  }

  // Build context
  const context = relevantKnowledge.map(k => `[${k.type.toUpperCase()}] ${k.title}:\n${k.content}`).join('\n\n---\n\n')
  const confidence = relevantKnowledge.length > 0 ? relevantKnowledge[0].similarity : 0

  // Try Groq Llama 3.1
  const groq = getGroqClient()
  if (groq) {
    try {
      const systemPrompt = `אתה עוזר ידע פנימי לעובדי ג'וליקה שוקולד - חנות שוקולד ומתנות.

כללים:
1. ענה בעברית תמיד
2. היה תמציתי וברור
3. אם לא בטוח - אמור זאת
4. אם המידע לא קיים - ציין זאת

מאגר הידע:
${context || 'לא נמצא מידע רלוונטי.'}`

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: query },
      ]

      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
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
      console.error('Groq error:', error)
    }
  }

  // Fallback to knowledge base
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
    response: 'מצטער, לא מצאתי מידע רלוונטי. נסה לנסח אחרת או פנה למנהל.',
    responseHe: 'מצטער, לא מצאתי מידע רלוונטי. נסה לנסח אחרת או פנה למנהל.',
    knowledgeItemId: null,
    confidence: 0,
    mediaUrls: [],
    isAutomatedResponse: false,
  }
}
