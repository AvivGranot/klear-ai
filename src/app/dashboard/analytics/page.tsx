"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { safeFetch } from "@/lib/safeFetch"
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  BookOpen,
  Zap,
  HelpCircle,
} from "lucide-react"

interface GasStationStats {
  company: { id: string; name: string }
  todayStats: {
    totalQueries: number
    trend: number
    autoAnswerRate: number
    pendingEscalations: number
    avgResponseTime: string
  }
  topicStats: Array<{
    id: string
    name: string
    icon: string
    color: string
    todayCount: number
  }>
  topicPerformance: Array<{
    id: string
    name: string
    icon: string
    color: string
    queryCount: number
    autoAnswerRate: number
    kbItems: number
    kbCoverage: number
  }>
  peakHours: Array<{ hour: number; count: number }>
  managerWorkload: Array<{
    id: string
    name: string
    handled: number
    pending: number
  }>
  urgentEscalations: Array<{
    id: string
    query: string
    topic: string
    topicIcon: string
    waitingMinutes: number
    isUrgent: boolean
  }>
  topFaqs: Array<{
    id: string
    rank: number
    question: string
    answer: string
    viewCount: number
    category: string
    categoryIcon: string
    topic?: string
    topicIcon?: string
    topicColor?: string
  }>
  kbSummary: {
    totalItems: number
    faqs: number
    documents: number
    procedures: number
    categories: number
  }
}

const colorClasses: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', bar: 'bg-blue-500' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', bar: 'bg-green-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', bar: 'bg-orange-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', bar: 'bg-purple-500' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', bar: 'bg-red-500' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', bar: 'bg-teal-500' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', bar: 'bg-yellow-500' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', bar: 'bg-pink-500' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', bar: 'bg-gray-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', bar: 'bg-indigo-500' },
}

