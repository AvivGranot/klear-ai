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
    <div className="flex h-screen bg-white" dir="rtl">
      {/* Desktop Sidebar (PRD) */}
      <aside className="hidden lg:flex flex-col w-60 bg-[var(--aman-card-white)] border-l border-[var(--aman-border)]">
        {/* Logo */}
        <div className="h-14 flex items-center px-6 border-b border-[var(--aman-border)]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--klear-green)] flex items-center justify-center">
              <span className="text-white font-medium text-sm tracking-[2px]">K</span>
            </div>
            <span className="font-serif text-lg tracking-[3px] uppercase text-[var(--aman-text-primary)]">Klear</span>
          </Link>
        </div>

        {/* Navigation (PRD) */}
        <nav className="flex-1 overflow-y-auto py-6">
          {sidebarConfig.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              {section.title && (
                <p className="px-6 mb-3 text-[11px] font-normal text-[var(--aman-text-secondary)] uppercase tracking-[2px]">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-6 py-3 text-sm tracking-[0.5px] transition-all duration-200",
                          isActive
                            ? "bg-[var(--aman-bg-cream)] text-[var(--aman-text-primary)]"
                            : "text-[var(--aman-text-secondary)] hover:text-[var(--aman-text-primary)] hover:bg-[var(--aman-bg-cream)]"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", isActive ? "text-[var(--aman-text-primary)]" : "text-[var(--aman-text-secondary)]")} strokeWidth={1.5} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="w-5 h-5 bg-[var(--aman-text-primary)] text-[var(--aman-bg-cream)] text-xs flex items-center justify-center">
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

        {/* Footer (PRD + Klear Green) */}
        <div className="p-4 border-t border-[var(--aman-border)] space-y-3">
          <Link href={`/chat/${company.id}`} target="_blank">
            <div className="flex items-center justify-center gap-2 bg-[var(--klear-green)] text-white py-3.5 hover:bg-[var(--klear-green-dark)] transition-all duration-300 text-sm font-medium tracking-[0.8px] hover:shadow-lg hover:shadow-[rgba(37,211,102,0.3)]">
              פתח צ׳אט עובדים
              <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
            </div>
          </Link>
          <button className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[var(--aman-text-secondary)] hover:text-[var(--aman-text-primary)] hover:bg-[var(--aman-bg-cream)] transition-all duration-200">
            <HelpCircle className="w-4 h-4" strokeWidth={1.5} />
            <span>עזרה</span>
          </button>
          <button className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[var(--aman-text-secondary)] hover:text-[var(--aman-text-primary)] hover:bg-[var(--aman-bg-cream)] transition-all duration-200">
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            <span>התנתק</span>
          </button>
          <p className="text-[11px] text-center text-[var(--aman-text-muted)] pt-2 tracking-[2px] uppercase">v1.0.0</p>
        </div>
      </aside>

      {/* Mobile Sidebar (PRD) */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[var(--aman-text-primary)]/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-64 bg-[var(--aman-card-white)] shadow-2xl lg:hidden">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--aman-border)]">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--klear-green)] flex items-center justify-center">
                    <span className="text-white font-medium text-sm tracking-[2px]">K</span>
                  </div>
                  <span className="font-serif text-lg tracking-[3px] uppercase text-[var(--aman-text-primary)]">Klear</span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-[var(--aman-bg-cream)] transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--aman-text-secondary)]" strokeWidth={1.5} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-6">
                {sidebarConfig.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-6">
                    {section.title && (
                      <p className="px-6 mb-3 text-[11px] font-normal text-[var(--aman-text-secondary)] uppercase tracking-[2px]">
                        {section.title}
                      </p>
                    )}
                    <div className="space-y-1">
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
                                "flex items-center gap-3 px-6 py-3 text-sm tracking-[0.5px] transition-all duration-200",
                                isActive
                                  ? "bg-[var(--aman-bg-cream)] text-[var(--aman-text-primary)]"
                                  : "text-[var(--aman-text-secondary)] hover:text-[var(--aman-text-primary)] hover:bg-[var(--aman-bg-cream)]"
                              )}
                            >
                              <item.icon className={cn("w-5 h-5", isActive ? "text-[var(--aman-text-primary)]" : "text-[var(--aman-text-secondary)]")} strokeWidth={1.5} />
                              <span className="flex-1">{item.label}</span>
                              {item.badge && (
                                <span className="w-5 h-5 bg-[var(--aman-text-primary)] text-[var(--aman-bg-cream)] text-xs flex items-center justify-center">
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

              <div className="p-4 border-t border-[var(--aman-border)]">
                <Link href={`/chat/${company.id}`} target="_blank">
                  <div className="flex items-center justify-center gap-2 w-full bg-[var(--klear-green)] text-white py-3.5 text-sm font-medium tracking-[0.8px] hover:bg-[var(--klear-green-dark)] transition-colors">
                    פתח צ׳אט
                    <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
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
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 relative z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-[var(--aman-card-white)] transition-colors"
            >
              <Menu className="w-5 h-5 text-[var(--aman-text-secondary)]" strokeWidth={1.5} />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <span className="text-[var(--aman-text-muted)]">/</span>
              <span className="text-[var(--aman-text-primary)] tracking-[0.5px]">
                {pathname === "/dashboard" && "סקירה כללית"}
                {pathname === "/dashboard/conversations" && "שיחות"}
                {pathname === "/dashboard/knowledge" && "מאגר ידע"}
                {pathname === "/dashboard/analytics" && "אנליטיקה"}
                {pathname === "/dashboard/users" && "משתמשים"}
                {pathname === "/dashboard/settings" && "הגדרות"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search */}
            <GlobalSearch />

            {/* Actions */}
            <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 text-[var(--aman-text-secondary)] border-[var(--aman-text-primary)] hover:bg-[var(--aman-text-primary)] hover:text-[var(--aman-bg-cream)] rounded-none transition-colors duration-300">
              <HelpCircle className="w-4 h-4" strokeWidth={1.5} />
              עזרה
            </Button>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User */}
            <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--aman-card-white)] transition-colors duration-200">
              <div className="w-8 h-8 bg-[var(--aman-border)] flex items-center justify-center text-[var(--aman-text-primary)] font-medium text-sm">
                מ
              </div>
              <span className="hidden sm:block text-sm text-[var(--aman-text-primary)] tracking-[0.5px]">מנהל</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 relative z-0">
          {children}
        </main>
      </div>
    </div>
  )
}
