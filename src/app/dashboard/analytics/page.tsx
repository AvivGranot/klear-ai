"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Users,
} from "lucide-react"

interface AnalyticsData {
  totalCalls: number
  avgDuration: string
  successRate: number
  avgResponseTime: string
  topQuestions: { question: string; count: number }[]
  dailyUsage: { date: string; calls: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const seedRes = await fetch("/api/seed")
        const seedData = await seedRes.json()
        if (seedData.seeded) {
          setCompanyId(seedData.companyId)
        }
      } catch (e) {
        console.error(e)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!companyId) return

    async function loadData() {
      try {
        // Simulate analytics data
        setData({
          totalCalls: 1247,
          avgDuration: "2.3 דקות",
          successRate: 94,
          avgResponseTime: "1.2 שניות",
          topQuestions: [
            { question: "איך מכבים משאבת דלק בחירום?", count: 45 },
            { question: "מה לעשות במקרה של דליפת דלק?", count: 38 },
            { question: "מהן שעות הפעילות?", count: 32 },
            { question: "איך מבצעים תדלוק?", count: 28 },
            { question: "מהי מדיניות ההחזרות?", count: 24 },
          ],
          dailyUsage: [
            { date: "ראשון", calls: 156 },
            { date: "שני", calls: 203 },
            { date: "שלישי", calls: 178 },
            { date: "רביעי", calls: 245 },
            { date: "חמישי", calls: 198 },
            { date: "שישי", calls: 167 },
            { date: "שבת", calls: 100 },
          ],
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [companyId])

  const statsCards = [
    {
      label: "סה״כ שיחות",
      value: data?.totalCalls.toLocaleString() || "0",
      change: 12,
      icon: MessageSquare,
    },
    {
      label: "משך ממוצע",
      value: data?.avgDuration || "0",
      change: -5,
      icon: Clock,
    },
    {
      label: "שיעור הצלחה",
      value: `${data?.successRate || 0}%`,
      change: 2,
      icon: CheckCircle,
    },
    {
      label: "זמן תגובה ממוצע",
      value: data?.avgResponseTime || "0",
      change: -8,
      icon: TrendingUp,
    },
  ]

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">אנליטיקה</h1>
          <Badge className="bg-gray-900 text-white">Beta</Badge>
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
                <span className="text-sm text-gray-500">{stat.label}</span>
                <stat.icon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-gray-900">
                  {stat.value}
                </span>
                <span
                  className={`text-sm flex items-center gap-0.5 ${
                    stat.change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(stat.change)}%
                </span>
              </div>
              <span className="text-xs text-gray-400">מהשבוע שעבר</span>
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
            <div className="h-64 flex items-end justify-between gap-2">
              {data?.dailyUsage.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-green-500 rounded-t-sm transition-all hover:bg-green-600"
                    style={{
                      height: `${(day.calls / 250) * 100}%`,
                      minHeight: "20px",
                    }}
                  />
                  <span className="text-xs text-gray-500">{day.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-gray-400" />
              שיעור הצלחה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-6">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#22c55e"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(data?.successRate || 0) * 3.52} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">
                    {data?.successRate}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">תשובות מוצלחות</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Questions */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            שאלות נפוצות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.topQuestions.map((q, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700">{q.question}</span>
                </div>
                <Badge variant="outline" className="bg-white">
                  {q.count} פעמים
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
