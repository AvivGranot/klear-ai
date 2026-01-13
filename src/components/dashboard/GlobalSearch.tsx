"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  BookOpen,
  MessageSquare,
  Users,
  FileText,
  Zap,
  X,
  ArrowRight,
  Loader2
} from "lucide-react"
import { knowledgeItems, conversations, GAS_STATION_TOPICS } from "@/data/gas-station-data"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  title: string
  description: string
  type: "knowledge" | "conversation" | "automation" | "topic"
  icon: React.ElementType
  href: string
  topicColor?: string
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery("")
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Search function
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    const normalizedQuery = searchQuery.toLowerCase()
    const searchResults: SearchResult[] = []

    // Search topics first
    GAS_STATION_TOPICS.forEach((topic) => {
      if (
        topic.name.includes(searchQuery) ||
        topic.keywords.some((kw) => kw.includes(normalizedQuery))
      ) {
        searchResults.push({
          id: `topic-${topic.id}`,
          title: `${topic.icon} ${topic.name}`,
          description: `נושא: ${topic.keywords.join(", ")}`,
          type: "topic",
          icon: BookOpen,
          href: `/dashboard/conversations?topic=${topic.id}`,
          topicColor: topic.color,
        })
      }
    })

    // Search knowledge items
    knowledgeItems.forEach((item, index) => {
      const title = item.titleHe || item.title
      const content = item.contentHe || item.content

      if (
        title.toLowerCase().includes(normalizedQuery) ||
        content.toLowerCase().includes(normalizedQuery)
      ) {
        const isAutomation = item.type === "repeated_answer"
        searchResults.push({
          id: `kb-${index}`,
          title: title.slice(0, 60) + (title.length > 60 ? "..." : ""),
          description: content.slice(0, 100) + "...",
          type: isAutomation ? "automation" : "knowledge",
          icon: isAutomation ? Zap : FileText,
          href: `/dashboard/knowledge?highlight=${index}`,
        })
      }
    })

    // Search conversations
    conversations.slice(0, 100).forEach((conv, index) => {
      if (
        conv.question.toLowerCase().includes(normalizedQuery) ||
        conv.answer.toLowerCase().includes(normalizedQuery)
      ) {
        searchResults.push({
          id: `conv-${index}`,
          title: conv.question.slice(0, 60) + (conv.question.length > 60 ? "..." : ""),
          description: `${conv.questionSender} → ${conv.answerSender}`,
          type: "conversation",
          icon: MessageSquare,
          href: `/dashboard/conversations?highlight=${index}`,
        })
      }
    })

    // Limit results
    setResults(searchResults.slice(0, 15))
    setSelectedIndex(0)
    setIsSearching(false)
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 200)
    return () => clearTimeout(timer)
  }, [query, performSearch])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      router.push(results[selectedIndex].href)
      setIsOpen(false)
    }
  }

  const typeLabels: Record<string, string> = {
    knowledge: "מאגר ידע",
    conversation: "שיחה",
    automation: "אוטומציה",
    topic: "נושא",
  }

  const typeColors: Record<string, string> = {
    knowledge: "bg-blue-100 text-blue-700",
    conversation: "bg-purple-100 text-purple-700",
    automation: "bg-green-100 text-green-700",
    topic: "bg-orange-100 text-orange-700",
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 w-64 hover:bg-gray-200 transition-colors"
      >
        <Search className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400 flex-1 text-right">חיפוש...</span>
        <kbd className="text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">
          ⌘K
        </kbd>
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" dir="rtl">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="חיפוש במאגר הידע, שיחות, נושאים..."
              className="flex-1 bg-transparent border-0 outline-none text-base placeholder-gray-400"
            />
            {isSearching && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query && results.length === 0 && !isSearching && (
              <div className="py-12 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>לא נמצאו תוצאות עבור &quot;{query}&quot;</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      router.push(result.href)
                      setIsOpen(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-right transition-colors",
                      selectedIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      result.type === "topic" && result.topicColor
                        ? `bg-${result.topicColor}-100`
                        : "bg-gray-100"
                    )}>
                      <result.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {result.title}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full flex-shrink-0",
                          typeColors[result.type]
                        )}>
                          {typeLabels[result.type]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {result.description}
                      </p>
                    </div>
                    {selectedIndex === index && (
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 self-center" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Actions when no query */}
            {!query && (
              <div className="py-4 px-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                  גישה מהירה
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: BookOpen, label: "מאגר ידע", href: "/dashboard/knowledge" },
                    { icon: MessageSquare, label: "שיחות", href: "/dashboard/conversations" },
                    { icon: Zap, label: "אוטומציות", href: "/dashboard/knowledge#automations" },
                    { icon: Users, label: "משתמשים", href: "/dashboard/users" },
                  ].map((action) => (
                    <button
                      key={action.href}
                      onClick={() => {
                        router.push(action.href)
                        setIsOpen(false)
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <action.icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{action.label}</span>
                    </button>
                  ))}
                </div>

                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 mt-6">
                  נושאים פופולריים
                </p>
                <div className="flex flex-wrap gap-2">
                  {GAS_STATION_TOPICS.slice(0, 6).map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setQuery(topic.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                    >
                      <span>{topic.icon}</span>
                      <span className="text-gray-700">{topic.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↓</kbd>
                לניווט
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">Enter</kbd>
                לבחירה
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">Esc</kbd>
                לסגירה
              </span>
            </div>
            <span>{results.length} תוצאות</span>
          </div>
        </div>
      </div>
    </>
  )
}
