"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { safeFetch } from "@/lib/safeFetch"
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
  ChevronLeft,
  Bell,
  Search,
  ExternalLink,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ElevenLabs-style sidebar with sections
const sidebarConfig = [
  {
    title: null,
    items: [
      { icon: LayoutDashboard, label: "סקירה כללית", href: "/dashboard" },
    ],
  },
  {
    title: "ניהול",
    items: [
      { icon: MessageSquare, label: "שיחות", href: "/dashboard/conversations" },
      { icon: BookOpen, label: "מאגר ידע", href: "/dashboard/knowledge" },
      { icon: BarChart3, label: "אנליטיקה", href: "/dashboard/analytics" },
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [company, setCompany] = useState<{ name: string; id: string } | null>(null)

  useEffect(() => {
    async function loadCompany() {
      try {
        const data = await safeFetch<{ seeded: boolean; companyName: string; companyId: string }>("/api/seed")
        if (data?.seeded) {
          setCompany({ name: data.companyName || "Demo Company", id: data.companyId || "demo" })
        }
      } catch (e) {
        console.error("Failed to load company:", e)
      }
    }
    loadCompany()
  }, [])

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-l border-gray-200">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-semibold text-gray-900">Klear AI</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {sidebarConfig.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-4">
              {section.title && (
                <p className="px-4 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
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
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          isActive
                            ? "bg-gray-100 text-gray-900 font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", isActive ? "text-gray-900" : "text-gray-400")} />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          {company && (
            <Link href={`/chat/${company.id}`} target="_blank">
              <div className="flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                פתח צ'אט עובדים
                <ExternalLink className="w-4 h-4" />
              </div>
            </Link>
          )}
          <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <HelpCircle className="w-4 h-4" />
            <span>עזרה</span>
          </button>
          <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            <span>התנתק</span>
          </button>
          <p className="text-xs text-center text-gray-400 pt-2">v1.0.0</p>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-xl lg:hidden">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">K</span>
                  </div>
                  <span className="font-semibold">Klear AI</span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4">
                {sidebarConfig.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-4">
                    {section.title && (
                      <p className="px-4 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
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
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                isActive
                                  ? "bg-gray-100 text-gray-900 font-medium"
                                  : "text-gray-600 hover:bg-gray-50"
                              )}
                            >
                              <item.icon className="w-5 h-5" />
                              {item.label}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="p-3 border-t border-gray-200">
                {company && (
                  <Link href={`/chat/${company.id}`} target="_blank">
                    <div className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm">
                      פתח צ'אט
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-gray-400">◻</span>
              <span className="font-medium text-gray-900">
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
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 w-64">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש..."
                className="bg-transparent border-0 outline-none text-sm flex-1 placeholder-gray-400"
              />
              <kbd className="text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                ⌘K
              </kbd>
            </div>

            {/* Actions */}
            <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 text-gray-600">
              <HelpCircle className="w-4 h-4" />
              עזרה
            </Button>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1 cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm">
                מ
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">מנהל</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
