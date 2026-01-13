"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { safeFetch } from "@/lib/safeFetch"
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Zap,
  Users,
  BookOpen,
  Plus,
} from "lucide-react"

interface GasStationStats {
  company: {
    id: string
    name: string
  }
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
    trend: number
  }>
  urgentEscalations: Array<{
    id: string
    query: string
    topic: string
    topicIcon: string
    topicColor: string
    waitingMinutes: number
    isUrgent: boolean
    createdAt: string
  }>
  recentQuestions: Array<{
    query: string
    hasAnswer: boolean
    wasHelpful: boolean | null
    topic: string
    topicIcon: string
    createdAt: string
  }>
  managerWorkload: Array<{
    id: string
    name: string
    handled: number
    pending: number
  }>
}

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<GasStationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await safeFetch<GasStationStats>("/api/gas-station-stats")
        if (data) {
          setStats(data)
        }
      } catch (e) {
        console.error("Error loading stats:", e)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600">{error || "Failed to load data"}</p>
      </div>
    )
  }

  const kpiCards = [
    {
      label: "שאלות היום",
      value: stats.todayStats.totalQueries,
      trend: stats.todayStats.trend,
      icon: MessageSquare,
      color: "blue",
    },
    {
      label: "הסלמות ממתינות",
      value: stats.todayStats.pendingEscalations,
      icon: AlertCircle,
      color: stats.todayStats.pendingEscalations > 0 ? "red" : "green",
      highlight: stats.todayStats.pendingEscalations > 0,
    },
    {
      label: "מענה אוטומטי",
      value: `${stats.todayStats.autoAnswerRate}%`,
      icon: Zap,
      color: stats.todayStats.autoAnswerRate >= 80 ? "green" : "yellow",
      target: "יעד: 85%",
    },
    {
      label: "זמן תגובה",
      value: stats.todayStats.avgResponseTime,
      icon: Clock,
      color: "purple",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">שלום, מנהל</h1>
          <p className="text-sm text-gray-500 mt-1">{stats.company.name}</p>
        </div>
        <Link href={`/chat/${stats.company.id}`} target="_blank">
          <Button className="gap-2 bg-gray-900 hover:bg-gray-800">
            פתח צ'אט עובדים
            <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const colors = colorClasses[kpi.color] || colorClasses.gray
          return (
            <Card
              key={i}
              className={`border ${kpi.highlight ? 'border-red-300 bg-red-50/50' : 'border-gray-200'} transition-all hover:shadow-md`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                    <kpi.icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  {kpi.trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{Math.abs(kpi.trend)}%</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-3xl font-semibold text-gray-900">{kpi.value}</span>
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  {kpi.target && <p className="text-xs text-gray-400">{kpi.target}</p>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Activity Grid */}
        <Card className="lg:col-span-2 border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-medium">פעילות לפי נושא</CardTitle>
            <Link href="/dashboard/analytics">
              <Button variant="ghost" size="sm" className="gap-1 text-gray-500 hover:text-gray-900">
                צפה בהכל
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {stats.topicStats.slice(0, 10).map((topic) => {
                const colors = colorClasses[topic.color] || colorClasses.gray
                return (
                  <div
                    key={topic.id}
                    className={`p-3 rounded-lg border ${colors.border} ${colors.bg} hover:shadow-sm transition-all cursor-pointer`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{topic.icon}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{topic.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-lg font-semibold ${colors.text}`}>{topic.todayCount}</span>
                      <span className="text-xs text-gray-400">היום</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Urgent Escalations */}
        <Card className={`border ${stats.urgentEscalations.length > 0 ? 'border-red-200' : 'border-gray-200'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <AlertCircle className={`w-5 h-5 ${stats.urgentEscalations.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              הסלמות ממתינות
              {stats.urgentEscalations.length > 0 && (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                  {stats.urgentEscalations.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.urgentEscalations.length > 0 ? (
              <div className="space-y-3">
                {stats.urgentEscalations.slice(0, 5).map((escalation) => {
                  const colors = colorClasses[escalation.topicColor] || colorClasses.gray
                  return (
                    <div
                      key={escalation.id}
                      className={`p-3 rounded-lg border ${escalation.isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg shrink-0">{escalation.topicIcon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 line-clamp-2">{escalation.query}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={`${colors.bg} ${colors.text} text-xs`}>
                              {escalation.topic}
                            </Badge>
                            <span className={`text-xs ${escalation.isUrgent ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                              {escalation.waitingMinutes < 60
                                ? `${escalation.waitingMinutes} דק' ממתין`
                                : `${Math.floor(escalation.waitingMinutes / 60)} שעות`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <Link href="/dashboard/conversations?filter=pending">
                  <Button variant="outline" className="w-full mt-2">
                    צפה בכל ההסלמות
                    <ChevronRight className="w-4 h-4 mr-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <p className="text-gray-600 font-medium">אין הסלמות ממתינות</p>
                <p className="text-sm text-gray-400 mt-1">כל השאלות נענו אוטומטית</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Questions & Manager Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Questions Feed */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              שאלות אחרונות
            </CardTitle>
            <Link href="/dashboard/conversations">
              <Button variant="ghost" size="sm" className="gap-1 text-gray-500 hover:text-gray-900">
                צפה בהכל
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentQuestions.length > 0 ? (
              <div className="space-y-2">
                {stats.recentQuestions.slice(0, 6).map((q, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-lg shrink-0">{q.topicIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{q.query}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{q.topic}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {q.hasAnswer ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle className="w-3 h-3 ml-1" />
                          נענה
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                          ממתין
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>אין שאלות היום</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manager Workload */}
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              עומס מנהלים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.managerWorkload.length > 0 ? (
              <div className="space-y-4">
                {stats.managerWorkload.map((manager) => {
                  const total = manager.handled + manager.pending
                  const handledPercent = total > 0 ? (manager.handled / total) * 100 : 100
                  return (
                    <div key={manager.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                            {manager.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{manager.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-green-600">{manager.handled} טופלו</span>
                          {manager.pending > 0 && (
                            <span className="text-yellow-600">{manager.pending} ממתינים</span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${handledPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>אין מנהלים רשומים</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/knowledge">
          <Card className="border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">מאגר הידע</p>
                <p className="text-sm text-gray-500">נהל נהלים ומידע</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/conversations">
          <Card className="border border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">שיחות</p>
                <p className="text-sm text-gray-500">צפה בשאלות עובדים</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/analytics">
          <Card className="border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">אנליטיקה</p>
                <p className="text-sm text-gray-500">נתונים ומגמות</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
