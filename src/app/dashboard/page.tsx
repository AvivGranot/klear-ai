"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Zap,
  BookOpen,
} from "lucide-react"
import {
  company,
  getConversationsByDate,
  getRepetitiveQuestions,
  JOLIKA_MANAGERS,
} from "@/data/jolika-data"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

// Real data from last 12 months analysis
const STATS = {
  totalConversations: 470,
  managerResponses: 28,
  questionsDetected: 111,
  medianResponseTime: 4.3,
  answeredWithin60Min: 82,
  managers: [
    { name: 'שלי גולדנברג', count: 15, percent: 54, responseTime: '2.5 דק׳' },
    { name: 'רותם פרחי', count: 11, percent: 39, responseTime: '6.5 דק׳' },
    { name: 'שלי בן מויאל', count: 2, percent: 7, responseTime: '0.2 דק׳' },
  ]
}

type TimeRange = '1W' | '1M' | '3M' | '1Y'

function getChartData(range: TimeRange) {
  const allData = getConversationsByDate()
  if (allData.length === 0) return []

  const parsedData = allData.map(d => ({
    ...d,
    dateObj: new Date(d.date),
  })).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())

  const today = new Date()
  let filteredData = parsedData

  switch (range) {
    case '1W':
      const oneWeekAgo = new Date(today)
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      filteredData = parsedData.filter(d => d.dateObj >= oneWeekAgo)
      if (filteredData.length < 2) filteredData = parsedData.slice(-7)
      break
    case '1M':
      const oneMonthAgo = new Date(today)
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      filteredData = parsedData.filter(d => d.dateObj >= oneMonthAgo)
      if (filteredData.length < 2) filteredData = parsedData.slice(-30)
      break
    case '3M':
      const threeMonthsAgo = new Date(today)
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      filteredData = parsedData.filter(d => d.dateObj >= threeMonthsAgo)
      if (filteredData.length < 2) filteredData = parsedData.slice(-90)
      break
    case '1Y':
    default:
      const oneYearAgo = new Date(today)
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      filteredData = parsedData.filter(d => d.dateObj >= oneYearAgo)
      if (filteredData.length < 2) filteredData = parsedData.slice(-365)
      break
  }

  if (filteredData.length === 0) filteredData = parsedData

  return filteredData.map(d => ({
    date: d.displayDate,
    fullDate: d.dateObj.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' }),
    value: d.count,
  }))
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y')
  const [hoveredData, setHoveredData] = useState<{ date: string; fullDate: string; value: number } | null>(null)

  const chartData = useMemo(() => getChartData(timeRange), [timeRange])
  const topQuestions = useMemo(() => getRepetitiveQuestions().slice(0, 5), [])

  const latestValue = chartData[chartData.length - 1]?.value ?? 0
  const firstValue = chartData[0]?.value ?? 0
  const displayValue = hoveredData?.value ?? latestValue
  const displayDate = hoveredData?.fullDate ?? 'סה״כ בתקופה'

  const percentChange = useMemo(() => {
    if (chartData.length < 2 || firstValue === 0) return null
    const change = ((latestValue - firstValue) / firstValue) * 100
    return { value: Math.abs(change).toFixed(0), isPositive: change >= 0 }
  }, [chartData, firstValue, latestValue])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = useCallback((state: any) => {
    if (state?.activePayload?.length) {
      setHoveredData(state.activePayload[0].payload)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">שלום, מנהל 👋</h1>
          <p className="text-gray-500 mt-1">{company.name} • {JOLIKA_MANAGERS.length} מנהלות פעילות</p>
        </div>
        <Link
          href={`/chat/${company.id}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white font-medium rounded-lg hover:bg-[#128C7E] transition-colors"
        >
          פתח צ׳אט עובדים
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{STATS.totalConversations}</p>
          <p className="text-sm text-gray-500 mt-1">שיחות השנה</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{STATS.managerResponses}</p>
          <p className="text-sm text-gray-500 mt-1">תשובות מנהלות</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{STATS.questionsDetected}</p>
          <p className="text-sm text-gray-500 mt-1">שאלות שזוהו</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{STATS.medianResponseTime} דק׳</p>
          <p className="text-sm text-gray-500 mt-1">זמן תגובה חציוני</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart - 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">שיחות לאורך זמן</h2>
              {percentChange && (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-medium ${percentChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {percentChange.isPositive ? '+' : '-'}{percentChange.value}%
                  </span>
                  <span className="text-xs text-gray-400">מתחילת התקופה</span>
                </div>
              )}
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-gray-900">{displayValue}</p>
              <p className="text-sm text-gray-500">{displayDate}</p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
            {(['1W', '1M', '3M', '1Y'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredData(null)}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  width={30}
                />
                <Tooltip content={() => null} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fill="url(#chartGradient)"
                  activeDot={{ r: 5, fill: '#22C55E', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Manager Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">מנהלות פעילות</h2>
            <Link href="/dashboard/conversations" className="text-sm text-[#25D366] hover:underline">
              צפה בכל
            </Link>
          </div>

          <div className="space-y-4">
            {STATS.managers.map((manager, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
                  {manager.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{manager.name}</p>
                  <p className="text-sm text-gray-500">{manager.count} תשובות • {manager.responseTime}</p>
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-gray-900">{manager.percent}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{STATS.answeredWithin60Min}% תוך שעה</span>
              <span className="text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                מהיר
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Questions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">שאלות נפוצות</h2>
            <Link href="/dashboard/knowledge" className="text-sm text-[#25D366] hover:underline flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              מאגר ידע
            </Link>
          </div>

          <div className="space-y-3">
            {topQuestions.map((q, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 line-clamp-2">{q.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{q.frequency} פעמים • {q.topic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 rounded-xl border border-[#25D366]/20 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">התחל עכשיו</h2>
          <p className="text-gray-600 mb-6">
            Klear AI לומד מהשיחות שלך ומציע תשובות אוטומטיות לשאלות נפוצות.
          </p>

          <div className="grid gap-3">
            <Link
              href="/dashboard/knowledge"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-[#25D366] transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center group-hover:bg-[#25D366]/20 transition-colors">
                <BookOpen className="w-5 h-5 text-[#25D366]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">סקור אוטומציות</p>
                <p className="text-sm text-gray-500">אשר תבניות תשובה חדשות</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 mr-auto group-hover:text-[#25D366] transition-colors" />
            </Link>

            <Link
              href="/dashboard/conversations"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-[#25D366] transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center group-hover:bg-[#25D366]/20 transition-colors">
                <MessageSquare className="w-5 h-5 text-[#25D366]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">צפה בשיחות</p>
                <p className="text-sm text-gray-500">ניתוח שאלות ותשובות</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 mr-auto group-hover:text-[#25D366] transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
