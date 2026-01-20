"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  CheckCircle,
  BarChart3,
  FolderOpen,
  Database,
  Zap,
  FileText,
} from "lucide-react"
import {
  company,
  getProcessedConversations,
  getTopicStats,
  getKBSummary,
  getAnalyticsSummary,
  GAS_STATION_TOPICS,
  conversations,
} from "@/data/gas-station-data"

const colorClasses: Record<string, { bg: string; text: string; border: string; fill: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', fill: 'bg-blue-500' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', fill: 'bg-green-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', fill: 'bg-orange-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', fill: 'bg-purple-500' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', fill: 'bg-red-500' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', fill: 'bg-teal-500' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', fill: 'bg-yellow-500' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', fill: 'bg-pink-500' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', fill: 'bg-gray-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', fill: 'bg-indigo-500' },
}

export default function AnalyticsPage() {
  // Load static data - no API calls needed
  const processedConversations = getProcessedConversations()
  const topicStats = getTopicStats()
  const kbSummary = getKBSummary()
  const analyticsSummary = getAnalyticsSummary()

  // Calculate max for bar chart scaling
  const maxTopicCount = Math.max(...topicStats.map(t => t.count), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">אנליטיקה</h1>
          <p className="text-sm text-gray-500 mt-1">{company.name} - ניתוח שיחות והתנהגות</p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[rgba(37,211,102,0.1)] rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[var(--klear-green)]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{analyticsSummary.totalConversations}</p>
                <p className="text-sm text-gray-500">סה"כ שיחות</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{kbSummary.automationPatterns}</p>
                <p className="text-sm text-gray-500">תבניות אוטומציה</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[rgba(37,211,102,0.1)] rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-[var(--klear-green)]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{kbSummary.documents}</p>
                <p className="text-sm text-gray-500">מסמכים</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[rgba(37,211,102,0.1)] rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-[var(--klear-green)]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{kbSummary.categories}</p>
                <p className="text-sm text-gray-500">קטגוריות</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topic Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              התפלגות שיחות לפי נושא
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topicStats.map((topic) => {
                const colors = colorClasses[topic.color] || colorClasses.gray
                const percentage = Math.round((topic.count / maxTopicCount) * 100)
                return (
                  <div key={topic.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{topic.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{topic.name}</span>
                      </div>
                      <span className={`text-sm font-semibold ${colors.text}`}>{topic.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.fill} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Topic Cards Grid */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">נושאים לפי קטגוריה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {GAS_STATION_TOPICS.map((topic) => {
                const colors = colorClasses[topic.color] || colorClasses.gray
                const topicData = topicStats.find(t => t.id === topic.id)
                return (
                  <div
                    key={topic.id}
                    className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{topic.icon}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                    <p className={`text-xl font-bold mt-1 ${colors.text}`}>
                      {topicData?.count || 0}
                    </p>
                    <p className="text-xs text-gray-500">שיחות</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations List */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            שיחות אחרונות
            <Badge variant="outline" className="text-xs">{processedConversations.length} שיחות</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {processedConversations.slice(0, 15).map((conv, index) => {
              const colors = conv.topicColor ? colorClasses[conv.topicColor] : colorClasses.gray
              return (
                <div
                  key={conv.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {conv.question || '(ללא שאלה)'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      <span className="font-medium">תשובה:</span> {conv.answer}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-xs ${colors?.bg} ${colors?.text}`}>
                        {conv.topicIcon} {conv.topic}
                      </Badge>
                      <span className="text-xs text-gray-400">{conv.date}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Source Info */}
      <Card className="border border-gray-200 bg-[rgba(37,211,102,0.05)]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-[var(--klear-green)]" />
            <div>
              <p className="text-sm font-medium text-gray-900">מקור הנתונים: WhatsApp - צוות אמיר בני ברק</p>
              <p className="text-xs text-gray-500">
                {analyticsSummary.totalConversations} שיחות מנותחות | {kbSummary.automationPatterns} תבניות אוטומציה | {kbSummary.documents} מסמכים
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
