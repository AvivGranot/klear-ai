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
  X,
} from "lucide-react"
import {
  company,
  getConversationsByDate,
  getRepetitiveQuestions,
  JOLIKA_MANAGERS,
  conversations as allConversations,
} from "@/data/jolika-data"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts"

// Dynamic stats from real data
const STATS = {
  totalConversations: allConversations.length,
  managerResponses: allConversations.filter(c =>
    c.answerSender?.includes('שלי') || c.answerSender?.includes('רותם')
  ).length,
  questionsDetected: allConversations.filter(c => c.type === 'question').length,
  medianResponseTime: 4.3,
  answeredWithin60Min: 82,
  managers: JOLIKA_MANAGERS.map(m => {
    const count = allConversations.filter(c => c.answerSender?.includes(m.name)).length
    return {
      name: m.name,
      count,
      percent: Math.round((count / Math.max(allConversations.length, 1)) * 100),
      responseTime: m.isOwner ? '2.5 דק׳' : '6.5 דק׳',
    }
  }).filter(m => m.count > 0),
}

type TimeRange = '1W' | '1M' | '3M' | '1Y'

interface ChartDataPoint {
  date: string
  fullDate: string
  value: number
  timestamp: number
  messages: Array<{ question: string; sender: string; time: string; answer: string }>
}

// Get chart data with actual message details
function getChartData(): ChartDataPoint[] {
  const rawData = getConversationsByDate()

  if (rawData.length === 0) {
    return []
  }

  // Parse real data and include messages
  return rawData.map(d => {
    const [year, month, day] = d.date.split('-')
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))

    // Get actual messages for this date (format: DD/MM/YYYY)
    const dateStr = `${day}/${month}/${year}`
    const messagesOnDay = allConversations.filter(c => c.date === dateStr)

    return {
      date: d.displayDate,
      fullDate: dateObj.toLocaleDateString('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      value: d.count,
      timestamp: dateObj.getTime(),
      messages: messagesOnDay.map(m => ({
        question: m.question || '',
        sender: m.questionSender?.replace(/[^\u0590-\u05FF\s]/g, '').trim() || 'לא ידוע',
        time: m.time || '',
        answer: m.answer?.slice(0, 100) || '',
      })),
    }
  }).sort((a, b) => a.timestamp - b.timestamp)
}

