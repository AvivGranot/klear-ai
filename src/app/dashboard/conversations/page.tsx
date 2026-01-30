"use client"

import { useState, useMemo } from "react"
import {
  MessageSquare,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  Filter,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CHOCOLATE_SHOP_TOPICS,
  getProcessedConversations,
  getRepetitiveQuestions,
  JOLIKA_MANAGERS,
} from "@/data/jolika-data"
import { TopicIcon } from "@/components/TopicIcon"
import type { TopicIconName } from "@/data/jolika-data"

// Real stats from Excel analysis
const STATS = {
  totalConversations: 470,
  managerResponses: 28,
  questionsDetected: 111,
  medianResponseTime: 4.3,
  answeredWithin60Min: 82,
  managers: [
    { name: 'שלי גולדנברג', count: 15, percent: 54, responseTime: '2.5 דק׳' },
    { name: 'רותם פרחי', count: 11, percent: 39, responseTime: '6.5 דק׳' },
    { name: 'שלי בן מויאל', count: 2, percent: 7, responseTime: '0.2 דק׳' },
  ]
}

const isManager = (name: string) =>
  JOLIKA_MANAGERS.some(m => name.includes(m.name))

export default function ConversationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [topicFilter, setTopicFilter] = useState<string | null>(null)
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  const conversations = useMemo(() => getProcessedConversations(), [])
  const repetitiveQuestions = useMemo(() => getRepetitiveQuestions(), [])

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      if (topicFilter && conv.topic !== CHOCOLATE_SHOP_TOPICS.find(t => t.id === topicFilter)?.name) {
        return false
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          conv.question.toLowerCase().includes(query) ||
          conv.answer.toLowerCase().includes(query) ||
          conv.questionSender.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [conversations, topicFilter, searchQuery])

  const topicCounts = useMemo(() => {
    return CHOCOLATE_SHOP_TOPICS.map(topic => ({
      ...topic,
      count: conversations.filter(conv => conv.topic === topic.name).length
    })).filter(t => t.count > 0).sort((a, b) => b.count - a.count)
  }, [conversations])

  const toggleExpanded = (id: string) => {
    setExpandedConversations(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">שיחות</h1>
          <p className="text-gray-500 mt-1">היסטוריית שאלות ותשובות מהוואטסאפ</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#25D366]/10 text-[#25D366] text-sm font-medium rounded-full">
            WhatsApp
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{STATS.totalConversations}</p>
          <p className="text-sm text-gray-500 mt-1">סה״כ שיחות</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{STATS.managerResponses}</p>
          <p className="text-sm text-gray-500 mt-1">זוגות שאלה-תשובה</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{STATS.questionsDetected}</p>
          <p className="text-sm text-gray-500 mt-1">שאלות שזוהו</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{STATS.medianResponseTime} דק׳</p>
          <p className="text-sm text-gray-500 mt-1">זמן תגובה חציוני</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left - Top Questions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Repetitive Questions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">שאלות נפוצות ביותר</h2>
            <div className="space-y-3">
              {repetitiveQuestions.slice(0, 6).map((q, i) => {
                const topic = CHOCOLATE_SHOP_TOPICS.find(t => t.name === q.topic)
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {q.frequency}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{q.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{q.exampleQuestions[0] || q.content.slice(0, 80)}</p>
                    </div>
                    {topic && (
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full flex-shrink-0",
                        `bg-${topic.color}-50 text-${topic.color}-600`
                      )}>
                        {q.topic}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right - Manager Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">מנהלות פעילות</h2>
          <div className="space-y-4">
            {STATS.managers.map((manager, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
                      {manager.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{manager.name.split(' ')[0]}</p>
                      <p className="text-xs text-gray-500">{manager.responseTime} זמן תגובה</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{manager.percent}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#25D366] rounded-full transition-all"
                    style={{ width: `${manager.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Response Time Summary */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{STATS.medianResponseTime}</p>
                <p className="text-[10px] text-gray-500">דק׳ חציון</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{STATS.answeredWithin60Min}%</p>
                <p className="text-[10px] text-gray-500">תוך שעה</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <p className="text-lg font-bold text-emerald-600">96%</p>
                <p className="text-[10px] text-gray-500">תוך שעתיים</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Filters Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="חיפוש בשיחות..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366]"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors",
                  showFilters ? "bg-gray-100 border-gray-300" : "border-gray-200 hover:bg-gray-50"
                )}
              >
                <Filter className="w-4 h-4" />
                סינון
              </button>
            </div>
            <span className="text-sm text-gray-500">{filteredConversations.length} שיחות</span>
          </div>

          {/* Topic Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setTopicFilter(null)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors",
                  topicFilter === null
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                הכל
              </button>
              {topicCounts.slice(0, 8).map(topic => (
                <button
                  key={topic.id}
                  onClick={() => setTopicFilter(topicFilter === topic.id ? null : topic.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors",
                    topicFilter === topic.id
                      ? "bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <TopicIcon name={topic.icon as TopicIconName} className="w-3.5 h-3.5" />
                  {topic.name}
                  <span className="text-xs opacity-60">({topic.count})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div className="divide-y divide-gray-100">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <MessageSquare className="w-12 h-12 mb-3 text-gray-300" />
              <p className="font-medium">לא נמצאו שיחות</p>
              <p className="text-sm text-gray-400">נסה לשנות את מסנני החיפוש</p>
            </div>
          ) : (
            filteredConversations.slice(0, 50).map((conv) => {
              const isExpanded = expandedConversations.has(conv.id)
              const topic = CHOCOLATE_SHOP_TOPICS.find(t => t.name === conv.topic)

              return (
                <div key={conv.id}>
                  <button
                    onClick={() => toggleExpanded(conv.id)}
                    className="w-full p-4 text-right hover:bg-gray-50 transition-colors flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium flex-shrink-0">
                      {conv.questionSender.split(' ')[0].charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{conv.questionSender.split(' ')[0]}</span>
                        <span className="text-xs text-gray-400">{conv.date}</span>
                        {topic && (
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full",
                            `bg-${topic.color}-50 text-${topic.color}-600`
                          )}>
                            {conv.topic}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.question}</p>
                    </div>
                    <div className="text-gray-400 flex-shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                      <div className="mr-14 space-y-3 pt-3">
                        {/* Question */}
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-500">{conv.questionSender}</span>
                            <span className="text-xs text-gray-400">{conv.time}</span>
                          </div>
                          <p className="text-sm text-gray-800">{conv.question}</p>
                        </div>

                        {/* Answer */}
                        <div className={cn(
                          "rounded-lg p-3 mr-4",
                          isManager(conv.answerSender)
                            ? "bg-[#25D366]/10 border border-[#25D366]/20"
                            : "bg-gray-100"
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              "text-xs font-medium",
                              isManager(conv.answerSender) ? "text-[#25D366]" : "text-gray-600"
                            )}>
                              {conv.answerSender}
                            </span>
                            {isManager(conv.answerSender) && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-[#25D366]/20 text-[#25D366] rounded">
                                מנהלת
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-800">
                            {conv.isMedia ? <span className="italic text-gray-500">[מדיה]</span> : conv.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {filteredConversations.length > 50 && (
          <div className="p-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">מציג 50 מתוך {filteredConversations.length} שיחות</p>
          </div>
        )}
      </div>
    </div>
  )
}
