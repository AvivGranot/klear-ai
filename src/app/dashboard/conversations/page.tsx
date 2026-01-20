"use client"

import { useEffect, useState, useRef, useCallback } from "react"
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
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Timer,
  Star,
  StickyNote,
} from "lucide-react"
import { formatRelativeTime, cn } from "@/lib/utils"
import { safeFetch } from "@/lib/safeFetch"

// Accessibility: Live region announcer for screen readers
function useAnnounce() {
  const [announcement, setAnnouncement] = useState("")
  const announce = useCallback((message: string) => {
    setAnnouncement("")
    setTimeout(() => setAnnouncement(message), 100)
  }, [])
  return { announcement, announce }
}

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

  // Accessibility refs and state
  const { announcement, announce } = useAnnounce()
  const conversationListRef = useRef<HTMLDivElement>(null)
  const messageAreaRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [focusedConversationIndex, setFocusedConversationIndex] = useState(-1)

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
        announce(`נטען שיחה עם ${data.conversation.user.name}, ${data.conversation.messages.length} הודעות`)
        // Focus message area for keyboard users
        setTimeout(() => messageAreaRef.current?.focus(), 100)
      }
    } catch (e) {
      console.error(e)
      announce("שגיאה בטעינת השיחה")
    }
  }

  // Keyboard navigation for conversation list
  const handleConversationKeyDown = (e: React.KeyboardEvent, index: number, convId: string) => {
    const conversations = filteredConversations
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        if (index < conversations.length - 1) {
          setFocusedConversationIndex(index + 1)
        }
        break
      case "ArrowUp":
        e.preventDefault()
        if (index > 0) {
          setFocusedConversationIndex(index - 1)
        }
        break
      case "Enter":
      case " ":
        e.preventDefault()
        loadConversationDetails(convId)
        break
      case "Home":
        e.preventDefault()
        setFocusedConversationIndex(0)
        break
      case "End":
        e.preventDefault()
        setFocusedConversationIndex(conversations.length - 1)
        break
    }
  }

  // Focus management for conversation list
  useEffect(() => {
    if (focusedConversationIndex >= 0 && conversationListRef.current) {
      const items = conversationListRef.current.querySelectorAll('[role="option"]')
      const item = items[focusedConversationIndex] as HTMLElement
      item?.focus()
    }
  }, [focusedConversationIndex])

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
      <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">טוען שיחות...</span>
        <div className="flex justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" aria-hidden="true" />
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" aria-hidden="true" />
        </div>
        <div className="flex gap-2 flex-wrap" aria-hidden="true">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 h-[600px]" aria-hidden="true">
          <div className="bg-gray-200 rounded-xl animate-pulse" />
          <div className="col-span-2 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Skip link for keyboard users */}
      <a
        href="#conversation-list"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-gray-900 focus:text-white focus:p-3 focus:rounded-lg"
      >
        דלג לרשימת השיחות
      </a>

      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">היסטוריית שיחות</h1>
          <Badge className="bg-[var(--klear-green)] text-white" aria-label="תכונה חדשה">חדש</Badge>
        </div>
        <div className="relative w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <Input
            ref={searchInputRef}
            placeholder="חיפוש שיחות..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              announce(`מחפש: ${e.target.value || "הכל"}`)
            }}
            className="pr-9"
            aria-label="חיפוש שיחות"
            role="searchbox"
          />
        </div>
      </header>

      {/* Filter Chips */}
      <nav aria-label="סינון שיחות" className="flex flex-wrap items-center gap-2" role="group">
        {/* Status Filters */}
        <div role="radiogroup" aria-label="סנן לפי סטטוס" className="flex items-center gap-2">
          <button
            onClick={() => {
              setFilters({ ...filters, status: "all" })
              announce(`מציג את כל השיחות: ${statusCounts.all}`)
            }}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2",
              filters.status === "all"
                ? "bg-[var(--klear-green)] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            role="radio"
            aria-checked={filters.status === "all"}
            aria-label={`הכל: ${statusCounts.all} שיחות`}
          >
            הכל ({statusCounts.all})
          </button>
          <button
            onClick={() => {
              setFilters({ ...filters, status: "active" })
              announce(`מציג שיחות פעילות: ${statusCounts.active}`)
            }}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2",
              filters.status === "active"
                ? "bg-[var(--klear-green)] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            role="radio"
            aria-checked={filters.status === "active"}
            aria-label={`שיחות פעילות: ${statusCounts.active}`}
          >
            <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
            פעיל ({statusCounts.active})
          </button>
          <button
            onClick={() => {
              setFilters({ ...filters, status: "closed" })
              announce(`מציג שיחות סגורות: ${statusCounts.closed}`)
            }}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2",
              filters.status === "closed"
                ? "bg-gray-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            role="radio"
            aria-checked={filters.status === "closed"}
            aria-label={`שיחות סגורות: ${statusCounts.closed}`}
          >
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            סגור ({statusCounts.closed})
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" role="separator" aria-hidden="true" />

        {/* Topic Filter Chips */}
        <div role="group" aria-label="סנן לפי נושא" className="flex items-center gap-2 flex-wrap">
          {topicCounts.slice(0, 5).map(topic => {
            const colors = topicColorClasses[topic.color] || topicColorClasses.gray
            const isActive = filters.topic === topic.id
            return (
              <button
                key={topic.id}
                onClick={() => {
                  const newTopic = isActive ? null : topic.id
                  setFilters({ ...filters, topic: newTopic })
                  announce(newTopic ? `מסנן לפי ${topic.name}: ${topic.count} שיחות` : "הוסר סינון נושא")
                }}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2",
                  isActive
                    ? `${colors.bg} ${colors.text} border ${colors.border} focus:ring-current`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-400"
                )}
                aria-pressed={isActive}
                aria-label={`${topic.name}: ${topic.count} שיחות${isActive ? " - נבחר" : ""}`}
              >
                <span aria-hidden="true">{topic.icon}</span>
                {topic.name}
                <span className="text-xs opacity-70" aria-hidden="true">({topic.count})</span>
              </button>
            )
          })}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" role="separator" aria-hidden="true" />

        {/* Additional Filter Chips */}
        <div role="group" aria-label="סינונים נוספים" className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              filters.dateAfter || filters.dateBefore
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            aria-expanded={showFilters}
            aria-controls="advanced-filters"
            aria-pressed={!!(filters.dateAfter || filters.dateBefore)}
          >
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>+ תאריך</span>
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              filters.minDuration || filters.maxDuration
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            aria-expanded={showFilters}
            aria-controls="advanced-filters"
            aria-pressed={!!(filters.minDuration || filters.maxDuration)}
          >
            <Timer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>+ משך</span>
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              filters.minRating
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            aria-expanded={showFilters}
            aria-controls="advanced-filters"
            aria-pressed={!!filters.minRating}
          >
            <Star className="w-3.5 h-3.5" aria-hidden="true" />
            <span>+ דירוג</span>
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              filters.hasNotes !== null
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            aria-expanded={showFilters}
            aria-controls="advanced-filters"
            aria-pressed={filters.hasNotes !== null}
          >
            <StickyNote className="w-3.5 h-3.5" aria-hidden="true" />
            <span>+ הערות</span>
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                clearFilters()
                announce("כל הסינונים נמחקו")
              }}
              className="px-3 py-1.5 text-sm rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              aria-label={`נקה ${activeFiltersCount} פילטרים פעילים`}
            >
              נקה פילטרים ({activeFiltersCount})
            </button>
          )}
        </div>
      </nav>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <Card id="advanced-filters" className="border border-gray-200 p-4" role="region" aria-label="סינונים מתקדמים">
          <fieldset>
            <legend className="sr-only">סינונים מתקדמים</legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="filter-date-after" className="text-xs font-medium text-gray-500 mb-1.5 block">
                  תאריך אחרי
                </label>
                <Input
                  id="filter-date-after"
                  type="date"
                  value={filters.dateAfter}
                  onChange={(e) => setFilters({ ...filters, dateAfter: e.target.value })}
                  className="text-sm"
                  aria-describedby="filter-date-after-desc"
                />
                <span id="filter-date-after-desc" className="sr-only">הזן תאריך התחלה לסינון</span>
              </div>
              <div>
                <label htmlFor="filter-date-before" className="text-xs font-medium text-gray-500 mb-1.5 block">
                  תאריך לפני
                </label>
                <Input
                  id="filter-date-before"
                  type="date"
                  value={filters.dateBefore}
                  onChange={(e) => setFilters({ ...filters, dateBefore: e.target.value })}
                  className="text-sm"
                  aria-describedby="filter-date-before-desc"
                />
                <span id="filter-date-before-desc" className="sr-only">הזן תאריך סיום לסינון</span>
              </div>
              <div>
                <label htmlFor="filter-min-duration" className="text-xs font-medium text-gray-500 mb-1.5 block">
                  משך מינימלי (שניות)
                </label>
                <Input
                  id="filter-min-duration"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={filters.minDuration}
                  onChange={(e) => setFilters({ ...filters, minDuration: e.target.value })}
                  className="text-sm"
                  aria-describedby="filter-min-duration-desc"
                />
                <span id="filter-min-duration-desc" className="sr-only">הזן משך שיחה מינימלי בשניות</span>
              </div>
              <div>
                <label htmlFor="filter-max-duration" className="text-xs font-medium text-gray-500 mb-1.5 block">
                  משך מקסימלי (שניות)
                </label>
                <Input
                  id="filter-max-duration"
                  type="number"
                  placeholder="999"
                  min="0"
                  value={filters.maxDuration}
                  onChange={(e) => setFilters({ ...filters, maxDuration: e.target.value })}
                  className="text-sm"
                  aria-describedby="filter-max-duration-desc"
                />
                <span id="filter-max-duration-desc" className="sr-only">הזן משך שיחה מקסימלי בשניות</span>
              </div>
              <div>
                <label htmlFor="filter-min-rating" className="text-xs font-medium text-gray-500 mb-1.5 block">
                  דירוג מינימלי
                </label>
                <select
                  id="filter-min-rating"
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                  aria-describedby="filter-min-rating-desc"
                >
                  <option value="">הכל</option>
                  <option value="1">1 כוכב ומעלה</option>
                  <option value="2">2 כוכבים ומעלה</option>
                  <option value="3">3 כוכבים ומעלה</option>
                  <option value="4">4 כוכבים ומעלה</option>
                  <option value="5">5 כוכבים בלבד</option>
                </select>
                <span id="filter-min-rating-desc" className="sr-only">בחר דירוג מינימלי לסינון</span>
              </div>
            </div>
          </fieldset>
        </Card>
      )}

      {/* Main Content */}
      <main className="flex gap-4 h-[calc(100vh-18rem)]" role="main">
        {/* Conversations List */}
        <Card
          id="conversation-list"
          className={cn(
            "w-80 shrink-0 border border-gray-200 overflow-hidden",
            selectedConversation && "hidden md:block"
          )}
        >
          <CardContent className="p-0 h-full overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-full text-gray-500 p-6"
                role="status"
                aria-label="אין שיחות להצגה"
              >
                <MessageSquare className="w-12 h-12 mb-3 text-gray-300" aria-hidden="true" />
                <p className="font-medium">אין שיחות</p>
                <p className="text-sm text-gray-400">שיחות חדשות יופיעו כאן</p>
              </div>
            ) : (
              <div
                ref={conversationListRef}
                role="listbox"
                aria-label={`רשימת שיחות, ${filteredConversations.length} תוצאות`}
                aria-activedescendant={selectedConversation ? `conv-${selectedConversation.id}` : undefined}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" && focusedConversationIndex === -1) {
                    e.preventDefault()
                    setFocusedConversationIndex(0)
                  }
                }}
              >
                {filteredConversations.map((conv, index) => {
                  const topic = getConversationTopic(conv)
                  const isSelected = selectedConversation?.id === conv.id
                  return (
                    <div
                      key={conv.id}
                      id={`conv-${conv.id}`}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={focusedConversationIndex === index ? 0 : -1}
                      onClick={() => loadConversationDetails(conv.id)}
                      onKeyDown={(e) => handleConversationKeyDown(e, index, conv.id)}
                      className={cn(
                        "w-full p-4 text-right border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                        "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-900",
                        isSelected && "bg-[rgba(37,211,102,0.1)] border-r-4 border-r-[var(--klear-green)]"
                      )}
                      aria-label={`שיחה עם ${conv.user.name}, ${conv.status === "active" ? "פעיל" : "סגור"}, ${topic?.name || "ללא נושא"}, ${formatRelativeTime(conv.updatedAt)}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm shrink-0"
                          aria-hidden="true"
                        >
                          {conv.user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {conv.user.name}
                            </span>
                            <time
                              className="text-xs text-gray-400 shrink-0"
                              dateTime={conv.updatedAt}
                            >
                              {formatRelativeTime(conv.updatedAt)}
                            </time>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={cn(
                                "text-[10px] px-1.5",
                                conv.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-700"
                              )}
                            >
                              {conv.status === "active" ? "פעיל" : "סגור"}
                            </Badge>
                            {topic && (
                              <Badge
                                className={`text-[10px] px-1.5 ${topicColorClasses[topic.color]?.bg || 'bg-gray-100'} ${topicColorClasses[topic.color]?.text || 'text-gray-600'}`}
                              >
                                <span aria-hidden="true">{topic.icon}</span> {topic.name}
                              </Badge>
                            )}
                            {conv.duration && (
                              <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                <Timer className="w-3 h-3" aria-hidden="true" />
                                <span aria-label={`משך: ${Math.floor(conv.duration / 60)} דקות ו-${conv.duration % 60} שניות`}>
                                  {formatDuration(conv.duration)}
                                </span>
                              </span>
                            )}
                            {conv.rating && (
                              <span className="text-[10px] text-yellow-700 flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-yellow-400" aria-hidden="true" />
                                <span aria-label={`דירוג: ${conv.rating} כוכבים`}>{conv.rating}</span>
                              </span>
                            )}
                          </div>
                          {conv.messages[0] && (
                            <p className="text-xs text-gray-500 truncate mt-1" aria-hidden="true">
                              {conv.messages[0].content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation Detail */}
        <Card
          className="flex-1 border border-gray-200 flex flex-col overflow-hidden"
          role="region"
          aria-label={selectedConversation ? `שיחה עם ${selectedConversation.user.name}` : "בחר שיחה"}
        >
          {selectedConversation ? (
            <>
              {/* Header */}
              <header className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedConversation(null)
                      announce("חזרה לרשימת השיחות")
                      setTimeout(() => conversationListRef.current?.focus(), 100)
                    }}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    aria-label="חזור לרשימת השיחות"
                  >
                    <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <div
                    className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium"
                    aria-hidden="true"
                  >
                    {selectedConversation.user.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-medium text-gray-900">
                      {selectedConversation.user.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      <span className="sr-only">מספר טלפון: </span>
                      {selectedConversation.user.phone}
                    </p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    selectedConversation.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-700"
                  )}
                  aria-label={`סטטוס: ${selectedConversation.status === "active" ? "פעיל" : "סגור"}`}
                >
                  {selectedConversation.status === "active" ? "פעיל" : "סגור"}
                </Badge>
              </header>

              {/* Messages */}
              <div
                ref={messageAreaRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                role="log"
                aria-label={`הודעות בשיחה, ${selectedConversation.messages.length} הודעות`}
                aria-live="polite"
                tabIndex={-1}
              >
                {selectedConversation.messages.map((message) => (
                  <article
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "flex-row" : "flex-row-reverse"
                    )}
                    aria-label={`${message.role === "user" ? "הודעת משתמש" : "תשובת בוט"}, ${formatRelativeTime(message.createdAt)}`}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        message.role === "user"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-gray-900 text-white"
                      )}
                      aria-hidden="true"
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
                          <div className="space-y-3" role="form" aria-label="עריכת הודעה">
                            <label htmlFor={`edit-content-${message.id}`} className="sr-only">
                              תוכן ההודעה המתוקן
                            </label>
                            <Textarea
                              id={`edit-content-${message.id}`}
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="min-h-[100px] text-sm"
                              aria-describedby={`edit-help-${message.id}`}
                            />
                            <label htmlFor={`edit-reason-${message.id}`} className="sr-only">
                              סיבת התיקון
                            </label>
                            <Input
                              id={`edit-reason-${message.id}`}
                              placeholder="סיבת התיקון (אופציונלי)"
                              value={correctionReason}
                              onChange={(e) => setCorrectionReason(e.target.value)}
                              className="text-sm"
                            />
                            <span id={`edit-help-${message.id}`} className="sr-only">
                              ערוך את תוכן ההודעה והוסף סיבה אם תרצה
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleCorrection(message.id)
                                  announce("ההודעה תוקנה בהצלחה")
                                }}
                                className="bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)] focus:ring-2 focus:ring-offset-2 focus:ring-[var(--klear-green)]"
                              >
                                <Check className="w-4 h-4 ml-1" aria-hidden="true" />
                                שמור
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMessageId(null)
                                  setEditedContent("")
                                  announce("העריכה בוטלה")
                                }}
                                className="focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                              >
                                <X className="w-4 h-4 ml-1" aria-hidden="true" />
                                ביטול
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {message.content}
                            </p>
                            {message.isEdited && (
                              <span className="text-xs text-gray-500 mt-1 block" aria-label="הודעה זו תוקנה">
                                (תוקן)
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 px-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <time dateTime={message.createdAt}>
                          {formatRelativeTime(message.createdAt)}
                        </time>
                        {message.role === "assistant" && (
                          <>
                            {message.confidence !== undefined && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5",
                                  message.confidence > 0.7
                                    ? "border-green-300 text-green-700 bg-green-50"
                                    : message.confidence > 0.4
                                    ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                                    : "border-red-300 text-red-700 bg-red-50"
                                )}
                                aria-label={`רמת בטחון: ${Math.round(message.confidence * 100)} אחוז`}
                              >
                                {Math.round(message.confidence * 100)}% בטחון
                              </Badge>
                            )}
                            {message.knowledgeItem && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5"
                                aria-label={`מקור: ${message.knowledgeItem.titleHe || message.knowledgeItem.title}`}
                              >
                                {message.knowledgeItem.titleHe || message.knowledgeItem.title}
                              </Badge>
                            )}
                            {!editingMessageId && (
                              <button
                                onClick={() => {
                                  setEditingMessageId(message.id)
                                  setEditedContent(message.content)
                                  announce("מצב עריכה פעיל")
                                }}
                                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 focus:outline-none focus:underline"
                                aria-label="תקן הודעה זו"
                              >
                                <Edit className="w-3 h-3" aria-hidden="true" />
                                תקן
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div
              className="flex-1 flex items-center justify-center"
              role="status"
              aria-label="לא נבחרה שיחה"
            >
              <div className="text-center text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" aria-hidden="true" />
                <p className="font-medium text-gray-700">בחר שיחה לצפייה</p>
                <p className="text-sm text-gray-500 mt-1">לחץ על שיחה מהרשימה לראות פרטים</p>
                <p className="text-xs text-gray-400 mt-3">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-600">↑</kbd>
                  {" "}
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-600">↓</kbd>
                  {" "}לניווט,{" "}
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-600">Enter</kbd>
                  {" "}לבחירה
                </p>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
