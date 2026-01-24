"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  MessageSquare,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  TrendingUp,
  Repeat,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

// Import data and helpers from centralized Jolika data
import {
  CHOCOLATE_SHOP_TOPICS,
  getProcessedConversations,
  getManagerStats,
  getRepetitiveQuestions,
  getConversationsByDate,
  getConversationTypeCounts,
  conversations as rawConversations,
} from "@/data/jolika-data"
import { TopicIcon } from "@/components/TopicIcon"
import type { TopicIconName, ConversationType } from "@/data/jolika-data"

// Conversation type labels in Hebrew
const CONVERSATION_TYPE_LABELS: Record<ConversationType, { label: string; icon: React.ElementType; color: string }> = {
  question: { label: 'שאלה', icon: MessageSquare, color: 'blue' },
  employee_report: { label: 'דיווח', icon: User, color: 'amber' },
  announcement: { label: 'הודעה', icon: Phone, color: 'purple' },
}

// The 3 real managers at Jolika
const MANAGERS = [
  { name: 'שלי גולדנברג', role: 'בעלים ומנהלת ראשית' },
  { name: 'שלי בן מויאל', role: 'מנהלת' },
  { name: 'רותם פרחי', role: 'מנהלת' },
]

const isManager = (name: string) =>
  MANAGERS.some(m => name.includes(m.name))

const getManagerRole = (name: string) => {
  const manager = MANAGERS.find(m => name.includes(m.name))
  return manager?.role || null
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
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
}

