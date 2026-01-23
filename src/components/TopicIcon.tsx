"use client"

import {
  Truck,
  ClipboardList,
  Package,
  CreditCard,
  Star,
  FileText,
  AlertTriangle,
  Users,
  CalendarDays,
  Gift,
  MessageCircle,
  LucideIcon,
} from "lucide-react"
import type { TopicIconName } from "@/data/jolika-data"

// Map icon names to Lucide components
const iconMap: Record<TopicIconName, LucideIcon> = {
  Truck,
  ClipboardList,
  Package,
  CreditCard,
  Star,
  FileText,
  AlertTriangle,
  Users,
  CalendarDays,
  Gift,
  MessageCircle,
}

interface TopicIconProps {
  name: TopicIconName
  className?: string
  size?: number
}

export function TopicIcon({ name, className, size }: TopicIconProps) {
  const Icon = iconMap[name] || MessageCircle
  return <Icon className={className} size={size} />
}

// Get the icon component directly (for use in icon props)
export function getTopicIcon(name: TopicIconName): LucideIcon {
  return iconMap[name] || MessageCircle
}
