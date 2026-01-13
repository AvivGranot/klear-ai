"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { safeFetch } from "@/lib/safeFetch"
import {
  MessageSquare,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  ChevronRight,
  ExternalLink,
  BarChart3,
  AlertCircle,
  CheckCircle,
  FolderOpen,
  Image,
} from "lucide-react"

interface DashboardStats {
  company: {
    id: string
    name: string
    industry: string
  }
  knowledgeBase: {
    totalItems: number
    categories: number
    mediaFiles: number
    byType: Array<{ type: string; count: number }>
    byCategory: Array<{ id: string; name: string; nameHe: string; icon: string; itemCount: number }>
  }
  users: {
    total: number
    employees: number
    managers: number
  }
  conversations: {
    total: number
    weeklyQueries: number
    monthlyQueries: number
    autoAnswerRate: number
  }
  escalations: {
    total: number
    pending: number
    resolved: number
    resolutionRate: number
  }
  recentQueries: Array<{
    id: string
    query: string
    hasResponse: boolean
    wasHelpful: boolean | null
    createdAt: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await safeFetch<DashboardStats>("/api/stats")
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

  const statsCards = [
    {
      title: "פריטי ידע",
      value: stats.knowledgeBase.totalItems,
      icon: BookOpen,
      subtitle: `${stats.knowledgeBase.categories} קטגוריות`,
      href: "/dashboard/knowledge",
      color: "text-blue-500",
    },
    {
      title: "שאלות החודש",
      value: stats.conversations.monthlyQueries,
      icon: MessageSquare,
      subtitle: `${stats.conversations.weeklyQueries} השבוע`,
      href: "/dashboard/conversations",
      color: "text-green-500",
    },
    {
      title: "שיעור מענה אוטומטי",
      value: stats.conversations.autoAnswerRate,
      icon: BarChart3,
      isPercentage: true,
      subtitle: `${stats.escalations.pending} ממתינות למנהל`,
      href: "/dashboard/analytics",
      color: "text-purple-500",
    },
    {
      title: "משתמשים",
      value: stats.users.employees + stats.users.managers,
      icon: Users,
      subtitle: `${stats.users.employees} עובדים, ${stats.users.managers} מנהלים`,
      href: "/dashboard/users",
      color: "text-orange-500",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">סקירה כללית</h1>
          <p className="text-sm text-gray-500 mt-1">{stats.company.name}</p>
        </div>
        <Link href={`/chat/${stats.company.id}`} target="_blank">
          <Button className="gap-2 bg-gray-900 hover:bg-gray-800">
            פתח צ'אט עובדים
            <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <Link key={i} href={stat.href}>
            <Card className="border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm text-gray-500">{stat.title}</span>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-gray-900">
                    {stat.value.toLocaleString()}
                    {stat.isPercentage && "%"}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{stat.subtitle}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Overview */}
        <Card className="lg:col-span-2 border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-gray-400" />
              קטגוריות במאגר הידע
            </CardTitle>
            <Link href="/dashboard/knowledge">
              <Button variant="ghost" size="sm" className="gap-1 text-gray-500 hover:text-gray-900">
                צפה בהכל
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.knowledgeBase.byCategory.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stats.knowledgeBase.byCategory.slice(0, 9).map((category) => (
                  <Link key={category.id} href={`/dashboard/knowledge?category=${category.id}`}>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <span className="text-2xl">{category.icon || "📁"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {category.nameHe || category.name}
                        </p>
                        <p className="text-xs text-gray-500">{category.itemCount} פריטים</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">אין קטגוריות עדיין</p>
                <p className="text-sm text-gray-400 mt-1">הוסף קטגוריות לארגון הידע</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Escalations Status */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              הסלמות למנהל
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">ממתינות</p>
                  <p className="text-xs text-gray-500">דורשות תשובה</p>
                </div>
              </div>
              <span className="text-2xl font-semibold text-yellow-600">{stats.escalations.pending}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">נפתרו</p>
                  <p className="text-xs text-gray-500">סה"כ</p>
                </div>
              </div>
              <span className="text-2xl font-semibold text-green-600">{stats.escalations.resolved}</span>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">שיעור פתרון</span>
                <span className="font-medium text-gray-900">{stats.escalations.resolutionRate}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${stats.escalations.resolutionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Knowledge Base Summary */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-400" />
            סיכום מאגר הידע
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-semibold text-gray-900">{stats.knowledgeBase.totalItems}</p>
              <p className="text-sm text-gray-500">פריטי ידע</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-semibold text-gray-900">{stats.knowledgeBase.categories}</p>
              <p className="text-sm text-gray-500">קטגוריות</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Image className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-semibold text-gray-900">{stats.knowledgeBase.mediaFiles}</p>
              <p className="text-sm text-gray-500">קבצי מדיה</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-semibold text-gray-900">
                {stats.knowledgeBase.byType.find(t => t.type === 'faq')?.count || 0}
              </p>
              <p className="text-sm text-gray-500">שאלות נפוצות</p>
            </div>
          </div>

          {/* Knowledge by type breakdown */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">לפי סוג תוכן:</p>
            <div className="flex flex-wrap gap-2">
              {stats.knowledgeBase.byType.map((item) => (
                <span
                  key={item.type}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                >
                  {getTypeLabel(item.type)}: {item.count}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/knowledge">
          <Card className="border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">הוסף ידע חדש</p>
                <p className="text-sm text-gray-500">נהלים, מדיניות או הנחיות</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 mr-auto" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/conversations">
          <Card className="border border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">צפה בשיחות</p>
                <p className="text-sm text-gray-500">סקור ותקן תשובות</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 mr-auto" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/analytics">
          <Card className="border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">אנליטיקה</p>
                <p className="text-sm text-gray-500">נתוני שימוש ומגמות</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 mr-auto" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    faq: "שאלות נפוצות",
    document: "מסמכים",
    procedure: "נהלים",
    policy: "מדיניות",
  }
  return labels[type] || type
}
