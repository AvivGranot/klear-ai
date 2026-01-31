'use client'

/**
 * Company Registration Page
 * Brian Chesky: Make signup feel like joining something special
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const INDUSTRIES = [
  { value: 'retail', label: 'קמעונאות ומכירות' },
  { value: 'food', label: 'מזון ומסעדנות' },
  { value: 'healthcare', label: 'בריאות ורווחה' },
  { value: 'education', label: 'חינוך והדרכה' },
  { value: 'technology', label: 'טכנולוגיה' },
  { value: 'finance', label: 'פיננסים וביטוח' },
  { value: 'real_estate', label: 'נדל"ן' },
  { value: 'hospitality', label: 'אירוח ותיירות' },
  { value: 'manufacturing', label: 'ייצור ותעשייה' },
  { value: 'other', label: 'אחר' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const validateStep1 = () => {
    if (!companyName.trim()) {
      setError('שם העסק נדרש')
      return false
    }
    if (companyName.length < 2) {
      setError('שם העסק חייב להכיל לפחות 2 תווים')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!ownerName.trim()) {
      setError('שם מלא נדרש')
      return false
    }
    if (!ownerEmail.trim()) {
      setError('אימייל נדרש')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      setError('אימייל לא תקין')
      return false
    }
    if (!ownerPassword) {
      setError('סיסמה נדרשת')
      return false
    }
    if (ownerPassword.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים')
      return false
    }
    if (ownerPassword !== confirmPassword) {
      setError('הסיסמאות לא תואמות')
      return false
    }
    if (!acceptTerms) {
      setError('יש לאשר את תנאי השימוש')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    setError(null)
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateStep2()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/companies/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          industry: industry || null,
          ownerName,
          ownerEmail,
          ownerPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בהרשמה')
      }

      // Redirect to onboarding or dashboard
      router.push(data.redirectTo || '/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהרשמה')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Klear<span className="text-emerald-400">AI</span>
          </h1>
          <p className="text-gray-400">צור חשבון חדש לעסק שלך</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                s <= step ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          {/* Error display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            /* Step 1: Company info */
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white">פרטי העסק</h2>
                <p className="text-gray-400 text-sm mt-1">ספר לנו קצת על העסק שלך</p>
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                  שם העסק *
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="לדוגמה: ג׳וליקה שוקולד"
                />
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-300 mb-2">
                  תחום פעילות
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="" className="bg-gray-800">בחר תחום...</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value} className="bg-gray-800">
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                המשך
                <span>←</span>
              </button>
            </div>
          ) : (
            /* Step 2: Owner account */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white">פרטי המנהל</h2>
                <p className="text-gray-400 text-sm mt-1">צור את חשבון המנהל הראשי</p>
              </div>

              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-300 mb-2">
                  שם מלא *
                </label>
                <input
                  id="ownerName"
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="ישראל ישראלי"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-300 mb-2">
                  אימייל *
                </label>
                <input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="you@company.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="ownerPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  סיסמה *
                </label>
                <input
                  id="ownerPassword"
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="לפחות 8 תווים"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  אימות סיסמה *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="הזן סיסמה שוב"
                  disabled={isLoading}
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-400">
                  אני מסכים ל
                  <Link href="/terms" className="text-emerald-400 hover:underline">תנאי השימוש</Link>
                  {' '}ול
                  <Link href="/privacy" className="text-emerald-400 hover:underline">מדיניות הפרטיות</Link>
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
                >
                  חזרה
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      יוצר חשבון...
                    </>
                  ) : (
                    <>
                      🚀
                      צור חשבון
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Trial info */}
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-sm text-emerald-300 text-center">
              ✨ 14 ימי ניסיון חינם • ללא כרטיס אשראי
            </p>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-4 text-sm text-gray-500">או</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          {/* Login link */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              כבר יש לך חשבון?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                התחבר
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
