"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Settings,
  Users,
  BarChart3,
  Menu,
  X,
  LogOut,
  ExternalLink,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlobalSearch } from "@/components/dashboard/GlobalSearch"
import { NotificationDropdown } from "@/components/dashboard/NotificationDropdown"

interface SidebarItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

interface SidebarSection {
  title: string | null
  items: SidebarItem[]
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Static company data - no API needed
  const company = {
    name: "תחנת דלק אמיר בני ברק",
    id: "amir-gas-station"
  }

  // Build sidebar config with badges
  const sidebarConfig: SidebarSection[] = [
    {
      title: null,
      items: [
        { icon: LayoutDashboard, label: "סקירה כללית", href: "/dashboard" },
      ],
    },
    {
      title: "ניהול",
      items: [
        { icon: BarChart3, label: "אנליטיקה", href: "/dashboard/analytics" },
        { icon: BookOpen, label: "מאגר ידע", href: "/dashboard/knowledge" },
        { icon: MessageSquare, label: "שיחות", href: "/dashboard/conversations" },
      ],
    },
    {
      title: "מערכת",
      items: [
        { icon: Users, label: "משתמשים", href: "/dashboard/users" },
        { icon: Settings, label: "הגדרות", href: "/dashboard/settings" },
      ],
    },
  ]

  return (
    <div className="flex h-screen aman-bg" dir="rtl">
      {/* Subtle grain overlay for premium feel */}
      <div className="aman-grain" aria-hidden="true" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 aman-sidebar border-l border-[var(--aman-sand)]">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-[var(--aman-sand)]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--aman-charcoal)] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-[var(--aman-cream)] font-semibold text-sm tracking-wide">K</span>
            </div>
            <span className="font-semibold text-[var(--aman-charcoal)] tracking-tight">Klear AI</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {sidebarConfig.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-5">
              {section.title && (
                <p className="px-4 mb-2 text-[11px] font-medium text-[var(--aman-warm-gray)] uppercase tracking-widest">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5 px-2">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300",
                          isActive
                            ? "bg-[var(--aman-sand)]/60 text-[var(--aman-charcoal)] font-medium"
                            : "text-[var(--aman-stone)] hover:bg-[var(--aman-sand)]/40 hover:text-[var(--aman-charcoal)]"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-[var(--aman-charcoal)]" : "text-[var(--aman-warm-gray)]")} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="w-5 h-5 rounded-full bg-[var(--aman-charcoal)] text-[var(--aman-cream)] text-xs flex items-center justify-center font-medium">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--aman-sand)] space-y-2">
          <Link href={`/chat/${company.id}`} target="_blank">
            <div className="flex items-center justify-center gap-2 bg-[var(--aman-charcoal)] text-[var(--aman-cream)] py-2.5 rounded-lg hover:bg-[var(--aman-black)] transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-md">
              פתח צ׳אט עובדים
              <ExternalLink className="w-4 h-4" />
            </div>
          </Link>
          <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--aman-stone)] hover:bg-[var(--aman-sand)]/40 hover:text-[var(--aman-charcoal)] rounded-lg transition-all duration-300">
            <HelpCircle className="w-4 h-4" />
            <span>עזרה</span>
          </button>
          <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--aman-stone)] hover:bg-[var(--aman-sand)]/40 hover:text-[var(--aman-charcoal)] rounded-lg transition-all duration-300">
            <LogOut className="w-4 h-4" />
            <span>התנתק</span>
          </button>
          <p className="text-[11px] text-center text-[var(--aman-warm-gray)] pt-2 tracking-wide">v1.0.0</p>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[var(--aman-black)]/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-64 aman-sidebar shadow-2xl lg:hidden">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--aman-sand)]">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[var(--aman-charcoal)] rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-[var(--aman-cream)] font-semibold text-sm tracking-wide">K</span>
                  </div>
                  <span className="font-semibold text-[var(--aman-charcoal)]">Klear AI</span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-[var(--aman-sand)]/40 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--aman-stone)]" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4">
                {sidebarConfig.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-5">
                    {section.title && (
                      <p className="px-4 mb-2 text-[11px] font-medium text-[var(--aman-warm-gray)] uppercase tracking-widest">
                        {section.title}
                      </p>
                    )}
                    <div className="space-y-0.5 px-2">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <div
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300",
                                isActive
                                  ? "bg-[var(--aman-sand)]/60 text-[var(--aman-charcoal)] font-medium"
                                  : "text-[var(--aman-stone)] hover:bg-[var(--aman-sand)]/40 hover:text-[var(--aman-charcoal)]"
                              )}
                            >
                              <item.icon className={cn("w-5 h-5", isActive ? "text-[var(--aman-charcoal)]" : "text-[var(--aman-warm-gray)]")} />
                              <span className="flex-1">{item.label}</span>
                              {item.badge && (
                                <span className="w-5 h-5 rounded-full bg-[var(--aman-charcoal)] text-[var(--aman-cream)] text-xs flex items-center justify-center font-medium">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="p-3 border-t border-[var(--aman-sand)]">
                <Link href={`/chat/${company.id}`} target="_blank">
                  <div className="flex items-center justify-center gap-2 w-full bg-[var(--aman-charcoal)] text-[var(--aman-cream)] py-2.5 rounded-lg text-sm font-medium shadow-sm">
                    פתח צ׳אט
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </Link>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="h-14 aman-header border-b border-[var(--aman-sand)] flex items-center justify-between px-4 relative z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-[var(--aman-sand)]/40 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-[var(--aman-stone)]" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-[var(--aman-taupe)]">◻</span>
              <span className="font-medium text-[var(--aman-charcoal)]">
                {pathname === "/dashboard" && "סקירה כללית"}
                {pathname === "/dashboard/conversations" && "שיחות"}
                {pathname === "/dashboard/knowledge" && "מאגר ידע"}
                {pathname === "/dashboard/analytics" && "אנליטיקה"}
                {pathname === "/dashboard/users" && "משתמשים"}
                {pathname === "/dashboard/settings" && "הגדרות"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Global Search */}
            <GlobalSearch />

            {/* Actions */}
            <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 text-[var(--aman-stone)] border-[var(--aman-sand)] hover:bg-[var(--aman-sand)]/40 hover:text-[var(--aman-charcoal)] hover:border-[var(--aman-taupe)]">
              <HelpCircle className="w-4 h-4" />
              עזרה
            </Button>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User */}
            <div className="flex items-center gap-2 bg-[var(--aman-sand)]/50 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-[var(--aman-sand)] transition-all duration-300">
              <div className="w-7 h-7 rounded-full bg-[var(--aman-taupe)] flex items-center justify-center text-[var(--aman-charcoal)] font-medium text-sm">
                מ
              </div>
              <span className="hidden sm:block text-sm font-medium text-[var(--aman-charcoal)]">מנהל</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 relative z-0">
          {children}
        </main>
      </div>
    </div>
  )
}
