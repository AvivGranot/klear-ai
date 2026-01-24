"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react"
import {
  company,
  conversations,
} from "@/data/jolika-data"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts"

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'custom'

// Generate time series data based on selected range
function generateChartData(range: TimeRange) {
  const data = []
  const today = new Date()

  const daysMap: Record<TimeRange, number> = {
    today: 1,
    week: 7,
    month: 30,
    year: 365,
    custom: 30,
  }

  const days = daysMap[range]

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    let dateStr: string
    if (range === 'today') {
      dateStr = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    } else if (range === 'year') {
      dateStr = date.toLocaleDateString('he-IL', { month: 'short' })
    } else {
      dateStr = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
    }

    const fullDate = date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

    const baseValue = 20 + Math.sin(i / 3) * 5
    const noise = Math.random() * 10 - 5
    const weekendDip = (date.getDay() === 5 || date.getDay() === 6) ? -5 : 0

    data.push({
      date: dateStr,
      fullDate,
      conversations: Math.max(10, Math.round(baseValue + noise + weekendDip)),
    })
  }

  return data
}

interface KPICardProps {
  label: string
  value: string | number
  trend?: 'up' | 'down'
  trendValue?: string
}

function SimpleKPICard({ label, value, trend, trendValue }: KPICardProps) {
  return (
    <Card className="bg-white border border-gray-200">
      <CardContent className="p-6">
        <p className="text-sm text-gray-500 mb-2">{label}</p>
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Custom active dot - smaller and cleaner
function CustomActiveDot(props: { cx?: number; cy?: number }) {
  const { cx, cy } = props
  if (!cx || !cy) return null

  return (
    <circle cx={cx} cy={cy} r={4} fill="#10B981" stroke="white" strokeWidth={2} />
  )
}

// Custom cursor line
function CustomCursor(props: { points?: Array<{ x: number; y: number }>; height?: number }) {
  const { points, height } = props
  if (!points?.length) return null

  return (
    <line
      x1={points[0].x}
      y1={0}
      x2={points[0].x}
      y2={height}
      stroke="#10B981"
      strokeWidth={1}
      strokeDasharray="4 4"
      opacity={0.6}
    />
  )
}

// Time range button component - underline style like Google Finance
function TimeRangeButton({
  label,
  selected,
  onClick
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm transition-colors border-b-2 outline-none ${
        selected
          ? 'border-emerald-600 text-emerald-600 font-medium'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  )
}

export default function DashboardPage() {
  const totalConversations = conversations.length

  // Time range state
  const [timeRange, setTimeRange] = useState<TimeRange>('month')

  const chartData = useMemo(() => generateChartData(timeRange), [timeRange])

  // Calculate average for reference line
  const averageValue = useMemo(() =>
    Math.round(chartData.reduce((sum, d) => sum + d.conversations, 0) / chartData.length),
    [chartData]
  )

  // Track hovered data for live display
  const [activeData, setActiveData] = useState<{ date: string; conversations: number } | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = useCallback((state: any) => {
    if (state?.activePayload?.length) {
      setActiveData(state.activePayload[0].payload)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setActiveData(null)
  }, [])

  // Calculate stats for display
  const latestValue = chartData[chartData.length - 1]?.conversations
  const displayValue = activeData?.conversations ?? latestValue
  const displayDate = activeData?.date ?? chartData[chartData.length - 1]?.date

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">שלום, מנהל</h1>
          <p className="text-sm text-gray-500 mt-1">{company.name}</p>
        </div>

        <Link href={`/chat/${company.id}`} target="_blank">
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            פתח צ׳אט עובדים
            <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SimpleKPICard
          label="סה״כ שיחות"
          value={totalConversations}
          trend="up"
          trendValue="+12% מהשבוע שעבר"
        />
        <SimpleKPICard
          label="אחוז הצלחה"
          value="78%"
          trend="up"
          trendValue="+4% מהשבוע שעבר"
        />
        <SimpleKPICard
          label="זמן תגובה ממוצע"
          value="1.2 דק׳"
          trend="down"
          trendValue="-8% מהשבוע שעבר"
        />
      </div>

      {/* Interactive Chart */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-medium text-gray-900">
              שיחות לאורך זמן
            </CardTitle>
            {/* Live value display */}
            <div className="text-left">
              <p className="text-3xl font-bold text-emerald-600 transition-all duration-150">
                {displayValue}
              </p>
              <p className="text-sm text-gray-500">{displayDate}</p>
            </div>
          </div>

          {/* Time Range Selector - underline style */}
          <div className="flex items-center gap-1 mt-4 border-b border-gray-200">
            <TimeRangeButton
              label="היום"
              selected={timeRange === 'today'}
              onClick={() => setTimeRange('today')}
            />
            <TimeRangeButton
              label="שבוע"
              selected={timeRange === 'week'}
              onClick={() => setTimeRange('week')}
            />
            <TimeRangeButton
              label="חודש"
              selected={timeRange === 'month'}
              onClick={() => setTimeRange('month')}
            />
            <TimeRangeButton
              label="שנה"
              selected={timeRange === 'year'}
              onClick={() => setTimeRange('year')}
            />
            <TimeRangeButton
              label="טווח מותאם"
              selected={timeRange === 'custom'}
              onClick={() => setTimeRange('custom')}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[300px]" style={{ outline: 'none' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ outline: 'none' }}
              >
                <defs>
                  <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip
                  content={() => null}
                  cursor={<CustomCursor />}
                />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  stroke="#10B981"
                  strokeWidth={1.5}
                  fill="url(#colorConversations)"
                  name="שיחות"
                  activeDot={<CustomActiveDot />}
                  animationDuration={500}
                />
                <ReferenceLine
                  y={averageValue}
                  stroke="#9CA3AF"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Link to Analytics */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href="/dashboard/conversations"
              className="text-emerald-600 hover:underline text-sm flex items-center gap-1"
            >
              צפה באנליטיקה מפורטת
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
