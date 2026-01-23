"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  Zap,
  Clock,
  CheckCircle,
  Target,
  Users,
  Filter,
  Download,
  Calendar,
} from "lucide-react"
import { TopicIcon } from "@/components/TopicIcon"
import type { TopicIconName } from "@/data/jolika-data"
import {
  company,
  getProcessedConversations,
  getTopicStats,
  getKBSummary,
  getAnalyticsSummary,
  CHOCOLATE_SHOP_TOPICS,
} from "@/data/jolika-data"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts"
import { KPICard, KPIGrid } from "@/components/dashboard/KPICard"
import { HeroChart, StackedAreaChart } from "@/components/dashboard/HeroChart"
import { AlertsPanel, generateSampleAlerts } from "@/components/dashboard/AlertsPanel"

const colorClasses: Record<string, { bg: string; text: string; border: string; fill: string; hex: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', fill: 'bg-blue-500', hex: '#3B82F6' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', fill: 'bg-green-500', hex: '#22C55E' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', fill: 'bg-amber-500', hex: '#F59E0B' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', fill: 'bg-orange-500', hex: '#F97316' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', fill: 'bg-purple-500', hex: '#A855F7' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', fill: 'bg-red-500', hex: '#EF4444' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', fill: 'bg-teal-500', hex: '#14B8A6' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', fill: 'bg-yellow-500', hex: '#EAB308' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', fill: 'bg-pink-500', hex: '#EC4899' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', fill: 'bg-gray-500', hex: '#6B7280' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', fill: 'bg-indigo-500', hex: '#6366F1' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', fill: 'bg-emerald-500', hex: '#10B981' },
}

// Generate sample time series data
function generateTimeSeriesData(days: number = 14) {
  const data = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })

    data.push({
      date: dateStr,
      value: Math.floor(Math.random() * 20) + 15 + Math.floor(i * 0.5),
      comparison: Math.floor(Math.random() * 15) + 10 + Math.floor(i * 0.3),
    })
  }

  return data
}

// Generate sparkline trend data
function generateTrend(length: number = 7, direction: 'up' | 'down' | 'stable' = 'up') {
  const trend = []
  let value = 50 + Math.random() * 20

  for (let i = 0; i < length; i++) {
    if (direction === 'up') {
      value += Math.random() * 5 - 1
    } else if (direction === 'down') {
      value -= Math.random() * 5 - 1
    } else {
      value += Math.random() * 4 - 2
    }
    trend.push(Math.max(0, Math.round(value)))
  }

  return trend
}

