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
  FolderOpen,
  HelpCircle,
  ArrowUpRight,
} from "lucide-react"

interface AnalyticsData {
  overview: {
    totalQueries: number
    weeklyQueries: number
    monthlyQueries: number
    autoAnswerRate: number
    escalationCount: number
    resolutionRate: number
    avgResponseTime: string
  }
  topQuestions: Array<{ rank: number; question: string; count: number }>
  dailyUsage: Array<{ day: string; count: number }>
  categoryDistribution: Array<{ name: string; icon: string; count: number }>
  topicStats: Array<{ topic: string; count: number; percentage: number }>
  recentEscalations: Array<{
    id: string
    query: string
    status: string
    createdAt: string
    resolvedAt: string | null
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const result = await safeFetch<AnalyticsData>("/api/analytics")
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
      label: "שאלות החודש",
      value: data.overview.monthlyQueries.toLocaleString(),
      subtitle: `${data.overview.weeklyQueries} השבוע`,
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: "מענה אוטומטי",
      value: `${data.overview.autoAnswerRate}%`,
      subtitle: "ללא הסלמה למנהל",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      label: "הסלמות",
      value: data.overview.escalationCount.toLocaleString(),
      subtitle: `${data.overview.resolutionRate}% נפתרו`,
      icon: AlertCircle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      label: "זמן תגובה",
      value: data.overview.avgResponseTime,
      subtitle: "ממוצע",
      icon: Clock,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
  ]

  const maxDailyCount = Math.max(...data.dailyUsage.map(d => d.count), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">אנליטיקה</h1>
        </div>
        <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option>30 ימים אחרונים</option>
          <option>7 ימים אחרונים</option>
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
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-semibold text-gray-900">{stat.value}</span>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xs text-gray-400">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart */}
        <Card className="lg:col-span-2 border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              שימוש יומי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-3 pt-4">
              {data.dailyUsage.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">{day.count}</span>
                  <div
                    className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-md transition-all hover:from-green-600 hover:to-green-500 cursor-pointer"
                    style={{
                      height: `${(day.count / maxDailyCount) * 180}px`,
                      minHeight: "20px",
                    }}
                  />
                  <span className="text-xs text-gray-500">{day.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Success Rate Donut */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-gray-400" />
              שיעור מענה אוטומטי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-6">
              <div className="relative w-36 h-36">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#e5e7eb"
                    strokeWidth="14"
                    fill="none"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#22c55e"
                    strokeWidth="14"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(data.overview.autoAnswerRate / 100) * 377} 377`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">
                    {data.overview.autoAnswerRate}%
                  </span>
                  <span className="text-xs text-gray-500">הצלחה</span>
                </div>
              </div>
              <div className="flex gap-6 mt-6">
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600">{data.overview.monthlyQueries - data.overview.escalationCount}</p>
                  <p className="text-xs text-gray-500">נענו אוטומטית</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-yellow-600">{data.overview.escalationCount}</p>
                  <p className="text-xs text-gray-500">הועברו למנהל</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Questions & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Questions */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              שאלות נפוצות במאגר הידע
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topQuestions.slice(0, 7).map((q) => (
                <div
                  key={q.rank}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                      {q.rank}
                    </span>
                    <span className="text-sm text-gray-700 truncate">{q.question}</span>
                  </div>
                  <Badge variant="outline" className="bg-white shrink-0 mr-2">
                    {q.count} צפיות
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-gray-400" />
              התפלגות לפי קטגוריה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.categoryDistribution.slice(0, 8).map((cat, i) => {
                const maxCount = Math.max(...data.categoryDistribution.map(c => c.count), 1)
                const percentage = Math.round((cat.count / maxCount) * 100)
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-sm text-gray-700">{cat.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{cat.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Escalations */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
            הסלמות אחרונות
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentEscalations.length > 0 ? (
            <div className="space-y-3">
              {data.recentEscalations.map((escalation) => (
                <div
                  key={escalation.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{escalation.query}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(escalation.createdAt).toLocaleDateString('he-IL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge
                    className={
                      escalation.status === 'resolved'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : escalation.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                    }
                  >
                    {escalation.status === 'resolved' ? 'נפתר' :
                     escalation.status === 'in_progress' ? 'בטיפול' : 'ממתין'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
              <p className="text-gray-500">אין הסלמות אחרונות</p>
              <p className="text-sm text-gray-400 mt-1">כל השאלות נענו אוטומטית</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
