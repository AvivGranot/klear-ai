"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

type TimeRange = "day" | "week" | "month"

interface DataPoint {
  date: string
  value: number
  comparison?: number
}

interface HeroChartProps {
  title: string
  subtitle?: string
  data: DataPoint[]
  comparisonData?: DataPoint[]
  valueLabel?: string
  comparisonLabel?: string
  className?: string
  showTimeRangeSelector?: boolean
  onTimeRangeChange?: (range: TimeRange) => void
}

export function HeroChart({
  title,
  subtitle,
  data,
  comparisonData,
  valueLabel = "נוכחי",
  comparisonLabel = "קודם",
  className,
  showTimeRangeSelector = true,
  onTimeRangeChange,
}: HeroChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("week")

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range)
    onTimeRangeChange?.(range)
  }

  // Merge data with comparison if provided
  const chartData = data.map((point, index) => ({
    ...point,
    comparison: comparisonData?.[index]?.value,
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3" dir="rtl">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className={cn("border border-gray-200", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-[var(--text-primary)]">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
            )}
          </div>

          {showTimeRangeSelector && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(["day", "week", "month"] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTimeRangeChange(range)}
                  className={cn(
                    "px-3 py-1 text-sm rounded-md transition-colors",
                    timeRange === range
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {range === "day" && "יום"}
                  {range === "week" && "שבוע"}
                  {range === "month" && "חודש"}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorComparison" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-comparison)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--chart-comparison)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid)"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                dx={-10}
              />

              <Tooltip content={<CustomTooltip />} />

              {comparisonData && (
                <Area
                  type="monotone"
                  dataKey="comparison"
                  name={comparisonLabel}
                  stroke="var(--chart-comparison)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="url(#colorComparison)"
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              )}

              <Area
                type="monotone"
                dataKey="value"
                name={valueLabel}
                stroke="var(--chart-primary)"
                strokeWidth={2}
                fill="url(#colorValue)"
                isAnimationActive={true}
                animationDuration={1000}
              />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: 20 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Stacked Area Chart for showing composition over time (topics, etc.)
interface StackedAreaChartProps {
  title: string
  data: Array<Record<string, number | string>>
  dataKeys: Array<{ key: string; name: string; color: string }>
  className?: string
}

export function StackedAreaChart({
  title,
  data,
  dataKeys,
  className,
}: StackedAreaChartProps) {
  return (
    <Card className={cn("border border-gray-200", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[var(--text-primary)]">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid)"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              />

              <Tooltip />

              {dataKeys.map((item) => (
                <Area
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.name}
                  stackId="1"
                  stroke={item.color}
                  fill={item.color}
                  fillOpacity={0.6}
                />
              ))}

              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
