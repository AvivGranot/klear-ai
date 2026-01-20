"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  Zap,
  BookOpen,
  HelpCircle,
  FolderOpen,
  Database,
} from "lucide-react"
import {
  company,
  getProcessedFaqs,
  getTopicStats,
  getKBSummary,
  GAS_STATION_TOPICS,
} from "@/data/gas-station-data"

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
  // Load static data - no API calls needed
  const topFaqs = getProcessedFaqs()
  const topicStats = getTopicStats()
  const kbSummary = getKBSummary()

  const kpiCards = [
    {
      label: "פריטי ידע",
      value: kbSummary.totalItems,
      icon: Database,
      color: "blue",
    },
    {
      label: "תבניות אוטומציה",
      value: kbSummary.automationPatterns,
      icon: Zap,
      color: "green",
    },
    {
      label: "מסמכים",
      value: kbSummary.documents,
      icon: FolderOpen,
      color: "purple",
    },
    {
      label: "קטגוריות",
      value: kbSummary.categories,
      icon: HelpCircle,
      color: "teal",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">שלום, מנהל</h1>
          <p className="text-sm text-gray-500 mt-1">{company.name}</p>
        </div>
        <Link href={`/chat/${company.id}`} target="_blank">
          <Button className="gap-2 bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]">
            פתח צ׳אט עובדים
            <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const colors = colorClasses[kpi.color] || colorClasses.gray
          return (
            <Card key={i} className="border border-gray-200 transition-all hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                    <kpi.icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-3xl font-semibold text-gray-900">{kpi.value}</span>
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Distribution */}
        <Card className="lg:col-span-2 border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-medium">התפלגות לפי נושא</CardTitle>
            <Link href="/dashboard/analytics">
              <Button variant="ghost" size="sm" className="gap-1 text-gray-500 hover:text-gray-900">
                צפה בהכל
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {topicStats.slice(0, 10).map((topic) => {
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
                      <span className={`text-lg font-semibold ${colors.text}`}>{topic.count}</span>
                      <span className="text-xs text-gray-400">שאלות</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              סטטוס המערכת
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p className="text-gray-600 font-medium">המערכת פעילה</p>
              <p className="text-sm text-gray-400 mt-1">מאגר הידע מוכן לשימוש</p>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  {kbSummary.totalItems} פריטי ידע זמינים
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top FAQs from WhatsApp & KB Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top FAQs from WhatsApp Import */}
        <Card className="lg:col-span-2 border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              שאלות נפוצות מהוואטסאפ
              <Badge variant="outline" className="text-xs text-gray-500">
                {topFaqs.length} שאלות
              </Badge>
            </CardTitle>
            <Link href="/dashboard/knowledge">
              <Button variant="ghost" size="sm" className="gap-1 text-gray-500 hover:text-gray-900">
                צפה בהכל
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topFaqs.slice(0, 8).map((faq) => {
                const colors = faq.topicColor ? colorClasses[faq.topicColor] : colorClasses.gray
                return (
                  <div
                    key={faq.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 shrink-0 mt-0.5">
                      {faq.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 line-clamp-2">{faq.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {faq.topicIcon && (
                          <Badge variant="outline" className={`text-xs ${colors?.bg} ${colors?.text}`}>
                            {faq.topicIcon} {faq.topic}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Base Summary */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-gray-400" />
              מאגר הידע
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-[rgba(37,211,102,0.1)] rounded-lg">
              <p className="text-3xl font-bold text-[var(--klear-green)]">{kbSummary.totalItems}</p>
              <p className="text-sm text-gray-600">פריטי ידע</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-semibold text-gray-900">{kbSummary.automationPatterns}</p>
                <p className="text-xs text-gray-500">תבניות אוטומציה</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-semibold text-gray-900">{kbSummary.documents}</p>
                <p className="text-xs text-gray-500">מסמכים</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg col-span-2">
                <p className="text-xl font-semibold text-gray-900">{kbSummary.categories}</p>
                <p className="text-xs text-gray-500">קטגוריות</p>
              </div>
            </div>
            <Link href="/dashboard/knowledge">
              <Button variant="outline" className="w-full">
                נהל מאגר ידע
                <ChevronRight className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/knowledge">
          <Card className="border border-gray-200 hover:border-[var(--klear-green)] hover:bg-[rgba(37,211,102,0.05)] transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[rgba(37,211,102,0.1)] flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[var(--klear-green)]" />
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
          <Card className="border border-gray-200 hover:border-[var(--klear-green)] hover:bg-[rgba(37,211,102,0.05)] transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[rgba(37,211,102,0.1)] flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-[var(--klear-green)]" />
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
          <Card className="border border-gray-200 hover:border-[var(--klear-green)] hover:bg-[rgba(37,211,102,0.05)] transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[rgba(37,211,102,0.1)] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[var(--klear-green)]" />
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
