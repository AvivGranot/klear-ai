import OpenAI from 'openai'
import prisma from './db'

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

// Generate embeddings for text
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Find relevant knowledge items using semantic search
export async function findRelevantKnowledge(
  query: string,
  companyId: string,
  limit: number = 5
): Promise<Array<{
  id: string
  title: string
  titleHe: string | null
  content: string
  contentHe: string | null
  type: string
  similarity: number
  media: Array<{
    url: string
    mimeType: string
    thumbnailUrl: string | null
  }>
}>> {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query)

  // Get all knowledge items for this company with embeddings
  const knowledgeItems = await prisma.knowledgeItem.findMany({
    where: {
      companyId,
      isActive: true,
      embedding: { not: null },
    },
    include: {
      media: {
        select: {
          url: true,
          mimeType: true,
          thumbnailUrl: true,
        },
      },
    },
  })

  // Calculate similarities and sort
  const itemsWithSimilarity = knowledgeItems
    .map((item) => {
      const embedding = JSON.parse(item.embedding!) as number[]
      const similarity = cosineSimilarity(queryEmbedding, embedding)
      return {
        id: item.id,
        title: item.title,
        titleHe: item.titleHe,
        content: item.content,
        contentHe: item.contentHe,
        type: item.type,
        similarity,
        media: item.media,
      }
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  return itemsWithSimilarity
}

// Generate AI response based on knowledge base
export async function generateResponse(
  query: string,
  companyId: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{
  response: string
  responseHe: string
  knowledgeItemId: string | null
  confidence: number
  mediaUrls: string[]
}> {
  // Find relevant knowledge
  const relevantKnowledge = await findRelevantKnowledge(query, companyId, 3)

  // Build context from knowledge base
  const context = relevantKnowledge
    .map((k) => `[${k.type.toUpperCase()}] ${k.titleHe || k.title}:\n${k.contentHe || k.content}`)
    .join('\n\n---\n\n')

  // Collect media URLs
  const mediaUrls = relevantKnowledge.flatMap((k) => k.media.map((m) => m.url))

  // Calculate confidence based on similarity scores
  const confidence = relevantKnowledge.length > 0 ? relevantKnowledge[0].similarity : 0

  // Build messages for OpenAI
  const systemPrompt = `אתה עוזר ידע פנימי לעובדים בחברה. תפקידך לענות על שאלות בהתבסס על מאגר הידע של החברה.

כללים חשובים:
1. ענה בעברית תמיד
2. היה תמציתי וברור
3. אם אתה לא בטוח, אמור זאת
4. אם המידע לא קיים במאגר הידע, ציין זאת
5. השתמש בשפה פשוטה ומובנת

מאגר הידע הרלוונטי:
${context || 'לא נמצא מידע רלוונטי במאגר הידע.'}

You are an internal knowledge assistant for company employees. Your role is to answer questions based on the company's knowledge base.

Important rules:
1. Always respond in Hebrew primarily
2. Be concise and clear
3. If you're unsure, say so
4. If the information doesn't exist in the knowledge base, mention it
5. Use simple and understandable language`

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
    responseHe: responseText, // Response is already in Hebrew
    knowledgeItemId: relevantKnowledge.length > 0 ? relevantKnowledge[0].id : null,
    confidence,
    mediaUrls,
  }
}

// Index a knowledge item (generate and store embeddings)
export async function indexKnowledgeItem(knowledgeItemId: string): Promise<void> {
  const item = await prisma.knowledgeItem.findUnique({
    where: { id: knowledgeItemId },
  })

  if (!item) {
    throw new Error('Knowledge item not found')
  }

  // Combine title and content for embedding
  const textToEmbed = `${item.titleHe || item.title}\n\n${item.contentHe || item.content}`
  const embedding = await generateEmbedding(textToEmbed)

  // Store embedding as JSON string
  await prisma.knowledgeItem.update({
    where: { id: knowledgeItemId },
    data: { embedding: JSON.stringify(embedding) },
  })
}

// Re-index all knowledge items for a company
export async function reindexCompanyKnowledge(companyId: string): Promise<number> {
  const items = await prisma.knowledgeItem.findMany({
    where: { companyId, isActive: true },
    select: { id: true },
  })

  let indexed = 0
  for (const item of items) {
    try {
      await indexKnowledgeItem(item.id)
      indexed++
    } catch (error) {
      console.error(`Failed to index item ${item.id}:`, error)
    }
  }

  return indexed
}
