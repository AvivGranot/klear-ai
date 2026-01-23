"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Bell,
  ChevronLeft,
  Clock,
  X,
} from "lucide-react"

type AlertSeverity = "critical" | "warning" | "info"
type AlertType = "spike" | "drop" | "anomaly" | "threshold"

interface Alert {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  type: AlertType
  timestamp: string
  metric?: string
  value?: number
  change?: number
  dismissed?: boolean
}

interface AlertsPanelProps {
  alerts: Alert[]
  title?: string
  onDismiss?: (id: string) => void
  onViewDetails?: (id: string) => void
  className?: string
  maxVisible?: number
}

export function AlertsPanel({
  alerts,
  title = "התראות ואנומליות",
  onDismiss,
  onViewDetails,
  className,
  maxVisible = 5,
}: AlertsPanelProps) {
  const visibleAlerts = alerts.filter((a) => !a.dismissed).slice(0, maxVisible)
  const hiddenCount = alerts.filter((a) => !a.dismissed).length - maxVisible

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: "text-red-500",
          badge: "bg-red-100 text-red-700",
        }
      case "warning":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          icon: "text-amber-500",
          badge: "bg-amber-100 text-amber-700",
        }
      case "info":
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: "text-blue-500",
          badge: "bg-blue-100 text-blue-700",
        }
    }
  }

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case "spike":
        return <TrendingUp className="w-4 h-4" />
      case "drop":
        return <TrendingDown className="w-4 h-4" />
      case "anomaly":
        return <AlertTriangle className="w-4 h-4" />
      case "threshold":
        return <Bell className="w-4 h-4" />
    }
  }

  const getSeverityLabel = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return "קריטי"
      case "warning":
        return "אזהרה"
      case "info":
        return "מידע"
    }
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card className={cn("border border-gray-200", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">אין התראות פעילות</p>
            <p className="text-xs text-gray-500 mt-1">המערכת פועלת כרגיל</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border border-gray-200", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            {title}
            {visibleAlerts.length > 0 && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                {visibleAlerts.length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {visibleAlerts.map((alert) => {
          const styles = getSeverityStyles(alert.severity)

          return (
            <div
              key={alert.id}
              className={cn(
                "p-3 rounded-lg border transition-colors cursor-pointer hover:shadow-sm",
                styles.bg,
                styles.border
              )}
              onClick={() => onViewDetails?.(alert.id)}
            >
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5", styles.icon)}>
                  {getTypeIcon(alert.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {alert.title}
                    </p>
                    <Badge variant="outline" className={cn("text-[10px]", styles.badge)}>
                      {getSeverityLabel(alert.severity)}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2">
                    {alert.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {alert.timestamp}
                    </span>

                    {alert.change !== undefined && (
                      <span className={cn(
                        "text-xs font-medium",
                        alert.change > 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {alert.change > 0 ? "+" : ""}{alert.change}%
                      </span>
                    )}
                  </div>
                </div>

                {onDismiss && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDismiss(alert.id)
                    }}
                    className="p-1 hover:bg-white/50 rounded transition-colors"
                    aria-label="סגור התראה"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {hiddenCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-600 hover:text-gray-900"
          >
            הצג עוד {hiddenCount} התראות
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Generate sample alerts for demo
export function generateSampleAlerts(): Alert[] {
  return [
    {
      id: "1",
      title: 'עלייה בכשלונות בנושא "תשלומים"',
      description: 'זוהתה עלייה של 45% בשיחות שנכשלו בנושא תשלומים ביום האחרון',
      severity: "critical",
      type: "spike",
      timestamp: "לפני שעה",
      metric: "failure_rate",
      value: 12,
      change: 45,
    },
    {
      id: "2",
      title: "ירידה באחוז האוטומציה",
      description: "שיעור האוטומציה בערוץ וואטסאפ ירד מ-78% ל-65% השבוע",
      severity: "warning",
      type: "drop",
      timestamp: "לפני 3 שעות",
      metric: "automation_rate",
      value: 65,
      change: -13,
    },
    {
      id: "3",
      title: "נושא חדש מזוהה",
      description: 'זוהו 15 שיחות חדשות בנושא "החזרות" שלא קיים במערכת',
      severity: "info",
      type: "anomaly",
      timestamp: "אתמול",
      metric: "new_topic",
      value: 15,
    },
  ]
}
