"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react"
import {
  company,
  conversations,
  getConversationsByDate,
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

// Google Finance style time ranges
type TimeRange = '1D' | '5D' | '1M' | '6M' | '1Y' | '5Y' | 'MAX'

// Get chart data based on real conversation dates
function getChartData(range: TimeRange) {
  const allData = getConversationsByDate()

  if (allData.length === 0) {
    return []
  }

  // Parse dates for filtering
  const parsedData = allData.map(d => ({
    ...d,
    dateObj: new Date(d.date),
  }))

  // Sort by date ascending
  parsedData.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())

  const today = new Date()
  let filteredData = parsedData

  // Filter based on range
  switch (range) {
    case '1D':
      // Show today's data (or last available day if no data today)
      filteredData = parsedData.slice(-1)
      break
    case '5D':
      const fiveDaysAgo = new Date(today)
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
      filteredData = parsedData.filter(d => d.dateObj >= fiveDaysAgo)
      if (filteredData.length < 2) filteredData = parsedData.slice(-5)
      break
    case '1M':
      const oneMonthAgo = new Date(today)
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      filteredData = parsedData.filter(d => d.dateObj >= oneMonthAgo)
      if (filteredData.length < 2) filteredData = parsedData.slice(-30)
      break
    case '6M':
      const sixMonthsAgo = new Date(today)
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      filteredData = parsedData.filter(d => d.dateObj >= sixMonthsAgo)
      if (filteredData.length < 2) filteredData = parsedData.slice(-180)
      break
    case '1Y':
      const oneYearAgo = new Date(today)
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      filteredData = parsedData.filter(d => d.dateObj >= oneYearAgo)
      if (filteredData.length < 2) filteredData = parsedData.slice(-365)
      break
    case '5Y':
      const fiveYearsAgo = new Date(today)
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
      filteredData = parsedData.filter(d => d.dateObj >= fiveYearsAgo)
      if (filteredData.length < 2) filteredData = parsedData
      break
    case 'MAX':
    default:
      filteredData = parsedData
      break
  }

  // If still no data, return all
  if (filteredData.length === 0) {
    filteredData = parsedData
  }

  return filteredData.map(d => ({
    date: d.displayDate,
    fullDate: d.dateObj.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    conversations: d.count,
    dateObj: d.dateObj,
  }))
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

// Custom cursor line - subtle gray
function CustomCursor(props: { points?: Array<{ x: number; y: number }>; height?: number }) {
  const { points, height } = props
  if (!points?.length) return null

  return (
    <line
      x1={points[0].x}
      y1={0}
      x2={points[0].x}
      y2={height}
      stroke="#9CA3AF"
      strokeWidth={1}
      strokeDasharray="4 4"
      opacity={0.5}
    />
  )
}

// Google Finance style time range button
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
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        selected
          ? 'bg-gray-900 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )
}

export default function DashboardPage() {
  const totalConversations = conversations.length

  // Time range state - default to MAX to show all available data
  const [timeRange, setTimeRange] = useState<TimeRange>('MAX')

  const chartData = useMemo(() => getChartData(timeRange), [timeRange])

  // Calculate average for reference line
  const averageValue = useMemo(() =>
    chartData.length > 0
      ? Math.round(chartData.reduce((sum, d) => sum + d.conversations, 0) / chartData.length)
      : 0,
    [chartData]
  )

  // Track hovered data for live display
  const [activeData, setActiveData] = useState<{ date: string; fullDate: string; conversations: number } | null>(null)

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
  const firstValue = chartData[0]?.conversations ?? 0
  const latestValue = chartData[chartData.length - 1]?.conversations ?? 0
  const displayValue = activeData?.conversations ?? latestValue
  const displayDate = activeData?.fullDate ?? chartData[chartData.length - 1]?.fullDate ?? ''

  // Calculate percentage change (like Google Finance)
  const percentChange = useMemo(() => {
    if (chartData.length < 2 || firstValue === 0) return null
    const change = ((latestValue - firstValue) / firstValue) * 100
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
      absoluteChange: latestValue - firstValue,
    }
  }, [chartData, firstValue, latestValue])

  return (
    <div className="min-h-screen bg-white p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">שלום, מנהל</h1>
          <p className="text-sm text-gray-500 mt-1">{company.name} • 3 מנהלות פעילות</p>
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

      {/* Interactive Chart - Google Finance Style */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">
                שיחות לאורך זמן
              </CardTitle>
              {/* Percentage Change Display - Google Finance Style */}
              {percentChange && (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-medium ${
                    percentChange.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {percentChange.isPositive ? '+' : '-'}{percentChange.absoluteChange}
                    {' '}
                    ({percentChange.isPositive ? '+' : '-'}{percentChange.value}%)
                  </span>
                  <span className="text-xs text-gray-400">מתחילת התקופה</span>
                </div>
              )}
            </div>
            {/* Live value display */}
            <div className="text-left">
              <p className="text-3xl font-bold text-gray-900 transition-all duration-150">
                {displayValue}
              </p>
              <p className="text-sm text-gray-500">{displayDate}</p>
            </div>
          </div>

          {/* Time Range Selector - Google Finance Style */}
          <div className="flex items-center gap-1 mt-4 bg-gray-50 rounded-lg p-1 w-fit">
            <TimeRangeButton
              label="1D"
              selected={timeRange === '1D'}
              onClick={() => setTimeRange('1D')}
            />
            <TimeRangeButton
              label="5D"
              selected={timeRange === '5D'}
              onClick={() => setTimeRange('5D')}
            />
            <TimeRangeButton
              label="1M"
              selected={timeRange === '1M'}
              onClick={() => setTimeRange('1M')}
            />
            <TimeRangeButton
              label="6M"
              selected={timeRange === '6M'}
              onClick={() => setTimeRange('6M')}
            />
            <TimeRangeButton
              label="1Y"
              selected={timeRange === '1Y'}
              onClick={() => setTimeRange('1Y')}
            />
            <TimeRangeButton
              label="5Y"
              selected={timeRange === '5Y'}
              onClick={() => setTimeRange('5Y')}
            />
            <TimeRangeButton
              label="MAX"
              selected={timeRange === 'MAX'}
              onClick={() => setTimeRange('MAX')}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[300px] outline-none focus:outline-none focus-visible:outline-none [&_*]:outline-none [&_*]:ring-0 [&_*]:focus:ring-0 [&_*]:focus:outline-none [&_*]:focus-visible:outline-none [&_*]:focus-visible:ring-0 [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none" style={{ outline: 'none' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
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
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip
                  content={() => null}
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
                <ReferenceLine
                  y={averageValue}
                  stroke="#9CA3AF"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
