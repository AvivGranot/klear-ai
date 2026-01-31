'use client'

/**
 * Company Registration Page
 * Joe Gebbia Philosophy: Build trust through design
 * - Progressive disclosure (one step at a time)
 * - Clear value proposition at every step
 * - Emotional connection through copy
 * - Zero friction, maximum delight
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const INDUSTRIES = [
  { value: 'retail', label: 'קמעונאות ומכירות', icon: '🛍️' },
  { value: 'food', label: 'מזון ומסעדנות', icon: '🍽️' },
  { value: 'healthcare', label: 'בריאות ורווחה', icon: '🏥' },
  { value: 'education', label: 'חינוך והדרכה', icon: '📚' },
  { value: 'technology', label: 'טכנולוגיה', icon: '💻' },
  { value: 'finance', label: 'פיננסים וביטוח', icon: '💰' },
  { value: 'real_estate', label: 'נדל"ן', icon: '🏠' },
  { value: 'hospitality', label: 'אירוח ותיירות', icon: '✈️' },
  { value: 'manufacturing', label: 'ייצור ותעשייה', icon: '🏭' },
  { value: 'services', label: 'שירותים', icon: '🤝' },
  { value: 'other', label: 'אחר', icon: '📋' },
]

const BENEFITS = [
  { icon: '⚡', text: 'מענה אוטומטי 24/7' },
  { icon: '📚', text: 'מאגר ידע חכם' },
  { icon: '📊', text: 'ניתוח שיחות' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      setError('איך קוראים לעסק שלך?')
      return false
    }
    if (companyName.length < 2) {
      setError('שם העסק חייב להכיל לפחות 2 תווים')
      return false
    }
    setError(null)
    return true
  }

  const validateStep2 = () => {
    if (!ownerName.trim()) {
      setError('מה השם שלך?')
      return false
    }
    if (!ownerEmail.trim()) {
      setError('לאן נשלח לך את פרטי הגישה?')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      setError('כתובת האימייל לא נראית תקינה')
      return false
    }
    if (!ownerPassword) {
      setError('בחר סיסמה לחשבון שלך')
      return false
    }
    if (ownerPassword.length < 8) {
      setError('הסיסמה צריכה להכיל לפחות 8 תווים')
      return false
    }
    if (ownerPassword !== confirmPassword) {
      setError('הסיסמאות לא תואמות, נסה שוב')
      return false
    }
    if (!acceptTerms) {
      setError('צריך לאשר את תנאי השימוש כדי להמשיך')
      return false
    }
    setError(null)
    return true
  }

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return

    setIsLoading(true)
    setError(null)

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
        throw new Error(data.error || 'משהו השתבש, ננסה שוב?')
      }

      router.push(data.redirectTo || '/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'משהו השתבש, ננסה שוב?')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyNUQzNjYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

      <div className="relative min-h-screen flex">
        {/* Left Side - Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 xl:p-20">
          <div className="max-w-lg">
            <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <span className="text-3xl font-bold text-white">Klear<span className="text-emerald-400">AI</span></span>
            </Link>

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              העסק שלך זכאי ל
              <span className="text-emerald-400">מענה אוטומטי</span>
              {' '}חכם
            </h1>

            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              תן לעובדים שלך תשובות מיידיות לכל שאלה, 24/7.
              <br />
              בלי לחכות, בלי להתקשר, בלי לחפש.
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              {BENEFITS.map((benefit, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-xl">
                    {benefit.icon}
                  </div>
                  <span className="text-slate-200">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Social Proof */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-slate-400 text-sm mb-4">מצטרפים לעסקים שכבר חוסכים שעות בשבוע</p>
              <div className="flex items-center gap-6">
                <div className="flex -space-x-2 space-x-reverse">
                  {['🏪', '🍕', '🏥', '📚'].map((emoji, i) => (
                    <div key={i} className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-800 text-lg">
                      {emoji}
                    </div>
                  ))}
                </div>
                <span className="text-emerald-400 text-sm font-medium">+50 עסקים פעילים</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className="text-2xl font-bold text-white">Klear<span className="text-emerald-400">AI</span></span>
              </Link>
            </div>

            {/* Card */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-black/20">
              {/* Progress */}
              <div className="flex items-center gap-3 mb-8">
                <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {step === 1 ? (
                /* Step 1: Company */
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">ברוך הבא! 👋</h2>
                    <p className="text-slate-500">בוא נתחיל עם כמה פרטים על העסק</p>
                  </div>

                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
                      שם העסק
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="לדוגמה: קפה נעמן"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-2">
                      תחום פעילות
                    </label>
                    <select
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                    >
                      <option value="">בחר תחום (אופציונלי)</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind.value} value={ind.value}>
                          {ind.icon} {ind.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                  >
                    המשך
                    <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              ) : (
                /* Step 2: Account */
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-bold text-slate-900">כמעט שם! 🎉</h2>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-sm text-slate-500 hover:text-slate-700"
                      >
                        ← חזרה
                      </button>
                    </div>
                    <p className="text-slate-500">פרטי הכניסה לחשבון המנהל</p>
                  </div>

                  <div>
                    <label htmlFor="ownerName" className="block text-sm font-medium text-slate-700 mb-2">
                      השם שלך
                    </label>
                    <input
                      id="ownerName"
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="ישראל ישראלי"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="ownerEmail" className="block text-sm font-medium text-slate-700 mb-2">
                      אימייל
                    </label>
                    <input
                      id="ownerEmail"
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="you@company.com"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label htmlFor="ownerPassword" className="block text-sm font-medium text-slate-700 mb-2">
                      סיסמה
                    </label>
                    <div className="relative">
                      <input
                        id="ownerPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                        className="w-full px-4 py-3.5 pl-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="לפחות 8 תווים"
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

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                      אימות סיסמה
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3.5 pl-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="הזן שוב"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="peer sr-only"
                        disabled={isLoading}
                      />
                      <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all" />
                      <svg
                        className="absolute inset-0 w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                      קראתי ואני מסכים/ה ל
                      <Link href="/terms" className="text-emerald-600 hover:underline">תנאי השימוש</Link>
                      {' '}ול
                      <Link href="/privacy" className="text-emerald-600 hover:underline">מדיניות הפרטיות</Link>
                    </span>
                  </label>

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
                        יוצר את החשבון...
                      </>
                    ) : (
                      <>
                        🚀 יאללה, בואו נתחיל!
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Trial Badge */}
              <div className="mt-6 py-3 px-4 bg-emerald-50 rounded-xl text-center">
                <p className="text-sm text-emerald-700 font-medium">
                  ✨ 14 ימי ניסיון חינם • ללא כרטיס אשראי
                </p>
              </div>

              {/* Login Link */}
              <p className="mt-6 text-center text-slate-500 text-sm">
                כבר יש לך חשבון?{' '}
                <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  התחבר כאן
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <Link href="/" className="text-slate-400 hover:text-slate-300 text-sm transition-colors">
                ← חזרה לדף הבית
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
