"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Sparkles, X, Rocket, Mail, Users, Zap } from "lucide-react"

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const pricingPlans = [
  {
    name: "Starter",
    description: "לעסקים קטנים שרוצים להתחיל",
    monthlyPrice: 10,
    yearlyPrice: 8,
    conversations: "עד 100 שיחות בחודש",
    cta: "התחל עכשיו",
    ctaStyle: "primary",
    features: [
      "בוט וואטסאפ חכם",
      "למידה מההיסטוריה שלך",
      "עברית מושלמת",
      "דשבורד ניהול",
      "תמיכה באימייל",
    ],
    featuresTitle: "כולל",
  },
  {
    name: "Growth",
    description: "לעסקים צומחים עם נפח שיחות גבוה",
    monthlyPrice: 20,
    yearlyPrice: 16,
    conversations: "עד 500 שיחות בחודש",
    cta: "בחר Growth",
    ctaStyle: "green",
    popular: true,
    features: [
      "זמני תגובה של הצוות",
      "ייצוא דוחות",
      "אוטומציות מותאמות",
      "תמיכה בצ׳אט",
    ],
    featuresTitle: "הכל ב-Starter, ועוד",
  },
  {
    name: "Business",
    description: "לעסקים עם דרישות מתקדמות",
    monthlyPrice: 50,
    yearlyPrice: 40,
    conversations: "עד 1,000 שיחות בחודש",
    cta: "בחר Business",
    ctaStyle: "primary",
    features: [
      "משתמשים ללא הגבלה",
      "גישת API מלאה",
      "אינטגרציות מתקדמות",
      "מנהל לקוח ייעודי",
      "SLA מובטח",
    ],
    featuresTitle: "הכל ב-Growth, ועוד",
    overage: "$10 לכל 100 שיחות נוספות",
  },
  {
    name: "Enterprise",
    description: "פתרון מותאם לארגונים גדולים",
    customPrice: true,
    conversations: "שיחות ללא הגבלה",
    cta: "צור קשר",
    ctaStyle: "outline",
    features: [
      "התאמה אישית מלאה",
      "On-premise אפשרות",
      "SSO & Security מתקדם",
      "הדרכה צוותית",
      "תמיכה 24/7",
    ],
    featuresTitle: "הכל ב-Business, ועוד",
  },
]

