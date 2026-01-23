"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer } from "recharts"

interface KPICardProps {
  label: string
  value: string | number
  delta?: number
  deltaLabel?: string
  trend?: number[]
  icon?: React.ReactNode
  className?: string
  invertDelta?: boolean // For metrics where lower is better (e.g., resolution time)
}

export function KPICard({
  label,
  value,
  delta,
  deltaLabel,
  trend,
  icon,
  className,
  invertDelta = false,
}: KPICardProps) {
  // Determine if delta is positive/negative/neutral
  const getDeltaType = () => {
    if (delta === undefined || delta === 0) return "neutral"
    const isPositive = invertDelta ? delta < 0 : delta > 0
    return isPositive ? "positive" : "negative"
  }

  const deltaType = getDeltaType()
  const displayDelta = delta !== undefined ? Math.abs(delta) : null

  // Prepare sparkline data
  const sparklineData = trend?.map((value, index) => ({ value, index })) || []

  return (
    <Card className={cn("border border-gray-200 hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Label */}
            <p className="text-sm font-medium text-[var(--text-muted)] mb-1">{label}</p>

            {/* Value */}
            <p className="text-2xl font-semibold text-[var(--text-primary)]">{value}</p>

            {/* Delta */}
            {displayDelta !== null && (
              <div className="flex items-center gap-1 mt-2">
                {deltaType === "positive" && (
                  <TrendingUp className="w-4 h-4 text-[var(--delta-positive)]" />
                )}
                {deltaType === "negative" && (
                  <TrendingDown className="w-4 h-4 text-[var(--delta-negative)]" />
                )}
                {deltaType === "neutral" && (
                  <Minus className="w-4 h-4 text-[var(--delta-neutral)]" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    deltaType === "positive" && "text-[var(--delta-positive)]",
                    deltaType === "negative" && "text-[var(--delta-negative)]",
                    deltaType === "neutral" && "text-[var(--delta-neutral)]"
                  )}
                >
                  {deltaType !== "neutral" && (delta! > 0 ? "+" : "")}
                  {delta?.toFixed(1)}%
                </span>
                {deltaLabel && (
                  <span className="text-xs text-[var(--text-muted)]">{deltaLabel}</span>
                )}
              </div>
            )}
          </div>

          {/* Icon or Sparkline */}
          <div className="w-20 h-12 flex items-center justify-center">
            {trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`sparkline-gradient-${label.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={deltaType === "negative" ? "var(--delta-negative)" : "var(--chart-primary)"}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor={deltaType === "negative" ? "var(--delta-negative)" : "var(--chart-primary)"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={deltaType === "negative" ? "var(--delta-negative)" : "var(--chart-primary)"}
                    strokeWidth={2}
                    fill={`url(#sparkline-gradient-${label.replace(/\s+/g, '-')})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : icon ? (
              <div className="w-10 h-10 bg-[var(--brand-muted)] rounded-lg flex items-center justify-center">
                {icon}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// KPI Grid component for consistent layout
interface KPIGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5 | 6
  className?: string
}

export function KPIGrid({ children, columns = 6, className }: KPIGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  )
}
