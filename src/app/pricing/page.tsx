"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react"

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

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <div className="min-h-screen bg-[#fafafa]" dir="rtl">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200"
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
              <Link href="/dashboard">
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

                {/* CTA Button */}
                <Link href={plan.ctaStyle === "outline" ? "mailto:hello@klear.ai" : "/dashboard"}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
                </Link>

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