// Coming Soon Modal Component
function ComingSoonModal({
  isOpen,
  onClose,
  selectedPlan
}: {
  isOpen: boolean
  onClose: () => void
  selectedPlan: string | null
}) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)

    // Simulate API call - in production, send to your waitlist service
    await new Promise(resolve => setTimeout(resolve, 1000))

    // TODO: Send to actual waitlist (e.g., Loops, ConvertKit, or your own API)
    console.log("Waitlist signup:", { email, plan: selectedPlan })

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Gradient background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#25D366]/20 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl" />

              <div className="relative p-8 pt-12">
                {!isSubmitted ? (
                  <>
                    {/* Rocket icon */}
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex justify-center mb-6"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{
                            y: [0, -8, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="w-20 h-20 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30"
                        >
                          <Rocket className="w-10 h-10 text-white" />
                        </motion.div>
                        {/* Sparkle effects */}
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                          className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full"
                        />
                      </div>
                    </motion.div>

                    {/* Title */}
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-center mb-6"
                    >
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        Coming Soon! 🚀
                      </h2>
                      <p className="text-gray-600 leading-relaxed">
                        אנחנו עובדים על משהו מדהים.
                        <br />
                        <span className="text-[#25D366] font-semibold">הצטרף לרשימת ההמתנה</span> וקבל גישה מוקדמת + הטבות בלעדיות!
                      </p>
                    </motion.div>

                    {/* Benefits */}
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex justify-center gap-6 mb-8"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Zap className="w-4 h-4 text-green-600" />
                        </div>
                        <span>גישה מוקדמת</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span>הנחת מייסדים</span>
                      </div>
                    </motion.div>

                    {/* Email form */}
                    <motion.form
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
                      <div className="relative">
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all text-left"
                          dir="ltr"
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/40 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                            נרשם...
                          </>
                        ) : (
                          <>
                            הצטרף לרשימת ההמתנה
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </motion.button>
                    </motion.form>

                    {/* Social proof */}
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-6 pt-6 border-t border-gray-100"
                    >
                      <div className="flex items-center justify-center gap-3">
                        {/* Avatar stack */}
                        <div className="flex -space-x-2 rtl:space-x-reverse">
                          {[
                            "bg-gradient-to-br from-orange-400 to-pink-500",
                            "bg-gradient-to-br from-blue-400 to-purple-500",
                            "bg-gradient-to-br from-green-400 to-cyan-500",
                            "bg-gradient-to-br from-yellow-400 to-orange-500",
                          ].map((gradient, i) => (
                            <div
                              key={i}
                              className={`w-8 h-8 ${gradient} rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                            >
                              {["א", "ב", "ג", "ד"][i]}
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">127+</span> כבר ברשימה
                        </p>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  /* Success State */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </motion.div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      🎉 נרשמת בהצלחה!
                    </h2>
                    <p className="text-gray-600 mb-6">
                      תודה שהצטרפת! נעדכן אותך ברגע שנשיק.
                      <br />
                      <span className="text-[#25D366] font-medium">בדוק את המייל שלך להפתעה קטנה 😉</span>
                    </p>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <p className="text-sm text-gray-600 mb-2">שתף עם חברים וקבל מקום קדימה ברשימה:</p>
                      <div className="flex justify-center gap-3">
                        <a
                          href={`https://twitter.com/intent/tweet?text=הצטרפתי לרשימת ההמתנה של @KlearAI - בוט וואטסאפ חכם לעסקים! 🚀&url=https://klear.ai`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          𝕏 Twitter
                        </a>
                        <a
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=https://klear.ai`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#0077B5] text-white text-sm font-medium rounded-lg hover:bg-[#006699] transition-colors"
                        >
                          LinkedIn
                        </a>
                      </div>
                    </div>

                    <button
                      onClick={onClose}
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                      סגור
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handlePlanClick = (planName: string) => {
    setSelectedPlan(planName)
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-[#fafafa]" dir="rtl">
      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedPlan={selectedPlan}
      />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20"
              >
                <span className="text-white font-bold text-xl">K</span>
              </motion.div>
              <span className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Klear AI
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost">חזרה לעמוד הבית</Button>
              </Link>
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:opacity-90 shadow-lg shadow-green-500/20">
                    כניסה למערכת
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-green-200"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              14 ימי ניסיון חינם
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              תמחור פשוט ושקוף
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              בחר את התוכנית שמתאימה לגודל העסק שלך. ללא הפתעות, ללא עלויות נסתרות.
              <br />
              <span className="text-[#22c55e] font-medium">התחל היום וקבל 14 ימי ניסיון חינם!</span>
            </p>
          </motion.div>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-12"
          >
            <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  !isYearly
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                חודשי
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  isYearly
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                  חסוך 20%
                </span>
                שנתי
              </button>
            </div>
          </motion.div>

          {/* Pricing Grid */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeInUp}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative bg-white rounded-2xl p-6 transition-all ${
                  plan.popular
                    ? "border-2 border-[#22c55e] shadow-xl shadow-green-500/10"
                    : "border border-gray-200 hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 right-6 bg-[#22c55e] text-white text-xs font-semibold px-3 py-1 rounded-md">
                    הכי פופולרי
                  </span>
                )}

                {/* Plan Name */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-2">
                  {plan.customPrice ? (
                    <span className="text-3xl font-bold text-gray-900">Custom</span>
                  ) : (
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-gray-900 tracking-tight">
                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-2xl font-semibold text-gray-900 mr-1">
                        $
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {plan.customPrice
                    ? "מותאם אישית"
                    : isYearly
                    ? "לחודש (בחיוב שנתי)"
                    : "לחודש"}
                </p>
                <p className="text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
                  {plan.conversations}
                </p>

                {/* CTA Button - Now opens modal */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePlanClick(plan.name)}
                  className={`w-full py-3.5 px-6 rounded-xl text-sm font-semibold transition-all mb-6 flex items-center justify-center gap-2 ${
                    plan.ctaStyle === "green"
                      ? "bg-[#22c55e] text-white hover:bg-[#16a34a] shadow-lg shadow-green-500/20"
                      : plan.ctaStyle === "primary"
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-transparent text-gray-900 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                {/* Features */}
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                  {plan.featuresTitle}
                </p>
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Overage */}
                {plan.overage && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{plan.overage.split(" ")[0]}</span>{" "}
                      {plan.overage.split(" ").slice(1).join(" ")}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-20 max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              שאלות נפוצות
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "האם יש תקופת ניסיון?",
                  a: "כן! כל תוכנית מגיעה עם 14 ימי ניסיון חינם. לא צריך כרטיס אשראי להתחלה.",
                },
                {
                  q: "מה נחשב לשיחה?",
                  a: "שיחה היא אינטראקציה מלאה עם עובד - מהשאלה הראשונה ועד שהעובד מקבל תשובה מלאה.",
                },
                {
                  q: "האם אפשר לשדרג או לשנמך תוכנית?",
                  a: "בטח! אפשר לשנות תוכנית בכל עת. אם תשדרג, ההפרש יחושב פרופורציונלית.",
                },
                {
                  q: "מה קורה אם עברתי את מכסת השיחות?",
                  a: "תקבל התראה כשאתה מתקרב למכסה. אם תעבור, תוכל לשדרג תוכנית או לשלם לפי שימוש.",
                },
              ].map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-6 border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600 text-sm">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16 pt-8 border-t border-gray-200"
          >
            <p className="text-gray-600 mb-4">
              יש שאלות נוספות? אנחנו כאן לעזור!
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="mailto:hello@klear.ai"
                className="text-[#22c55e] font-medium hover:underline"
              >
                hello@klear.ai
              </a>
              <span className="text-gray-300">|</span>
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                חזרה לעמוד הבית
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
