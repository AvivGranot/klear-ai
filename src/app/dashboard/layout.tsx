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
  Menu,
  X,
  LogOut,
  ExternalLink,
  HelpCircle,
  Search,
  Bell,
  ChevronDown,
  Sparkles,
} from "lucide-react"

const navigation = [
  { name: "סקירה כללית", href: "/dashboard", icon: LayoutDashboard },
  { name: "צ׳אט AI", href: "/dashboard/chat", icon: Sparkles, highlight: true },
  { name: "מאגר ידע", href: "/dashboard/knowledge", icon: BookOpen },
  { name: "שיחות", href: "/dashboard/conversations", icon: MessageSquare },
  { name: "משתמשים", href: "/dashboard/users", icon: Users },
  { name: "הגדרות", href: "/dashboard/settings", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const company = {
    name: "ג'וליקה שוקולד",
    id: "jolika-chocolate"
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-white border-l border-gray-200 transform transition-transform duration-200 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#25D366] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg">Klear</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const isHighlight = 'highlight' in item && item.highlight
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#25D366]/10 text-[#25D366]"
                      : isHighlight
                        ? "text-[#25D366] bg-[#25D366]/5 hover:bg-[#25D366]/10"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive || isHighlight ? "text-[#25D366]" : "text-gray-400")} />
                  {item.name}
                  {isHighlight && !isActive && (
                    <span className="mr-auto text-[10px] px-1.5 py-0.5 bg-[#25D366] text-white rounded">חדש</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-100 space-y-3">
            <Link
              href={`/chat/${company.id}`}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#128C7E] transition-colors"
            >
              פתח צ׳אט עובדים
              <ExternalLink className="w-4 h-4" />
            </Link>

            <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <HelpCircle className="w-4 h-4" />
              עזרה ותמיכה
            </button>

            <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              התנתק
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pr-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg w-64">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש..."
                className="bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 w-full"
              />
              <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 bg-white rounded text-[10px] text-gray-400 border border-gray-200">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#25D366] rounded-full" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">מ</span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">מנהל</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">מנהל</p>
                      <p className="text-xs text-gray-500">{company.name}</p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      הגדרות חשבון
                    </Link>
                    <button className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      התנתק
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