export default function AnalyticsPage() {
  const [alerts, setAlerts] = useState(generateSampleAlerts())

  // Load static data
  const processedConversations = getProcessedConversations()
  const topicStats = getTopicStats()
  const kbSummary = getKBSummary()
  const analyticsSummary = getAnalyticsSummary()

  // Generate chart data
  const heroChartData = generateTimeSeriesData(14)
  const comparisonData = heroChartData.map(d => ({ date: d.date, value: d.comparison! }))

  // Prepare bar chart data for topics
  const barChartData = topicStats
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map(topic => ({
      name: topic.name,
      count: topic.count,
      fill: colorClasses[topic.color]?.hex || colorClasses.gray.hex,
    }))

  // Generate topic stacked area data
  const topicTimeData = generateTimeSeriesData(7).map((d, i) => ({
    date: d.date,
    deliveries: Math.floor(Math.random() * 10) + 5,
    orders: Math.floor(Math.random() * 8) + 3,
    inventory: Math.floor(Math.random() * 6) + 2,
    payments: Math.floor(Math.random() * 5) + 1,
    other: Math.floor(Math.random() * 4) + 1,
  }))

  const topicDataKeys = [
    { key: 'deliveries', name: 'משלוחים', color: '#3B82F6' },
    { key: 'orders', name: 'הזמנות', color: '#22C55E' },
    { key: 'inventory', name: 'מלאי', color: '#F59E0B' },
    { key: 'payments', name: 'תשלומים', color: '#10B981' },
    { key: 'other', name: 'אחר', color: '#6B7280' },
  ]

  // Handle alert dismiss
  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, dismissed: true } : a))
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">דשבורד אנליטיקה</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{company.name} - סקירת ביצועים</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" />
            7 ימים אחרונים
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            סינון
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            ייצוא
          </Button>
        </div>
      </div>

      {/* KPI Row with Sparklines */}
      <KPIGrid columns={6}>
        <KPICard
          label="שיחות שנפתרו אוטומטית"
          value={Math.round(analyticsSummary.totalConversations * 0.78)}
          delta={4.1}
          deltaLabel="מהשבוע שעבר"
          trend={generateTrend(7, 'up')}
        />
        <KPICard
          label="סה״כ שיחות"
          value={analyticsSummary.totalConversations}
          delta={12.5}
          deltaLabel="מהשבוע שעבר"
          trend={generateTrend(7, 'up')}
        />
        <KPICard
          label="אחוז הצלחת אוטומציה"
          value="78.4%"
          delta={4.1}
          deltaLabel="מהשבוע שעבר"
          trend={generateTrend(7, 'up')}
        />
        <KPICard
          label="זמן תגובה ממוצע"
          value="1.2 דק׳"
          delta={-8.5}
          deltaLabel="מהשבוע שעבר"
          trend={generateTrend(7, 'down')}
          invertDelta={true}
        />
        <KPICard
          label="שיעור כישלון"
          value="5.2%"
          delta={-2.1}
          deltaLabel="מהשבוע שעבר"
          trend={generateTrend(7, 'down')}
          invertDelta={true}
        />
        <KPICard
          label="תבניות פעילות"
          value={kbSummary.automationPatterns}
          delta={0}
          icon={<Zap className="w-5 h-5 text-[var(--brand-primary)]" />}
        />
      </KPIGrid>

      {/* Hero Chart - Automation Success Over Time */}
      <HeroChart
        title="שיחות שנפתרו בהצלחה לאורך זמן"
        subtitle="השוואה לתקופה קודמת"
        data={heroChartData}
        comparisonData={comparisonData}
        valueLabel="תקופה נוכחית"
        comparisonLabel="תקופה קודמת"
      />

      {/* Breakdown Section - Two Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked Area - Topics Over Time */}
        <StackedAreaChart
          title="נושאים לאורך זמן"
          data={topicTimeData}
          dataKeys={topicDataKeys}
        />

        {/* Horizontal Bar - Volume by Topic */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-[var(--text-primary)]">
              כמות שיחות לפי נושא
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 70, bottom: 5 }}
                >
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip contentStyle={{ direction: 'rtl', textAlign: 'right' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-muted)]">שיעור כישלון</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">5.2%</p>
              </div>
              <div className="w-16 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateTrend(7, 'down').map((v, i) => ({ v, i }))}>
                    <Area type="monotone" dataKey="v" stroke="#EF4444" fill="#FEE2E2" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-muted)]">ציון ביטחון ממוצע</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">87%</p>
              </div>
              <div className="w-16 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateTrend(7, 'stable').map((v, i) => ({ v, i }))}>
                    <Area type="monotone" dataKey="v" stroke="#22C55E" fill="#DCFCE7" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-muted)]">שיחות להעברה ידנית</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">12%</p>
              </div>
              <div className="w-16 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateTrend(7, 'down').map((v, i) => ({ v, i }))}>
                    <Area type="monotone" dataKey="v" stroke="#F59E0B" fill="#FEF3C7" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-muted)]">תיקוני מנהל</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">3</p>
              </div>
              <div className="w-16 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateTrend(7, 'down').map((v, i) => ({ v, i }))}>
                    <Area type="monotone" dataKey="v" stroke="#6366F1" fill="#E0E7FF" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Panel */}
      <AlertsPanel
        alerts={alerts}
        onDismiss={handleDismissAlert}
        onViewDetails={(id) => console.log('View details:', id)}
      />

      {/* Topic Cards Grid */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">פירוט לפי נושא</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {CHOCOLATE_SHOP_TOPICS.map((topic) => {
              const colors = colorClasses[topic.color] || colorClasses.gray
              const topicData = topicStats.find(t => t.id === topic.id)
              return (
                <div
                  key={topic.id}
                  className={`p-4 rounded-lg border ${colors.border} ${colors.bg} hover:shadow-md transition-shadow cursor-pointer`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TopicIcon name={topic.icon as TopicIconName} className={`w-5 h-5 ${colors.text}`} />
                    <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                  </div>
                  <p className={`text-2xl font-bold ${colors.text}`}>
                    {topicData?.count || 0}
                  </p>
                  <p className="text-xs text-gray-500">שיחות</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Source Footer */}
      <Card className="border border-gray-200 bg-[var(--bg-subtle)]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-[var(--brand-primary)]" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                מקור הנתונים: WhatsApp - צוות ג'וליקה אוסישקין
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {analyticsSummary.totalConversations} שיחות | {kbSummary.automationPatterns} תבניות אוטומציה | {kbSummary.documents} מסמכים
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
