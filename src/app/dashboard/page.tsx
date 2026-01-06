"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { safeFetch } from "@/lib/safeFetch"
import {
  MessageSquare,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  ExternalLink,
  BarChart3,
} from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface Stats {
  totalConversations: number
  totalMessages: number
  totalKnowledgeItems: number
  totalUsers: number
  recentConversations: Array<{
    id: string
    user: { name: string }
    messages: Array<{ content: string; createdAt: string }>
    updatedAt: string
  }>
}

const DEFAULT_STATS: Stats = {
  totalConversations: 0,
  totalMessages: 0,
  totalKnowledgeItems: 0,
  totalUsers: 0,
  recentConversations: [],
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS)
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        // First try to get existing seed data
        let seedData = await safeFetch<{ seeded: boolean; companyId: string }>("/api/seed")

        // If not seeded, create seed data
        if (!seedData?.seeded) {
          await safeFetch("/api/seed", { method: "POST" })
          seedData = await safeFetch<{ seeded: boolean; companyId: string }>("/api/seed")
        }

        if (seedData?.companyId) {
          setCompanyId(seedData.companyId)
        } else {
          // Use demo company ID as fallback
          setCompanyId("demo-company-001")
        }
      } catch (e) {
        console.error("Error loading stats:", e)
        setError("Failed to initialize")
        // Still use demo ID
        setCompanyId("demo-company-001")
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  useEffect(() => {
    if (!companyId) return

    async function loadDashboardData() {
      try {
        const [conversationsData, knowledgeData, usersData] = await Promise.all([
          safeFetch<{ total: number; conversations: any[] }>(`/api/conversations?companyId=${companyId}&limit=5`),
          safeFetch<{ knowledgeItems: any[] }>(`/api/knowledge?companyId=${companyId}`),
          safeFetch<{ users: any[] }>(`/api/users?companyId=${companyId}`),
        ])

        setStats({
          totalConversations: conversationsData?.total || 0,
          totalMessages: 0,
          totalKnowledgeItems: knowledgeData?.knowledgeItems?.length || 0,
          totalUsers: usersData?.users?.length || 0,
          recentConversations: conversationsData?.conversations || [],
        })
      } catch (e) {
        console.error("Error loading dashboard data:", e)
        // Keep default stats on error
      }
    }

    loadDashboardData()
  }, [companyId])

  const statsCards = [
    {
      title: "שיחות",
      value: stats?.totalConversations || 0,
      icon: MessageSquare,
      change: 12,
      href: "/dashboard/conversations",
    },
    {
      title: "פריטי ידע",
      value: stats?.totalKnowledgeItems || 0,
      icon: BookOpen,
      change: 5,
      href: "/dashboard/knowledge",
    },
    {
      title: "משתמשים",
      value: stats?.totalUsers || 0,
      icon: Users,
      change: 3,
      href: "/dashboard/users",
    },
    {
      title: "שיעור הצלחה",
      value: 94,
      icon: BarChart3,
      change: 2,
      isPercentage: true,
      href: "/dashboard/analytics",
    },
  ]

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">סקירה כללית</h1>
        {companyId && (
          <Link href={`/chat/${companyId}`} target="_blank">
            <Button className="gap-2 bg-gray-900 hover:bg-gray-800">
              פתח צ'אט עובדים
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards - Clean ElevenLabs style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <Link key={i} href={stat.href}>
            <Card className="border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm text-gray-500">{stat.title}</span>
                  <stat.icon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-gray-900">
                    {stat.value.toLocaleString()}
                    {stat.isPercentage && "%"}
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
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Conversations */}
        <Card className="lg:col-span-2 border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              שיחות אחרונות
            </CardTitle>
            <Link href="/dashboard/conversations">
              <Button variant="ghost" size="sm" className="gap-1 text-gray-500 hover:text-gray-900">
                צפה בהכל
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recentConversations && stats.recentConversations.length > 0 ? (
              <div className="space-y-2">
                {stats.recentConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm shrink-0">
                      {conv.user?.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-gray-900 text-sm">{conv.user?.name || "Unknown"}</span>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(conv.updatedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.messages?.[0]?.content || "אין הודעות"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">אין שיחות עדיין</p>
                <p className="text-sm text-gray-400 mt-1">שיחות חדשות יופיעו כאן</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">פעולות מהירות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/knowledge">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">הוסף ידע חדש</p>
                  <p className="text-xs text-gray-500">נהלים, מדיניות או הנחיות</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>

            <Link href="/dashboard/conversations">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">צפה בשיחות</p>
                  <p className="text-xs text-gray-500">סקור ותקן תשובות</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>

            <Link href="/dashboard/analytics">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">אנליטיקה</p>
                  <p className="text-xs text-gray-500">נתוני שימוש ומגמות</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            ביצועי מערכת
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">דיוק תשובות</span>
                <span className="font-medium text-gray-900">94%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "94%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">זמן תגובה ממוצע</span>
                <span className="font-medium text-gray-900">1.2 שניות</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "88%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">שביעות רצון עובדים</span>
                <span className="font-medium text-gray-900">92%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: "92%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
