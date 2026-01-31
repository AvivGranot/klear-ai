'use client'

/**
 * Login Page
 * Boris Cherny Philosophy: Type-safe, clean, predictable
 * - Light theme for maximum readability
 * - Clear visual hierarchy
 * - Obvious affordances
 * - Helpful error messages
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
  const [showPassword, setShowPassword] = useState(false)

  // Get error from URL params
  const urlError = searchParams.get('error')
  const errorMessages: Record<string, string> = {
    invalid_token: 'הקישור לא תקף או שפג תוקפו',
    expired_token: 'הקישור פג תוקף, בקש קישור חדש',
    invalid_user: 'משתמש לא נמצא במערכת',
    server_error: 'שגיאת שרת, נסה שוב בעוד כמה שניות',
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
        // More helpful error messages
        if (response.status === 401) {
          throw new Error('אימייל או סיסמה לא נכונים')
        }
        if (response.status === 429) {
          throw new Error('יותר מדי ניסיונות, נסה שוב בעוד דקה')
        }
        if (response.status === 500) {
          throw new Error('שגיאת שרת - ייתכן שהמשתמש לא קיים עדיין')
        }
        throw new Error(data.error || 'שגיאה בהתחברות')
      }

      router.push(data.redirectTo || '/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות')
    } finally {
      setIsLoading(false)
    }
  }

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative min-h-screen flex">
        {/* Left Side - Branding (desktop only) */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-center p-12 xl:p-20">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <span className="text-3xl font-bold text-white">Klear<span className="text-emerald-400">AI</span></span>
            </Link>

            <h1 className="text-4xl font-bold text-white leading-tight mb-6">
              מאגר ידע חכם
              <br />
              <span className="text-emerald-400">לעסק שלך</span>
            </h1>

            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              תן לעובדים שלך תשובות מיידיות לכל שאלה.
              <br />
              בלי לחכות, בלי להתקשר, בלי לחפש.
            </p>

            <div className="space-y-4">
              {[
                { icon: '⚡', text: 'מענה אוטומטי 24/7' },
                { icon: '📚', text: 'מאגר ידע מותאם אישית' },
                { icon: '📊', text: 'ניתוח שיחות ותובנות' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-200">
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className="text-2xl font-bold text-slate-900">Klear<span className="text-emerald-500">AI</span></span>
              </Link>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">שלום! 👋</h2>
                <p className="text-slate-500">התחבר לחשבון שלך</p>
              </div>

              {/* Error Display */}
              {(error || urlError) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <div>
                    <p className="text-red-700 text-sm font-medium">
                      {error || errorMessages[urlError as string] || 'שגיאה לא ידועה'}
                    </p>
                    {error?.includes('שרת') && (
                      <p className="text-red-600 text-xs mt-1">
                        אם אין לך חשבון עדיין,{' '}
                        <Link href="/register" className="underline font-medium">צור חשבון חדש</Link>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handlePasswordLogin} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    אימייל
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    סיסמה
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 pl-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      מתחבר...
                    </>
                  ) : (
                    'התחבר'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-slate-200"></div>
                <span className="px-4 text-sm text-slate-400">או</span>
                <div className="flex-1 border-t border-slate-200"></div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-slate-600 text-sm">
                  אין לך חשבון?{' '}
                  <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                    צור חשבון חדש
                  </Link>
                </p>
              </div>
            </div>

            {/* Demo Credentials - helpful for testing */}
            <div className="mt-6 p-4 bg-slate-100 rounded-xl">
              <p className="text-xs text-slate-500 text-center mb-2">🧪 פרטי כניסה לדמו:</p>
              <div className="flex justify-center gap-4 text-xs">
                <code className="bg-white px-2 py-1 rounded text-slate-700">hello@klear.ai</code>
                <code className="bg-white px-2 py-1 rounded text-slate-700">12345678</code>
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <Link href="/" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">
                ← חזרה לדף הבית
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading fallback for Suspense
function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 text-slate-600">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        טוען...
      </div>
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
