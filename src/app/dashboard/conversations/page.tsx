"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  MessageSquare,
  Search,
  Check,
  X,
  Edit,
  ChevronLeft,
  User,
  Bot,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Timer,
  Star,
  StickyNote,
  ChevronDown,
  BookOpen,
  Plus,
} from "lucide-react"
import { formatRelativeTime, cn } from "@/lib/utils"
import { safeFetch } from "@/lib/safeFetch"

// Gas station topic configuration
const GAS_STATION_TOPICS = [
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

function detectTopic(text: string): typeof GAS_STATION_TOPICS[0] | null {
  const lower = text.toLowerCase()
  for (const topic of GAS_STATION_TOPICS) {
    if (topic.keywords.some(kw => lower.includes(kw))) {
      return topic
    }
  }
  return null
}

const topicColorClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
}

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  createdAt: string
  confidence?: number
  isEdited?: boolean
  knowledgeItem?: {
    id: string
    title: string
    titleHe: string
  }
}

interface Conversation {
  id: string
  status: string
  rating?: number
  duration?: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    phone: string
  }
  messages: Message[]
  _count: {
    messages: number
  }
}

type StatusFilter = "all" | "active" | "closed"

interface FilterState {
  status: StatusFilter
  topic: string | null
  dateAfter: string
  dateBefore: string
  minDuration: string
  maxDuration: string
  minRating: string
  hasNotes: boolean | null
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [managerId, setManagerId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    topic: null,
    dateAfter: "",
    dateBefore: "",
    minDuration: "",
    maxDuration: "",
    minRating: "",
    hasNotes: null,
  })
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const [correctionReason, setCorrectionReason] = useState("")

  useEffect(() => {
    async function init() {
      try {
        let seedData = await safeFetch<{ seeded: boolean; companyId: string; users: Array<{ id: string; role: string }> }>("/api/seed")

        if (!seedData?.seeded) {
          await safeFetch("/api/seed", { method: "POST" })
          seedData = await safeFetch<{ seeded: boolean; companyId: string; users: Array<{ id: string; role: string }> }>("/api/seed")
        }

        if (seedData?.companyId) {
          setCompanyId(seedData.companyId)
          const manager = seedData.users?.find((u) => u.role === "manager")
          setManagerId(manager?.id || null)
        } else {
          setCompanyId("demo-company-001")
        }
      } catch (e) {
        console.error(e)
        setCompanyId("demo-company-001")
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!companyId) return

    async function loadConversations() {
      setLoading(true)
      try {
        const data = await safeFetch<{ conversations: Conversation[] }>(`/api/conversations?companyId=${companyId}`)
        // Add mock duration and rating data
        const convs = (data?.conversations || []).map((c: Conversation) => ({
          ...c,
          duration: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
          rating: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : undefined,
        }))
        setConversations(convs)
      } catch (e) {
        console.error("Error loading conversations:", e)
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [companyId])

  const loadConversationDetails = async (id: string) => {
    try {
      const data = await safeFetch<{ conversation: Conversation }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ conversationId: id }),
      })
      if (data?.conversation) {
        setSelectedConversation(data.conversation)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCorrection = async (messageId: string) => {
    if (!managerId || !editedContent.trim()) return

    try {
      await safeFetch("/api/conversations/correct", {
        method: "POST",
        body: JSON.stringify({
          messageId,
          managerId,
          correctedContent: editedContent,
          reason: correctionReason,
        }),
      })

      if (selectedConversation) {
        await loadConversationDetails(selectedConversation.id)
      }
    } catch (e) {
      console.error(e)
    }

    setEditingMessageId(null)
    setEditedContent("")
    setCorrectionReason("")
  }

  // Get conversation topic from first user message
  const getConversationTopic = (conv: Conversation) => {
    const userMessage = conv.messages.find(m => m.role === 'user')
    if (userMessage) {
      return detectTopic(userMessage.content)
    }
    return null
  }

  const filteredConversations = conversations.filter((conv) => {
    // Status filter
    if (filters.status === "active" && conv.status !== "active") return false
    if (filters.status === "closed" && conv.status === "active") return false

    // Topic filter
    if (filters.topic) {
      const convTopic = getConversationTopic(conv)
      if (!convTopic || convTopic.id !== filters.topic) return false
    }

    // Date filters
    if (filters.dateAfter) {
      const afterDate = new Date(filters.dateAfter)
      if (new Date(conv.createdAt) < afterDate) return false
    }
    if (filters.dateBefore) {
      const beforeDate = new Date(filters.dateBefore)
      if (new Date(conv.createdAt) > beforeDate) return false
    }

    // Duration filters
    if (filters.minDuration && conv.duration) {
      if (conv.duration < parseInt(filters.minDuration)) return false
    }
    if (filters.maxDuration && conv.duration) {
      if (conv.duration > parseInt(filters.maxDuration)) return false
    }

    // Rating filter
    if (filters.minRating && conv.rating) {
      if (conv.rating < parseInt(filters.minRating)) return false
    }

    // Search filter
    if (!searchQuery) return true
    return (
      conv.user.name.includes(searchQuery) ||
      conv.user.phone.includes(searchQuery) ||
      conv.messages.some((m) => m.content.includes(searchQuery))
    )
  })

  const statusCounts = {
    all: conversations.length,
    active: conversations.filter(c => c.status === "active").length,
    closed: conversations.filter(c => c.status !== "active").length,
  }

  const activeFiltersCount = [
    filters.topic,
    filters.dateAfter,
    filters.dateBefore,
    filters.minDuration,
    filters.maxDuration,
    filters.minRating,
    filters.hasNotes !== null,
  ].filter(Boolean).length

  const clearFilters = () => {
    setFilters({
      status: "all",
      topic: null,
      dateAfter: "",
      dateBefore: "",
      minDuration: "",
      maxDuration: "",
      minRating: "",
      hasNotes: null,
    })
  }

  // Calculate topic counts
  const topicCounts = GAS_STATION_TOPICS.map(topic => ({
    ...topic,
    count: conversations.filter(conv => {
      const convTopic = getConversationTopic(conv)
      return convTopic?.id === topic.id
    }).length
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 h-[600px]">
          <div className="bg-gray-200 rounded-xl animate-pulse" />
          <div className="col-span-2 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">היסטוריית שיחות</h1>
          <Badge className="bg-gray-900 text-white">חדש</Badge>
        </div>
        <div className="relative w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חיפוש שיחות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* Filter Chips - ElevenLabs Style */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filters */}
        <button
          onClick={() => setFilters({ ...filters, status: "all" })}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full transition-colors",
            filters.status === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          הכל ({statusCounts.all})
        </button>
        <button
          onClick={() => setFilters({ ...filters, status: "active" })}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5",
            filters.status === "active"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          פעיל ({statusCounts.active})
        </button>
        <button
          onClick={() => setFilters({ ...filters, status: "closed" })}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5",
            filters.status === "closed"
              ? "bg-gray-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <XCircle className="w-3.5 h-3.5" />
          סגור ({statusCounts.closed})
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Topic Filter Chips */}
        {topicCounts.slice(0, 5).map(topic => {
          const colors = topicColorClasses[topic.color] || topicColorClasses.gray
          const isActive = filters.topic === topic.id
          return (
            <button
              key={topic.id}
              onClick={() => setFilters({ ...filters, topic: isActive ? null : topic.id })}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5",
                isActive
                  ? `${colors.bg} ${colors.text} border ${colors.border}`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <span>{topic.icon}</span>
              {topic.name}
              <span className="text-xs opacity-70">({topic.count})</span>
            </button>
          )
        })}

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Additional Filter Chips */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5",
            filters.dateAfter || filters.dateBefore
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          + תאריך
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5",
            filters.minDuration || filters.maxDuration
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Timer className="w-3.5 h-3.5" />
          + משך
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5",
            filters.minRating
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Star className="w-3.5 h-3.5" />
          + דירוג
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5",
            filters.hasNotes !== null
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <StickyNote className="w-3.5 h-3.5" />
          + הערות
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-sm rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            נקה פילטרים ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <Card className="border border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">תאריך אחרי</label>
              <Input
                type="date"
                value={filters.dateAfter}
                onChange={(e) => setFilters({ ...filters, dateAfter: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">תאריך לפני</label>
              <Input
                type="date"
                value={filters.dateBefore}
                onChange={(e) => setFilters({ ...filters, dateBefore: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">משך מינימלי (שניות)</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minDuration}
                onChange={(e) => setFilters({ ...filters, minDuration: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">משך מקסימלי (שניות)</label>
              <Input
                type="number"
                placeholder="999"
                value={filters.maxDuration}
                onChange={(e) => setFilters({ ...filters, maxDuration: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">דירוג מינימלי</label>
              <select
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white"
              >
                <option value="">הכל</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <div className="flex gap-4 h-[calc(100vh-18rem)]">
        {/* Conversations List */}
        <Card className={cn(
          "w-80 shrink-0 border border-gray-200 overflow-hidden",
          selectedConversation && "hidden md:block"
        )}>
          <CardContent className="p-0 h-full overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                <MessageSquare className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium">אין שיחות</p>
                <p className="text-sm text-gray-400">שיחות חדשות יופיעו כאן</p>
              </div>
            ) : (
              <div>
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversationDetails(conv.id)}
                    className={cn(
                      "w-full p-4 text-right border-b border-gray-100 hover:bg-gray-50 transition-colors",
                      selectedConversation?.id === conv.id && "bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm shrink-0">
                        {conv.user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium text-gray-900 text-sm truncate">
                            {conv.user.name}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">
                            {formatRelativeTime(conv.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={cn(
                              "text-[10px] px-1.5",
                              conv.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {conv.status === "active" ? "פעיל" : "סגור"}
                          </Badge>
                          {(() => {
                            const topic = getConversationTopic(conv)
                            if (topic) {
                              const colors = topicColorClasses[topic.color] || topicColorClasses.gray
                              return (
                                <Badge className={`text-[10px] px-1.5 ${colors.bg} ${colors.text}`}>
                                  {topic.icon} {topic.name}
                                </Badge>
                              )
                            }
                            return null
                          })()}
                          {conv.duration && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Timer className="w-3 h-3" />
                              {formatDuration(conv.duration)}
                            </span>
                          )}
                          {conv.rating && (
                            <span className="text-[10px] text-yellow-600 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-yellow-400" />
                              {conv.rating}
                            </span>
                          )}
                        </div>
                        {conv.messages[0] && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conv.messages[0].content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation Detail */}
        <Card className="flex-1 border border-gray-200 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                    {selectedConversation.user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedConversation.user.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.user.phone}
                    </p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    selectedConversation.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {selectedConversation.status === "active" ? "פעיל" : "סגור"}
                </Badge>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "flex-row" : "flex-row-reverse"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        message.role === "user"
                          ? "bg-gray-200 text-gray-600"
                          : "bg-gray-900 text-white"
                      )}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>

                    <div
                      className={cn(
                        "flex-1 max-w-[75%]",
                        message.role === "assistant" && "text-left"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-xl p-3",
                          message.role === "user"
                            ? "bg-white border border-gray-200"
                            : "bg-white border border-gray-200"
                        )}
                      >
                        {editingMessageId === message.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="min-h-[100px] text-sm"
                            />
                            <Input
                              placeholder="סיבת התיקון (אופציונלי)"
                              value={correctionReason}
                              onChange={(e) => setCorrectionReason(e.target.value)}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleCorrection(message.id)}
                                className="bg-gray-900 hover:bg-gray-800"
                              >
                                <Check className="w-4 h-4 ml-1" />
                                שמור
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMessageId(null)
                                  setEditedContent("")
                                }}
                              >
                                <X className="w-4 h-4 ml-1" />
                                ביטול
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {message.content}
                            </p>
                            {message.isEdited && (
                              <span className="text-xs text-gray-400 mt-1 block">(תוקן)</span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 px-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(message.createdAt)}</span>
                        {message.role === "assistant" && (
                          <>
                            {message.confidence !== undefined && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5",
                                  message.confidence > 0.7
                                    ? "border-green-200 text-green-600"
                                    : message.confidence > 0.4
                                    ? "border-yellow-200 text-yellow-600"
                                    : "border-red-200 text-red-600"
                                )}
                              >
                                {Math.round(message.confidence * 100)}% בטחון
                              </Badge>
                            )}
                            {message.knowledgeItem && (
                              <Badge variant="outline" className="text-[10px] px-1.5">
                                {message.knowledgeItem.titleHe || message.knowledgeItem.title}
                              </Badge>
                            )}
                            {!editingMessageId && (
                              <button
                                onClick={() => {
                                  setEditingMessageId(message.id)
                                  setEditedContent(message.content)
                                }}
                                className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                              >
                                <Edit className="w-3 h-3" />
                                תקן
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium text-gray-600">בחר שיחה לצפייה</p>
                <p className="text-sm text-gray-400 mt-1">לחץ על שיחה מהרשימה לראות פרטים</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
