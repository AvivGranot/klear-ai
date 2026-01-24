"use client"

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
} from "recharts"

// Generate simple time series data for last 7 days
function generateWeeklyData() {
  const data = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric' })

    data.push({
      date: dateStr,
      conversations: Math.floor(Math.random() * 15) + 18,
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

export default function DashboardPage() {
  const analyticsSummary = getAnalyticsSummary()
  const chartData = generateWeeklyData()

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

      {/* Main Chart */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-gray-900">
            שיחות לאורך זמן
          </CardTitle>
          <p className="text-sm text-gray-500">7 ימים אחרונים</p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <Tooltip
                  contentStyle={{
                    direction: 'rtl',
                    textAlign: 'right',
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#colorConversations)"
                  name="שיחות"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