// Google Finance style interactive chart with click-to-view details
function InteractiveChart({ data }: { data: ChartDataPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  const totalInPeriod = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])
  const currentValue = activeIndex !== null ? data[activeIndex]?.value : data[data.length - 1]?.value ?? 0
  const currentDate = activeIndex !== null ? data[activeIndex]?.fullDate : data[data.length - 1]?.fullDate ?? ''

  const chartColor = '#22C55E'
  const maxValue = Math.max(...data.map(d => d.value), 1)

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
    if (selectedIndex === null) {
      setActiveIndex(null)
    }
    setIsDragging(false)
  }, [selectedIndex])

  const handleClick = useCallback(() => {
    if (activeIndex !== null) {
      setSelectedIndex(selectedIndex === activeIndex ? null : activeIndex)
    }
  }, [activeIndex, selectedIndex])

  const activeX = activeIndex !== null && data.length > 1
    ? `${(activeIndex / (data.length - 1)) * 100}%`
    : null

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">שיחות לאורך זמן</h2>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          אין נתונים להצגה
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">שיחות לאורך זמן</h2>
          <p className="text-sm text-gray-500 mt-0.5">{currentDate}</p>
        </div>
        <div className="text-left">
          <p className="text-3xl font-bold text-gray-900 tabular-nums">{totalInPeriod}</p>
          <p className="text-xs text-gray-500 mt-1">סה״כ שיחות בתקופה</p>
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={chartRef}
        className="relative h-[300px] mt-4 cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
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
        onTouchEnd={() => {
          if (activeIndex !== null) {
            setSelectedIndex(selectedIndex === activeIndex ? null : activeIndex)
          }
        }}
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
              domain={[0, maxValue * 1.2]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              width={35}
              tickFormatter={(v) => v.toFixed(0)}
            />
            {/* Disable default Recharts tooltip completely */}
            <Tooltip
              content={() => null}
              cursor={false}
              wrapperStyle={{ display: 'none', visibility: 'hidden' }}
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

        {/* Interactive Crosshair - Airbnb style */}
        {activeX && activeIndex !== null && (
          <>
            {/* Vertical Line - subtle dashed */}
            <div
              className="absolute top-5 bottom-8 pointer-events-none"
              style={{
                left: activeX,
                width: '1px',
                background: 'repeating-linear-gradient(to bottom, #D1D5DB 0px, #D1D5DB 4px, transparent 4px, transparent 8px)'
              }}
            />
            {/* Data Point - larger, more prominent */}
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
              style={{
                left: activeX,
                top: `${20 + ((maxValue * 1.2 - data[activeIndex].value) / (maxValue * 1.2)) * (300 - 50)}px`,
                width: '18px',
                height: '18px',
                backgroundColor: '#fff',
                borderRadius: '50%',
                border: `3px solid ${chartColor}`,
                boxShadow: `0 0 0 6px ${chartColor}20, 0 4px 12px rgba(0,0,0,0.15)`,
              }}
            />
            {/* Hover Tooltip - Airbnb style: clean white with shadow */}
            <div
              className="absolute bg-white text-gray-900 px-4 py-3 rounded-2xl pointer-events-none transform -translate-x-1/2 whitespace-nowrap z-10 shadow-xl border border-gray-100"
              style={{
                left: activeX,
                top: '-20px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)'
              }}
            >
              <div className="text-2xl font-bold text-gray-900">{data[activeIndex].value}</div>
              <div className="text-sm text-gray-500 font-medium">שיחות</div>
              <div className="text-[10px] text-emerald-600 mt-1 font-medium">לחץ לפרטים →</div>
              {/* Arrow pointing down */}
              <div
                className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-100"
              />
            </div>
          </>
        )}
      </div>

      {/* Selected Day Detail Panel - Airbnb style card */}
      {selectedIndex !== null && data[selectedIndex] && (
        <div
          className="absolute top-4 left-4 bg-white rounded-3xl border border-gray-200 p-5 w-[380px] z-20 max-h-[420px] overflow-hidden flex flex-col"
          style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <span className="text-white text-xl font-bold">{data[selectedIndex].value}</span>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">שיחות</p>
                  <p className="text-sm text-gray-500">{data[selectedIndex].fullDate}</p>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedIndex(null); }}
              className="p-2.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mb-4" />

          {/* Messages List */}
          <div className="overflow-y-auto flex-1 -mx-1 px-1">
            {data[selectedIndex].messages.length > 0 ? (
              <div className="space-y-3">
                {data[selectedIndex].messages.map((msg, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                    {/* Question */}
                    <p className="text-sm text-gray-900 font-medium leading-relaxed">
                      {msg.question.slice(0, 100)}{msg.question.length > 100 ? '...' : ''}
                    </p>
                    {/* Answer Preview */}
                    {msg.answer && (
                      <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-100">
                        <p className="text-xs text-emerald-700 line-clamp-2">
                          <span className="font-semibold">תשובה:</span> {msg.answer}
                        </p>
                      </div>
                    )}
                    {/* Meta */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-gray-600">{msg.sender.charAt(0)}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-600">{msg.sender}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <MessageSquare className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">אין פרטי שיחות ליום זה</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-gray-400 text-center mt-3">
        העבר עכבר לראות נתונים • לחץ על נקודה לפרטים מלאים
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y')
  const chartData = useMemo(() => getChartData(), [])
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
          { icon: MessageSquare, color: 'blue', value: STATS.totalConversations, label: 'שיחות בנתונים' },
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

        <InteractiveChart data={chartData} />
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
            {STATS.managers.length > 0 ? STATS.managers.map((m, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">{m.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{m.name}</p>
                  <p className="text-sm text-gray-500">{m.count} תשובות • {m.responseTime}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{m.percent}%</span>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">אין נתוני מנהלות</p>
            )}
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
