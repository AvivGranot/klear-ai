"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Settings,
  Check,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getAutomationPatterns, conversations } from "@/data/gas-station-data"

interface Notification {
  id: string
  type: "escalation" | "automation" | "system" | "info"
  title: string
  message: string
  timestamp: Date
  read: boolean
  href?: string
}

// Generate mock notifications based on real data
function generateNotifications(): Notification[] {
  const notifications: Notification[] = []
  const now = new Date()

  // Pending automations notification
  const pendingAutomations = getAutomationPatterns().length
  if (pendingAutomations > 0) {
    notifications.push({
      id: "automation-pending",
      type: "automation",
      title: "תבניות אוטומציה ממתינות",
      message: `${pendingAutomations} תבניות חדשות ממתינות לאישורך`,
      timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
      read: false,
      href: "/dashboard/knowledge#automations",
    })
  }

  // Recent escalations (simulated from conversations)
  const recentConversations = conversations.slice(-5)
  recentConversations.forEach((conv, i) => {
    if (conv.question.includes("?") || conv.question.includes("בעיה")) {
      notifications.push({
        id: `escalation-${i}`,
        type: "escalation",
        title: "שאלה חדשה",
        message: conv.question.slice(0, 50) + "...",
        timestamp: new Date(now.getTime() - (i + 1) * 60 * 60 * 1000),
        read: i > 1,
        href: "/dashboard/conversations",
      })
    }
  })

  // System notification
  notifications.push({
    id: "system-welcome",
    type: "system",
    title: "ברוכים הבאים ל-Klear AI",
    message: "המערכת מוכנה לשימוש. צפו במדריך למתחילים.",
    timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    read: true,
  })

  // Info notification
  notifications.push({
    id: "info-update",
    type: "info",
    title: "עדכון חדש זמין",
    message: "גרסה 1.1.0 כוללת חיפוש משופר ואוטומציות חדשות",
    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    read: true,
  })

  return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

function formatNotificationTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "עכשיו"
  if (minutes < 60) return `לפני ${minutes} דקות`
  if (hours < 24) return `לפני ${hours} שעות`
  if (days === 1) return "אתמול"
  return `לפני ${days} ימים`
}

const typeConfig = {
  escalation: {
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  automation: {
    icon: Zap,
    color: "text-[var(--klear-green)]",
    bgColor: "bg-[rgba(37,211,102,0.1)]",
    borderColor: "border-[var(--klear-green)]",
  },
  system: {
    icon: CheckCircle,
    color: "text-[var(--klear-green)]",
    bgColor: "bg-[rgba(37,211,102,0.1)]",
    borderColor: "border-[var(--klear-green)]",
  },
  info: {
    icon: Info,
    color: "text-[var(--klear-green)]",
    bgColor: "bg-[rgba(37,211,102,0.1)]",
    borderColor: "border-[var(--klear-green)]",
  },
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNotifications(generateNotifications())
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
            style={{ direction: "rtl" }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">התראות</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                    {unreadCount} חדשות
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    title="סמן הכל כנקרא"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">אין התראות חדשות</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => {
                    const config = typeConfig[notification.type]
                    const Icon = config.icon

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, height: 0 }}
                        className={cn(
                          "px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer relative group",
                          !notification.read && "bg-blue-50/50"
                        )}
                        onClick={() => {
                          markAsRead(notification.id)
                          if (notification.href) {
                            window.location.href = notification.href
                            setIsOpen(false)
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                              config.bgColor
                            )}
                          >
                            <Icon className={cn("w-4 h-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </span>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {formatNotificationTime(notification.timestamp)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeNotification(notification.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all self-start"
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => {
                    window.location.href = "/dashboard/settings?tab=notifications"
                    setIsOpen(false)
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors w-full text-center"
                >
                  הגדרות התראות
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