// KPI Card Component
function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  className,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  trend?: "up" | "down"
  trendValue?: string
  className?: string
}) {
  return (
    <Card className={cn("border border-gray-200", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trendValue && (
              <p className={cn(
                "text-xs mt-1 flex items-center gap-1",
                trend === "up" ? "text-green-600" : "text-red-600"
              )}>
                <TrendingUp className={cn("w-3 h-3", trend === "down" && "rotate-180")} />
                {trendValue}
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <Icon className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ConversationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [topicFilter, setTopicFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<ConversationType | null>(null)
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set())

  // Get processed data
  const conversations = useMemo(() => getProcessedConversations(), [])
  const allStaffStats = useMemo(() => getManagerStats(), [])
  const repetitiveQuestions = useMemo(() => getRepetitiveQuestions(), [])
  const timelineData = useMemo(() => getConversationsByDate(), [])
  const typeCounts = useMemo(() => getConversationTypeCounts(), [])

  // Split staff stats into managers and employees
  const { managerStats, employeeStats } = useMemo(() => {
    const managers = allStaffStats.filter(s => isManager(s.name))
    const employees = allStaffStats.filter(s => !isManager(s.name))
    return { managerStats: managers, employeeStats: employees }
  }, [allStaffStats])

  // Count responses from actual managers (not just Shelly)
  const managerResponseCount = useMemo(() => {
    return rawConversations.filter(conv => isManager(conv.answerSender || '')).length
  }, [])

  // Mock escalation count (will be real in Phase B)
  const escalationCount = 12

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Type filter
      if (typeFilter && conv.type !== typeFilter) {
        return false
      }

      // Topic filter
      if (topicFilter && conv.topic !== CHOCOLATE_SHOP_TOPICS.find(t => t.id === topicFilter)?.name) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          conv.question.toLowerCase().includes(query) ||
          conv.answer.toLowerCase().includes(query) ||
          conv.questionSender.toLowerCase().includes(query) ||
          conv.answerSender.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [conversations, topicFilter, typeFilter, searchQuery])

  // Get topic counts for filter badges
  const topicCounts = useMemo(() => {
    return CHOCOLATE_SHOP_TOPICS.map(topic => ({
      ...topic,
      count: conversations.filter(conv => conv.topic === topic.name).length
    })).filter(t => t.count > 0).sort((a, b) => b.count - a.count)
  }, [conversations])

  // Toggle conversation expansion
  const toggleExpanded = (id: string) => {
    setExpandedConversations(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Get sender short name
  const getShortName = (fullName: string) => {
    return fullName.split(' ')[0]
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">היסטוריית שיחות</h1>
          <Badge className="bg-[var(--klear-green)] text-white">WhatsApp</Badge>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="סה״כ שיחות"
          value={rawConversations.length}
          icon={MessageSquare}
          trend="up"
          trendValue="5+ שנות היסטוריה"
        />
        <KPICard
          label="תשובות מנהלות"
          value={managerResponseCount}
          icon={Phone}
          trend="up"
          trendValue={`${Math.round((managerResponseCount / rawConversations.length) * 100)}% מהשיחות`}
        />
        <KPICard
          label="שאלות עם ?"
          value={typeCounts.question}
          icon={Repeat}
          trendValue={`${typeCounts.employee_report} דיווחים, ${typeCounts.announcement} הודעות`}
        />
        <KPICard
          label="אסקלציות מהבוט"
          value={escalationCount}
          icon={Users}
          className="opacity-60"
        />
      </div>

      {/* Timeline Chart */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">שיחות לאורך זמן</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    direction: 'rtl',
                  }}
                  labelFormatter={(label) => `תאריך: ${label}`}
                  formatter={(value) => [`${value} שיחות`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#colorConversations)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Repetitive Questions */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Repeat className="w-5 h-5 text-gray-500" />
              שאלות נפוצות ביותר
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {repetitiveQuestions.slice(0, 6).map((q, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--klear-green)] text-white flex items-center justify-center text-sm font-medium shrink-0">
                    {q.frequency}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {q.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {q.exampleQuestions[0] || q.content.slice(0, 50) + '...'}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-[10px] shrink-0",
                      topicColorClasses[CHOCOLATE_SHOP_TOPICS.find(t => t.name === q.topic)?.color || 'gray']?.bg,
                      topicColorClasses[CHOCOLATE_SHOP_TOPICS.find(t => t.name === q.topic)?.color || 'gray']?.text
                    )}
                  >
                    {q.topic}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Staff Distribution */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              פילוח לפי צוות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Managers Section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">מנהלות</span>
                  <div className="flex-1 h-px bg-emerald-200" />
                </div>
                <div className="space-y-2">
                  {managerStats.map((manager, index) => {
                    const percentage = Math.round((manager.count / rawConversations.length) * 100)
                    const role = getManagerRole(manager.name)
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-emerald-700">
                              {manager.shortName}
                            </span>
                            {role && (
                              <span className="text-[10px] text-emerald-500">
                                ({role})
                              </span>
                            )}
                          </div>
                          <span className="text-gray-500">
                            {manager.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Employees Section */}
              {employeeStats.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">עובדים</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div className="space-y-2">
                    {employeeStats.slice(0, 4).map((employee, index) => {
                      const percentage = Math.round((employee.count / rawConversations.length) * 100)
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-600">
                              {employee.shortName}
                            </span>
                            <span className="text-gray-400">
                              {employee.count} ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gray-400 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חיפוש בשיחות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 bg-white"
          />
        </div>

        {/* Type Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter(null)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors",
              typeFilter === null
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            הכל ({conversations.length})
          </button>
          {(Object.entries(CONVERSATION_TYPE_LABELS) as [ConversationType, typeof CONVERSATION_TYPE_LABELS.question][]).map(([type, config]) => {
            const isActive = typeFilter === type
            const count = typeCounts[type]
            const colors = topicColorClasses[config.color] || topicColorClasses.gray
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(isActive ? null : type)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5",
                  isActive
                    ? `${colors.bg} ${colors.text} border ${colors.border}`
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                {config.label}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Topic Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {topicCounts.slice(0, 6).map(topic => {
            const colors = topicColorClasses[topic.color] || topicColorClasses.gray
            const isActive = topicFilter === topic.id
            return (
              <button
                key={topic.id}
                onClick={() => setTopicFilter(isActive ? null : topic.id)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5",
                  isActive
                    ? `${colors.bg} ${colors.text} border ${colors.border}`
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
              >
                <TopicIcon name={topic.icon as TopicIconName} className="w-3.5 h-3.5" />
                {topic.name}
                <span className="text-xs opacity-70">({topic.count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conversation List */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">
            רשימת שיחות
          </CardTitle>
          <span className="text-sm text-gray-500">
            {filteredConversations.length} שיחות
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium">לא נמצאו שיחות</p>
                <p className="text-sm text-gray-400">נסה לשנות את מסנני החיפוש</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isExpanded = expandedConversations.has(conv.id)
                const topic = CHOCOLATE_SHOP_TOPICS.find(t => t.name === conv.topic)
                const colors = topicColorClasses[topic?.color || 'gray'] || topicColorClasses.gray

                return (
                  <div key={conv.id} className="bg-white">
                    {/* Header Row */}
                    <button
                      onClick={() => toggleExpanded(conv.id)}
                      className="w-full p-4 text-right hover:bg-gray-50 transition-colors flex items-center gap-4"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium shrink-0">
                        {getShortName(conv.questionSender).charAt(0)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {getShortName(conv.questionSender)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {conv.date}
                          </span>
                          {/* Type Badge */}
                          {conv.type && CONVERSATION_TYPE_LABELS[conv.type as ConversationType] && (
                            <Badge
                              className={cn(
                                "text-[10px] px-1.5",
                                topicColorClasses[CONVERSATION_TYPE_LABELS[conv.type as ConversationType].color]?.bg,
                                topicColorClasses[CONVERSATION_TYPE_LABELS[conv.type as ConversationType].color]?.text
                              )}
                            >
                              {CONVERSATION_TYPE_LABELS[conv.type as ConversationType].label}
                            </Badge>
                          )}
                          {/* Topic Badge */}
                          <Badge
                            className={cn(
                              "text-[10px] px-1.5",
                              colors.bg,
                              colors.text
                            )}
                          >
                            {conv.topic}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conv.question}
                        </p>
                      </div>

                      {/* Expand Icon */}
                      <div className="shrink-0 text-gray-400">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 bg-gray-50 border-t border-gray-100">
                        <div className="mr-14 space-y-3">
                          {/* Question */}
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-xs font-medium text-gray-500">
                                {conv.questionSender}
                              </span>
                              <span className="text-xs text-gray-400">
                                {conv.time}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800">
                              {conv.question}
                            </p>
                          </div>

                          {/* Answer */}
                          <div className={cn(
                            "rounded-lg p-3 mr-4",
                            isManager(conv.answerSender) ? "bg-emerald-50 border border-emerald-200" : "bg-[#DCF8C6]"
                          )}>
                            <div className="flex items-center gap-2 mb-2">
                              <User className={cn(
                                "w-4 h-4",
                                isManager(conv.answerSender) ? "text-emerald-600" : "text-green-600"
                              )} />
                              <span className={cn(
                                "text-xs font-medium",
                                isManager(conv.answerSender) ? "text-emerald-700" : "text-green-700"
                              )}>
                                {conv.answerSender}
                              </span>
                              {isManager(conv.answerSender) ? (
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300">
                                  מנהלת
                                </Badge>
                              ) : (
                                <Badge className="text-[10px] bg-gray-100 text-gray-600">
                                  עובד/ת
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-800">
                              {conv.isMedia ? (
                                <span className="italic text-gray-500">[מדיה]</span>
                              ) : (
                                conv.answer
                              )}
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
        </CardContent>
      </Card>
    </div>
  )
}
