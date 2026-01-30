"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import {
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
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
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

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

  const cutoffDate = new Date(today)
  switch (range) {
    case '1W': cutoffDate.setDate(cutoffDate.getDate() - 7); break
    case '1M': cutoffDate.setMonth(cutoffDate.getMonth() - 1); break
    case '3M': cutoffDate.setMonth(cutoffDate.getMonth() - 3); break
    case '1Y': cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); break
  }

  filteredData = parsedData.filter(d => d.dateObj >= cutoffDate)
  if (filteredData.length < 2) filteredData = parsedData.slice(-30)

  return filteredData.map(d => ({
    date: d.displayDate,
    fullDate: d.dateObj.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    value: d.count,
    timestamp: d.dateObj.getTime(),
  }))
}

// Google Finance style interactive chart
function InteractiveChart({ data, timeRange }: { data: Array<{ date: string; fullDate: string; value: number; timestamp: number }>; timeRange: TimeRange }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  const firstValue = data[0]?.value ?? 0
  const lastValue = data[data.length - 1]?.value ?? 0
  const currentValue = activeIndex !== null ? data[activeIndex]?.value : lastValue
  const currentDate = activeIndex !== null ? data[activeIndex]?.fullDate : 'נתונים אחרונים'

  const change = firstValue > 0 ? ((currentValue - firstValue) / firstValue) * 100 : 0
  const isPositive = change >= 0
  const chartColor = isPositive ? '#22C55E' : '#EF4444'

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current || data.length === 0) return
    const rect = chartRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const index = Math.min(Math.max(0, Math.round(percentage * (data.length - 1))), data.length - 1)
    setActiveIndex(index)
    setIsDragging(true)
  }, [data.length])

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null)
    setIsDragging(false)
  }, [])

  const activeX = activeIndex !== null ? `${(activeIndex / (data.length - 1)) * 100}%` : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">שיחות לאורך זמן</h2>
          <p className="text-sm text-gray-500 mt-0.5">{currentDate}</p>
        </div>
        <div className="text-left">
          <p className="text-3xl font-bold text-gray-900 tabular-nums">{currentValue}</p>
          <div className="flex items-center gap-1.5 justify-end mt-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">מתחילת התקופה</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={chartRef}
        className="relative h-[300px] mt-4 cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={(e) => {
          const touch = e.touches[0]
          if (!chartRef.current) return
          const rect = chartRef.current.getBoundingClientRect()
          const x = touch.clientX - rect.left
          const percentage = x / rect.width
          const index = Math.min(Math.max(0, Math.round(percentage * (data.length - 1))), data.length - 1)
          setActiveIndex(index)
          setIsDragging(true)
        }}
        onTouchEnd={handleMouseLeave}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 30 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              interval="preserveStartEnd"
              tickMargin={10}
            />
            <YAxis
              domain={[minValue * 0.8, maxValue * 1.1]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              width={35}
              tickFormatter={(v) => v.toFixed(0)}
            />
            {activeIndex !== null && (
              <ReferenceLine x={data[activeIndex]?.date} stroke="#9CA3AF" strokeDasharray="3 3" />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2.5}
              fill="url(#chartGradient)"
              isAnimationActive={!isDragging}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Interactive Crosshair */}
        {activeX && activeIndex !== null && (
          <>
            {/* Vertical Line */}
            <div
              className="absolute top-5 bottom-8 w-px bg-gray-300 pointer-events-none"
              style={{ left: activeX }}
            />
            {/* Data Point */}
            <div
              className="absolute w-4 h-4 rounded-full border-3 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: activeX,
                top: `${20 + ((maxValue * 1.1 - data[activeIndex].value) / (maxValue * 1.1 - minValue * 0.8)) * (300 - 50)}px`,
                backgroundColor: '#fff',
                borderColor: chartColor,
                borderWidth: '3px',
                boxShadow: `0 0 0 4px ${chartColor}30`,
              }}
            />
            {/* Tooltip */}
            <div
              className="absolute bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg pointer-events-none transform -translate-x-1/2 whitespace-nowrap"
              style={{ left: activeX, top: '-8px' }}
            >
              <span className="font-bold">{data[activeIndex].value}</span>
              <span className="text-gray-400 mr-2">שיחות</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y')
  const chartData = useMemo(() => getChartData(timeRange), [timeRange])
  const topQuestions = useMemo(() => getRepetitiveQuestions().slice(0, 5), [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">שלום, מנהל 👋</h1>
          <p className="text-gray-500 mt-1">{company.name} • {JOLIKA_MANAGERS.length} מנהלות פעילות</p>
        </div>
        <Link href={`/chat/${company.id}`} target="_blank" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white font-medium rounded-lg hover:bg-[#128C7E] transition-colors">
          פתח צ׳אט עובדים
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, color: 'blue', value: STATS.totalConversations, label: 'שיחות השנה' },
          { icon: Users, color: 'green', value: STATS.managerResponses, label: 'תשובות מנהלות' },
          { icon: Zap, color: 'amber', value: STATS.questionsDetected, label: 'שאלות שזוהו' },
          { icon: Clock, color: 'purple', value: `${STATS.medianResponseTime} דק׳`, label: 'זמן תגובה חציוני' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg bg-${kpi.color}-50 flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 text-${kpi.color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{kpi.value}</p>
            <p className="text-sm text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Time Range Selector + Chart */}
      <div className="space-y-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(['1W', '1M', '3M', '1Y'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                timeRange === range
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <InteractiveChart data={chartData} timeRange={timeRange} />
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Manager Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">מנהלות פעילות</h2>
            <Link href="/dashboard/conversations" className="text-sm text-[#25D366] hover:underline">צפה בכל</Link>
          </div>
          <div className="space-y-4">
            {STATS.managers.map((m, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">{m.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{m.name}</p>
                  <p className="text-sm text-gray-500">{m.count} תשובות • {m.responseTime}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{m.percent}%</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">{STATS.answeredWithin60Min}% תוך שעה</span>
            <span className="text-green-600 font-medium flex items-center gap-1"><TrendingUp className="w-4 h-4" />מהיר</span>
          </div>
        </div>

        {/* Top Questions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">שאלות נפוצות</h2>
            <Link href="/dashboard/knowledge" className="text-sm text-[#25D366] hover:underline flex items-center gap-1"><BookOpen className="w-4 h-4" />מאגר ידע</Link>
          </div>
          <div className="space-y-3">
            {topQuestions.map((q, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 line-clamp-2">{q.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{q.frequency}× • {q.topic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 rounded-xl border border-[#25D366]/20 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">התחל עכשיו</h2>
          <p className="text-gray-600 mb-6">Klear AI לומד מהשיחות שלך ומציע תשובות אוטומטיות.</p>
          <div className="grid gap-3">
            {[
              { href: '/dashboard/knowledge', icon: BookOpen, title: 'סקור אוטומציות', desc: 'אשר תבניות תשובה' },
              { href: '/dashboard/conversations', icon: MessageSquare, title: 'צפה בשיחות', desc: 'ניתוח שאלות ותשובות' },
            ].map((action, i) => (
              <Link key={i} href={action.href} className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-[#25D366] transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center group-hover:bg-[#25D366]/20 transition-colors">
                  <action.icon className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{action.title}</p>
                  <p className="text-sm text-gray-500">{action.desc}</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 mr-auto group-hover:text-[#25D366] transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
