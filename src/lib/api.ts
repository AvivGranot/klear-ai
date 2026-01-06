// Safe API fetch utility with proper error handling

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options)

    // Check if response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code
      )
    }

    // Check for empty body
    const text = await response.text()
    if (!text || text.trim() === '') {
      return {} as T
    }

    try {
      return JSON.parse(text) as T
    } catch {
      throw new ApiError('Invalid JSON response', 500, 'PARSE_ERROR')
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    )
  }
}

// Typed API response interfaces
export interface StatsResponse {
  totalConversations: number
  totalMessages: number
  totalKnowledgeItems: number
  totalUsers: number
  avgResponseTime?: number
  successRate?: number
}

export interface ConversationsResponse {
  conversations: Conversation[]
  total: number
  hasMore: boolean
}

export interface Conversation {
  id: string
  status: string
  rating?: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    phone: string
    avatarUrl?: string
  }
  messages: Message[]
  _count: {
    messages: number
  }
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: string
  confidence?: number
}

export interface KnowledgeResponse {
  knowledgeItems: KnowledgeItem[]
}

export interface KnowledgeItem {
  id: string
  title: string
  titleHe?: string
  content: string
  contentHe?: string
  type: string
  createdAt: string
  updatedAt: string
  viewCount: number
  category?: {
    id: string
    name: string
    nameHe?: string
  }
  media?: MediaItem[]
}

export interface MediaItem {
  id: string
  url: string
  mimeType: string
  thumbnailUrl?: string
}

export interface UsersResponse {
  users: User[]
}

export interface User {
  id: string
  name: string
  phone: string
  role: string
  avatarUrl?: string
  createdAt: string
}

// API methods
export const api = {
  async getStats(companyId: string): Promise<StatsResponse> {
    const [conversations, knowledge, users] = await Promise.all([
      safeFetch<ConversationsResponse>(`/api/conversations?companyId=${companyId}&limit=1000`),
      safeFetch<KnowledgeResponse>(`/api/knowledge?companyId=${companyId}`),
      safeFetch<UsersResponse>(`/api/users?companyId=${companyId}`),
    ])

    return {
      totalConversations: conversations.total || 0,
      totalMessages: 0,
      totalKnowledgeItems: knowledge.knowledgeItems?.length || 0,
      totalUsers: users.users?.length || 0,
      avgResponseTime: 1.2,
      successRate: 94,
    }
  },

  async getConversations(companyId: string, limit = 50, offset = 0): Promise<ConversationsResponse> {
    return safeFetch<ConversationsResponse>(
      `/api/conversations?companyId=${companyId}&limit=${limit}&offset=${offset}`
    )
  },

  async getKnowledge(companyId: string, search?: string): Promise<KnowledgeResponse> {
    const params = new URLSearchParams({ companyId })
    if (search) params.set('search', search)
    return safeFetch<KnowledgeResponse>(`/api/knowledge?${params}`)
  },

  async getUsers(companyId: string): Promise<UsersResponse> {
    return safeFetch<UsersResponse>(`/api/users?companyId=${companyId}`)
  },

  async createKnowledge(data: {
    title: string
    content: string
    companyId: string
    type?: string
    titleHe?: string
    contentHe?: string
  }): Promise<{ knowledgeItem: KnowledgeItem }> {
    return safeFetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  async deleteKnowledge(id: string): Promise<{ success: boolean }> {
    return safeFetch(`/api/knowledge?id=${id}`, { method: 'DELETE' })
  },
}
