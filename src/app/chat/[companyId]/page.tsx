"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ChatInterface } from "@/components/chat/ChatInterface"

interface Company {
  id: string
  name: string
  logo: string | null
}

interface User {
  id: string
  name: string
  phone: string
}

// Static company data for when database is unavailable
const STATIC_COMPANIES: Record<string, Company> = {
  "amir-gas-station": {
    id: "amir-gas-station",
    name: "תחנת דלק אמיר בני ברק",
    logo: null,
  },
  "demo-company-001": {
    id: "demo-company-001",
    name: "חברת הדגמה",
    logo: null,
  },
}

export default function ChatPage() {
  const params = useParams()
  const companyId = params.companyId as string

  const [company, setCompany] = useState<Company | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // First try to use static company data
        const staticCompany = STATIC_COMPANIES[companyId]

        if (staticCompany) {
          setCompany(staticCompany)

          // Create a session user (no database needed)
          const sessionUser: User = {
            id: `session-${Date.now()}`,
            name: "משתמש אורח",
            phone: `session-${Date.now()}`,
          }
          setUser(sessionUser)
          setLoading(false)
          return
        }

        // Fallback: Try API for other companies
        const companyRes = await fetch(`/api/companies?id=${companyId}`)
        if (!companyRes.ok) throw new Error("Company not found")
        const companyData = await companyRes.json()
        setCompany(companyData.company)

        // Get or create demo user for this session
        const storedUserId = localStorage.getItem(`klear_user_${companyId}`)

        if (storedUserId) {
          const userRes = await fetch(`/api/users?id=${storedUserId}`)
          if (userRes.ok) {
            const userData = await userRes.json()
            setUser(userData.user)
          }
        }

        if (!user) {
          // Create a session user
          const userRes = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: `session-${Date.now()}`,
              name: "משתמש אורח",
              role: "employee",
              companyId,
            }),
          })

          if (userRes.ok) {
            const userData = await userRes.json()
            setUser(userData.user)
            localStorage.setItem(`klear_user_${companyId}`, userData.user.id)
          }
        }
      } catch (e) {
        console.error("Error loading data:", e)

        // Final fallback: use static data anyway
        const staticCompany = STATIC_COMPANIES[companyId] || {
          id: companyId,
          name: "Klear AI",
          logo: null,
        }
        setCompany(staticCompany)
        setUser({
          id: `session-${Date.now()}`,
          name: "משתמש אורח",
          phone: `session-${Date.now()}`,
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [companyId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E5DDD5]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#25D366] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    )
  }

  if (error || !company || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E5DDD5]">
        <div className="bg-white rounded-lg p-8 shadow-lg text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">שגיאה</h2>
          <p className="text-gray-600 mb-4">{error || "לא ניתן לטעון את הצ'אט"}</p>
          <a
            href="/"
            className="inline-block bg-[#25D366] text-white px-6 py-2 rounded-full hover:bg-[#128C7E] transition-colors"
          >
            חזרה לדף הבית
          </a>
        </div>
      </div>
    )
  }

  return (
    <ChatInterface
      companyId={company.id}
      companyName={company.name}
      companyLogo={company.logo}
      userId={user.id}
    />
  )
}