export default function AnalyticsPage() {
  const [data, setData] = useState<GasStationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const result = await safeFetch<GasStationStats>("/api/gas-station-stats")
        if (result) {
          setData(result)
        }
      } catch (e) {
        console.error("Error loading analytics:", e)
        setError("Failed to load analytics data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600">{error || "Failed to load data"}</p>
      </div>
    )
  }

  const statsCards = [
    {
      label: "שאלות היום",
      value: data.todayStats.totalQueries.toString(),
      trend: data.todayStats.trend,
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: "מענה אוטומטי",
      value: `${data.todayStats.autoAnswerRate}%`,
      icon: Zap,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      label: "הסלמות ממתינות",
      value: data.todayStats.pendingEscalations.toString(),
      icon: AlertCircle,
      color: data.todayStats.pendingEscalations > 0 ? "text-red-500" : "text-green-500",
      bgColor: data.todayStats.pendingEscalations > 0 ? "bg-red-50" : "bg-green-50",
    },
    {
      label: "זמן תגובה",
      value: data.todayStats.avgResponseTime,
      icon: Clock,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
  ]

  // Calculate peak hours data
  const maxHourCount = Math.max(...data.peakHours.map(h => h.count), 1)

  // Sort topics by query count for chart
  const sortedTopics = [...data.topicPerformance].sort((a, b) => b.queryCount - a.queryCount)
  const maxQueryCount = Math.max(...sortedTopics.map(t => t.queryCount), 1)

  // Find knowledge gaps (low auto-answer rate or low KB coverage)
  const knowledgeGaps = data.topicPerformance
    .filter(t => t.queryCount > 0 && (t.autoAnswerRate < 70 || t.kbCoverage < 50))
    .sort((a, b) => a.autoAnswerRate - b.autoAnswerRate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">אנליטיקה</h1>
          <Badge variant="outline" className="text-gray-500">
            {data.company.name}
          </Badge>
        </div>
        <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option>7 ימים אחרונים</option>
          <option>30 ימים אחרונים</option>
          <option>היום</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <Card key={i} className="border border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                {stat.trend !== undefined && (
                  <div className={`flex items-center gap-1 text-sm ${stat.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{Math.abs(stat.trend)}%</span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-semibold text-gray-900">{stat.value}</span>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Distribution */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              התפלגות שאלות לפי נושא
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedTopics.slice(0, 8).map((topic) => {
                const colors = colorClasses[topic.color] || colorClasses.gray
                const widthPercent = (topic.queryCount / maxQueryCount) * 100
                return (
                  <div key={topic.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{topic.icon}</span>
                        <span className="text-gray-700">{topic.name}</span>
                      </div>
                      <span className="font-medium text-gray-900">{topic.queryCount}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.bar} rounded-full transition-all`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours Heatmap */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              שעות פעילות שיא
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-1">
              {data.peakHours.slice(6, 22).map((hour) => {
                const intensity = hour.count / maxHourCount
                let bgClass = 'bg-gray-100'
                if (intensity > 0.8) bgClass = 'bg-green-500'
                else if (intensity > 0.6) bgClass = 'bg-green-400'
                else if (intensity > 0.4) bgClass = 'bg-green-300'
                else if (intensity > 0.2) bgClass = 'bg-green-200'
                else if (intensity > 0) bgClass = 'bg-green-100'

                return (
                  <div key={hour.hour} className="text-center">
                    <div
                      className={`h-16 ${bgClass} rounded-md flex items-center justify-center transition-colors cursor-pointer hover:opacity-80`}
                      title={`${hour.hour}:00 - ${hour.count} שאלות`}
                    >
                      <span className="text-xs font-medium text-gray-700">{hour.count}</span>
                    </div>
                    <span className="text-xs text-gray-400 mt-1">{hour.hour}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 rounded" />
                <span>נמוך</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-300 rounded" />
                <span>בינוני</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>גבוה</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manager Workload & Knowledge Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manager Workload */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              עומס מנהלים השבוע
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.managerWorkload.length > 0 ? (
              <div className="space-y-4">
                {data.managerWorkload.map((manager) => {
                  const total = manager.handled + manager.pending
                  const handledPercent = total > 0 ? (manager.handled / total) * 100 : 100
                  return (
                    <div key={manager.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm font-semibold text-gray-600">
                            {manager.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{manager.name}</p>
                            <p className="text-xs text-gray-500">סה"כ {total} פניות</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-semibold text-green-600">{manager.handled}</p>
                          <p className="text-xs text-gray-400">טופלו</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="h-2 bg-green-500 rounded-full transition-all"
                          style={{ width: `${handledPercent}%` }}
                        />
                        {manager.pending > 0 && (
                          <div
                            className="h-2 bg-yellow-400 rounded-full transition-all"
                            style={{ width: `${100 - handledPercent}%` }}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>אין נתוני מנהלים</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Knowledge Gaps */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              פערי ידע - נדרש שיפור
            </CardTitle>
          </CardHeader>
          <CardContent>
            {knowledgeGaps.length > 0 ? (
              <div className="space-y-3">
                {knowledgeGaps.slice(0, 5).map((topic) => {
                  const colors = colorClasses[topic.color] || colorClasses.gray
                  return (
                    <div
                      key={topic.id}
                      className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{topic.icon}</span>
                          <span className="font-medium text-gray-900">{topic.name}</span>
                        </div>
                        <Badge
                          className={topic.autoAnswerRate < 50 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                        >
                          {topic.autoAnswerRate}% מענה
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">שאלות</p>
                          <p className="font-medium text-gray-900">{topic.queryCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">פריטי ידע</p>
                          <p className="font-medium text-gray-900">{topic.kbItems}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>כיסוי מאגר הידע</span>
                          <span>{topic.kbCoverage}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${topic.kbCoverage < 50 ? 'bg-red-400' : 'bg-yellow-400'}`}
                            style={{ width: `${topic.kbCoverage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <p className="text-gray-600 font-medium">מאגר הידע מכסה היטב</p>
                <p className="text-sm text-gray-400 mt-1">כל הנושאים עם מענה אוטומטי גבוה</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top FAQs from WhatsApp */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-gray-400" />
            שאלות נפוצות מהוואטסאפ
            <Badge variant="outline" className="text-gray-500">
              {data.kbSummary?.faqs || 0} שאלות יובאו
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.topFaqs && data.topFaqs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.topFaqs.slice(0, 10).map((faq) => {
                const colors = faq.topicColor ? colorClasses[faq.topicColor] : colorClasses.gray
                return (
                  <div
                    key={faq.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                        {faq.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 font-medium line-clamp-2">{faq.question}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {faq.topicIcon && (
                            <Badge variant="outline" className={`text-xs ${colors?.bg} ${colors?.text}`}>
                              {faq.topicIcon} {faq.topic}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-400">{faq.categoryIcon} {faq.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>אין שאלות נפוצות</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topic Performance Table */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            ביצועים לפי נושא
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">נושא</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">שאלות</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">מענה אוטומטי</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">פריטי ידע</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">כיסוי</th>
                </tr>
              </thead>
              <tbody>
                {data.topicPerformance.map((topic) => {
                  const colors = colorClasses[topic.color] || colorClasses.gray
                  return (
                    <tr key={topic.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{topic.icon}</span>
                          <span className="text-sm font-medium text-gray-900">{topic.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-gray-700">{topic.queryCount}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={
                            topic.autoAnswerRate >= 80
                              ? 'bg-green-100 text-green-700'
                              : topic.autoAnswerRate >= 60
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }
                        >
                          {topic.autoAnswerRate}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-gray-700">{topic.kbItems}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors.bar} rounded-full`}
                              style={{ width: `${topic.kbCoverage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{topic.kbCoverage}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
