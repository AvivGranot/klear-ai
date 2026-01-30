/**
 * Conversation Storage Service
 * Persists chat history like ChatGPT/Claude - Sam Altman style architecture
 * Uses localStorage for client-side persistence (can be upgraded to API/DB later)
 */

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  companyId: string
}

const STORAGE_KEY = 'klear-conversations'
const MAX_CONVERSATIONS = 100 // Keep last 100 conversations

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// Generate title from first user message
function generateTitle(firstMessage: string): string {
  // Take first 40 chars, trim to last complete word
  const trimmed = firstMessage.slice(0, 40)
  const lastSpace = trimmed.lastIndexOf(' ')
  const title = lastSpace > 20 ? trimmed.slice(0, lastSpace) : trimmed
  return title + (firstMessage.length > 40 ? '...' : '')
}

// Get all conversations from storage
export function getAllConversations(companyId?: string): Conversation[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const conversations: Conversation[] = JSON.parse(stored)

    // Filter by company if specified
    const filtered = companyId
      ? conversations.filter(c => c.companyId === companyId)
      : conversations

    // Sort by most recent first
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

// Get a single conversation by ID
export function getConversation(id: string): Conversation | null {
  const conversations = getAllConversations()
  return conversations.find(c => c.id === id) || null
}

// Save all conversations to storage
function saveConversations(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return

  // Keep only last MAX_CONVERSATIONS
  const trimmed = conversations
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

// Create a new conversation
export function createConversation(companyId: string, firstMessage?: string): Conversation {
  const id = generateId()
  const now = Date.now()

  const conversation: Conversation = {
    id,
    title: firstMessage ? generateTitle(firstMessage) : 'שיחה חדשה',
    messages: [],
    createdAt: now,
    updatedAt: now,
    companyId,
  }

  const conversations = getAllConversations()
  conversations.unshift(conversation)
  saveConversations(conversations)

  return conversation
}

// Add a message to a conversation
export function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Message {
  const conversations = getAllConversations()
  const conversation = conversations.find(c => c.id === conversationId)

  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`)
  }

  const message: Message = {
    id: generateId(),
    role,
    content,
    timestamp: Date.now(),
  }

  conversation.messages.push(message)
  conversation.updatedAt = Date.now()

  // Update title from first user message if it's still default
  if (conversation.title === 'שיחה חדשה' && role === 'user') {
    conversation.title = generateTitle(content)
  }

  saveConversations(conversations)
  return message
}

// Delete a conversation
export function deleteConversation(id: string): void {
  const conversations = getAllConversations()
  const filtered = conversations.filter(c => c.id !== id)
  saveConversations(filtered)
}

// Clear all conversations for a company
export function clearConversations(companyId: string): void {
  const conversations = getAllConversations()
  const filtered = conversations.filter(c => c.companyId !== companyId)
  saveConversations(filtered)
}

// Update conversation title
export function updateConversationTitle(id: string, title: string): void {
  const conversations = getAllConversations()
  const conversation = conversations.find(c => c.id === id)

  if (conversation) {
    conversation.title = title
    conversation.updatedAt = Date.now()
    saveConversations(conversations)
  }
}

// Group conversations by date
export function groupConversationsByDate(conversations: Conversation[]): {
  today: Conversation[]
  yesterday: Conversation[]
  thisWeek: Conversation[]
  thisMonth: Conversation[]
  older: Conversation[]
} {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000
  const weekAgo = today - 7 * 86400000
  const monthAgo = today - 30 * 86400000

  return {
    today: conversations.filter(c => c.updatedAt >= today),
    yesterday: conversations.filter(c => c.updatedAt >= yesterday && c.updatedAt < today),
    thisWeek: conversations.filter(c => c.updatedAt >= weekAgo && c.updatedAt < yesterday),
    thisMonth: conversations.filter(c => c.updatedAt >= monthAgo && c.updatedAt < weekAgo),
    older: conversations.filter(c => c.updatedAt < monthAgo),
  }
}

// Format timestamp for display
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  // Less than 1 minute
  if (diff < 60000) return 'עכשיו'

  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000)
    return `לפני ${mins} דק׳`
  }

  // Today
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  }

  // Yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return 'אתמול'
  }

  // This week
  if (diff < 7 * 86400000) {
    return date.toLocaleDateString('he-IL', { weekday: 'long' })
  }

  // Older
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}
