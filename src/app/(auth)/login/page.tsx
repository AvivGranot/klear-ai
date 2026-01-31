'use client'

/**
 * Login Page
 * Brian Chesky: Login should feel like coming home
 * Clean, fast, trustworthy
 */

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMagicLink, setShowMagicLink] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Get error from URL params
  const urlError = searchParams.get('error')
  const errorMessages: Record<string, string> = {
    invalid_token: 'הקישור לא תקף',
    expired_token: 'הקישור פג תוקף',
    invalid_user: 'משתמש לא נמצא',
    server_error: 'שגיאת שרת, אנא נסה שוב',
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בהתחברות')
      }

      router.push(data.redirectTo || '/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בשליחת הקישור')
      }

      setMagicLinkSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת הקישור')
    } finally {
      setIsLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold text-white mb-2">בדוק את האימייל שלך</h1>
          <p className="text-gray-300 mb-6">
            שלחנו לך קישור התחברות ל-<span className="text-white font-medium">{email}</span>
          </p>
          <p className="text-sm text-gray-400 mb-6">
            הקישור יפוג בעוד 15 דקות
          </p>
          <button
            onClick={() => {
              setMagicLinkSent(false)
              setShowMagicLink(false)
            }}
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            ← חזרה להתחברות
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Klear<span className="text-emerald-400">AI</span>
          </h1>
          <p className="text-gray-400">התחבר לחשבון שלך</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          {/* Error display */}
          {(error || urlError) && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error || errorMessages[urlError as string] || 'שגיאה לא ידועה'}
            </div>
          )}

          {showMagicLink ? (
            /* Magic Link Form */
            <form onSubmit={handleMagicLink} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  אימייל
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    שולח...
                  </>
                ) : (
                  <>
                    <span>✉️</span>
                    שלח קישור התחברות
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowMagicLink(false)}
                className="w-full text-center text-gray-400 hover:text-white transition-colors text-sm"
              >
                התחבר עם סיסמה
              </button>
            </form>
          ) : (
            /* Password Form */
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  אימייל
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  סיסמה
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    מתחבר...
                  </>
                ) : (
                  'התחבר'
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowMagicLink(true)}
                className="w-full text-center text-gray-400 hover:text-white transition-colors text-sm"
              >
                התחבר עם קישור אימייל (ללא סיסמה)
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-4 text-sm text-gray-500">או</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          {/* Register link */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              אין לך חשבון?{' '}
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
                צור חשבון חדש
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  )
}

// Loading fallback for Suspense
function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="animate-pulse text-white text-xl">טוען...</div>
    </div>
  )
}

// Export with Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}
