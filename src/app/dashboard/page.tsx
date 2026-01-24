"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react"
import {
  company,
  getAnalyticsSummary,
} from "@/data/jolika-data"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Brush,
  ReferenceLine,
} from "recharts"

// Generate time series data for last 30 days (more data for interactive exploration)
function generateMonthlyData() {
  const data = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
    const fullDate = date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

    // Create more realistic data with some patterns
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

// Custom tooltip component
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { fullDate: string } }>; label?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
      <p className="font-medium">{payload[0].payload.fullDate}</p>
      <p className="text-emerald-400 font-bold text-lg">{payload[0].value} שיחות</p>
    </div>
  )
}

// Custom active dot
function CustomActiveDot(props: { cx?: number; cy?: number; payload?: { conversations: number } }) {
  const { cx, cy } = props
  if (!cx || !cy) return null

  return (
    <g>
      {/* Outer pulse ring */}
      <circle cx={cx} cy={cy} r={12} fill="#10B981" fillOpacity={0.2}>
        <animate attributeName="r" from="8" to="16" dur="1s" repeatCount="indefinite" />
        <animate attributeName="fill-opacity" from="0.3" to="0" dur="1s" repeatCount="indefinite" />
      </circle>
      {/* Inner dot */}
      <circle cx={cx} cy={cy} r={6} fill="#10B981" stroke="white" strokeWidth={2} />
    </g>
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

export default function DashboardPage() {
  const analyticsSummary = getAnalyticsSummary()
  const chartData = useMemo(() => generateMonthlyData(), [])

  // Track hovered data for live display
  const [activeData, setActiveData] = useState<{ date: string; conversations: number } | null>(null)

  const handleMouseMove = useCallback((state: { activePayload?: Array<{ payload: { date: string; conversations: number } }> }) => {
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
          value={analyticsSummary.totalConversations}
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
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">
                שיחות לאורך זמן
              </CardTitle>
              <p className="text-sm text-gray-500">גרור לבחירת טווח תאריכים</p>
            </div>
            {/* Live value display */}
            <div className="text-left">
              <p className="text-3xl font-bold text-emerald-600 transition-all duration-150">
                {displayValue}
              </p>
              <p className="text-sm text-gray-500">{displayDate}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
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
                  content={<CustomTooltip />}
                  cursor={<CustomCursor />}
                />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#colorConversations)"
                  name="שיחות"
                  activeDot={<CustomActiveDot />}
                  animationDuration={500}
                />
                {/* Range selector brush */}
                <Brush
                  dataKey="date"
                  height={30}
                  stroke="#10B981"
                  fill="#F8FAFC"
                  travellerWidth={10}
                  startIndex={chartData.length - 14}
                  endIndex={chartData.length - 1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
