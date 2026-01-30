"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  BookOpen,
  Users,
  Zap,
  Shield,
  Clock,
  ArrowLeft,
  CheckCircle,
  Play,
  Sparkles,
  ChevronRight,
  BarChart3,
  FileText,
  Video,
} from "lucide-react"

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

// Pricing data
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

function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section className="py-24 px-4 bg-[#fafafa]" id="pricing">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            תמחור פשוט ושקוף
          </h2>
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            בחר את התוכנית שמתאימה לגודל העסק שלך. ללא הפתעות, ללא עלויות נסתרות.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
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
          whileInView="animate"
          viewport={{ once: true }}
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
                  ? "border-2 border-[#22c55e] shadow-lg shadow-green-500/10"
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3.5 px-6 rounded-xl text-sm font-semibold transition-all mb-6 ${
                  plan.ctaStyle === "green"
                    ? "bg-[#22c55e] text-white hover:bg-[#16a34a] shadow-lg shadow-green-500/20"
                    : plan.ctaStyle === "primary"
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-transparent text-gray-900 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {plan.cta}
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

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 pt-8 border-t border-gray-200"
        >
          <p className="text-sm text-gray-500">
            יש שאלות?{" "}
            <a
              href="mailto:hello@klear.ai"
              className="text-[#22c55e] font-medium hover:underline"
            >
              דברו איתנו
            </a>{" "}
            או שלחו מייל ל-
            <a
              href="mailto:hello@klear.ai"
              className="text-[#22c55e] font-medium hover:underline"
            >
              hello@klear.ai
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  useEffect(() => {
    async function init() {
      try {
        const seedRes = await fetch("/api/seed")
        const seedData = await seedRes.json()

        if (!seedData.seeded) {
          const newSeedRes = await fetch("/api/seed", { method: "POST" })
          const newSeedData = await newSeedRes.json()
          setCompanyId(newSeedData.companyId)
        } else {
          setCompanyId(seedData.companyId)
        }
      } catch (e) {
        console.error("Error initializing:", e)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const features = [
    {
      icon: MessageSquare,
      title: "ממשק WhatsApp",
      description: "עובדים שואלים שאלות בשפה טבעית דרך ממשק מוכר ופשוט",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: Zap,
      title: "תשובות מיידיות",
      description: "AI מספק תשובות מיידיות 24/7 מבוסס על מאגר הידע שלך",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Video,
      title: "ידע חזותי",
      description: "סרטונים, תמונות והנחיות ויזואליות מצורפות לתשובות",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Shield,
      title: "שליטה מלאה",
      description: "מנהלים יכולים לתקן תשובות ולשפר את המערכת בזמן אמת",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Clock,
      title: "חוסך זמן",
      description: "מפחית שאלות חוזרות ומשחרר זמן יקר לניהול",
      color: "from-red-500 to-rose-500",
    },
    {
      icon: BarChart3,
      title: "אנליטיקה חכמה",
      description: "מעקב אחר שאלות נפוצות וזיהוי פערי ידע",
      color: "from-indigo-500 to-violet-500",
    },
  ]

  const stats = [
    { value: "94%", label: "שביעות רצון" },
    { value: "3x", label: "מהיר יותר" },
    { value: "24/7", label: "זמינות" },
    { value: "50%", label: "פחות שאלות למנהל" },
  ]

  const industries = [
    { name: "תחנות דלק", emoji: "⛽", description: "נהלי בטיחות ותפעול" },
    { name: "בתי קפה", emoji: "☕", description: "הכנת משקאות ושירות" },
    { name: "רשתות אופנה", emoji: "👕", description: "מידות, החלפות והחזרות" },
    { name: "מאפיות", emoji: "🥐", description: "מתכונים ותהליכי עבודה" },
  ]

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/50"
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
              <Link href="/pricing">
                <Button variant="ghost" className="hidden sm:flex">
                  נסה את הצ'אט
                </Button>
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

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden hero-gradient hero-pattern">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-20 w-72 h-72 bg-green-200/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -20, 0],
              y: [0, 20, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            style={{ opacity, scale }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-green-200"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              MVP מוכן לשימוש
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              הפוך את הידע הפנימי
              <br />
              <span className="bg-gradient-to-r from-[#25D366] via-[#128C7E] to-[#075E54] bg-clip-text text-transparent">
                לנגיש ומיידי
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              בוט AI חכם שמשמש כמרכז ידע פנימי לעובדים. שאלות בעברית, תשובות מיידיות
              עם סרטונים ותמונות רלוונטיים.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link href="/pricing">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:opacity-90 shadow-xl shadow-green-500/30 px-8 py-6 text-lg"
                  >
                    <Play className="w-5 h-5" />
                    נסה את הצ'אט עכשיו
                  </Button>
                </motion.div>
              </Link>
              <Link href="/dashboard">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 px-8 py-6 text-lg border-2 hover:bg-gray-50"
                  >
                    כניסה ללוח הבקרה
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                className="text-center"
              >
                <motion.div
                  className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#25D366] to-[#128C7E] bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-3xl blur-xl opacity-20 transform scale-105" />
            <div className="relative bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800">
              <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="w-3 h-3 rounded-full bg-red-500 cursor-pointer"
                  />
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer"
                  />
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="w-3 h-3 rounded-full bg-green-500 cursor-pointer"
                  />
                </div>
                <span className="text-gray-400 text-sm mr-4">Klear AI Chat</span>
              </div>
              <div className="p-4 md:p-8 flex justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-full max-w-sm bg-[#E5DDD5] rounded-2xl overflow-hidden shadow-xl"
                >
                  {/* WhatsApp-like header */}
                  <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white px-4 py-3 flex items-center gap-3">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                    >
                      <span className="font-bold">ד</span>
                    </motion.div>
                    <div>
                      <p className="font-semibold">תחנות דלק דמו</p>
                      <div className="flex items-center gap-1">
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-2 h-2 bg-green-400 rounded-full"
                        />
                        <p className="text-xs text-green-200">מחובר</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-4 space-y-3 min-h-[300px]">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white rounded-xl rounded-tr-sm px-4 py-2 shadow-sm max-w-[80%]">
                        <p className="text-sm">איך מכבים משאבת דלק בחירום?</p>
                        <span className="text-[10px] text-gray-500">10:30</span>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                      className="flex justify-end"
                    >
                      <div className="bg-[#DCF8C6] rounded-xl rounded-tl-sm px-4 py-2 shadow-sm max-w-[80%]">
                        <p className="text-sm">
                          במקרה חירום, לחץ על הכפתור האדום הגדול שנמצא ליד עמדת
                          הקופאי. פעולה זו תכבה מיידית את כל משאבות הדלק.
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] text-gray-500">10:30</span>
                          <CheckCircle className="w-3 h-3 text-blue-500" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.7 }}
                      className="flex justify-end"
                    >
                      <div className="bg-[#DCF8C6] rounded-xl rounded-tl-sm px-4 py-2 shadow-sm max-w-[80%]">
                        <div className="bg-white/50 rounded-lg p-2 mb-2 flex items-center gap-2">
                          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <Video className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium">סרטון הדרכה</p>
                            <p className="text-[10px] text-gray-500">כיבוי משאבות בחירום</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] text-gray-500">10:30</span>
                          <CheckCircle className="w-3 h-3 text-blue-500" />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              למה Klear AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              הופכים ידע שנמצא רק בראש של אנשים לידע נגיש ומתועד שזמין לכולם
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              מתאים לעסקים עם סניפים
            </h2>
            <p className="text-xl text-gray-600">
              כל עסק עם עובדים שצריכים גישה לידע
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {industries.map((industry, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer group"
              >
                <motion.span
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="text-5xl mb-4 block"
                >
                  {industry.emoji}
                </motion.span>
                <p className="font-bold text-lg text-gray-900 mb-1">{industry.name}</p>
                <p className="text-sm text-gray-500">{industry.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              איך זה עובד?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "העלה את הידע",
                description: "מעלים נהלים, מסמכים וסרטוני הדרכה למערכת",
                icon: FileText,
              },
              {
                step: "2",
                title: "עובדים שואלים",
                description: "עובדים שואלים שאלות בעברית דרך ממשק דמוי WhatsApp",
                icon: MessageSquare,
              },
              {
                step: "3",
                title: "AI עונה מיידית",
                description: "המערכת מספקת תשובות מדויקות עם מדיה רלוונטית",
                icon: Zap,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-l from-transparent via-gray-200 to-transparent" />
                )}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-16 h-16 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20"
                  >
                    <item.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <div className="absolute -top-3 right-1/2 transform translate-x-1/2 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#25D366] via-[#128C7E] to-[#075E54]" />
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />

        <div className="relative max-w-4xl mx-auto text-center text-white">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            מוכנים להתחיל?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl mb-10 opacity-90"
          >
            התחל עם ה-MVP ונסה את המערכת עכשיו - חינם
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link href="/pricing">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-white text-[#25D366] hover:bg-gray-100 shadow-xl px-8 py-6 text-lg font-bold"
                >
                  התחל עכשיו
                  <ChevronRight className="w-5 h-5 mr-2" />
                </Button>
              </motion.div>
            </Link>
            <Link href="/dashboard">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg bg-transparent"
                >
                  <Play className="w-5 h-5 ml-2" />
                  כניסה ללוח הבקרה
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <span className="font-bold text-xl text-white">Klear AI</span>
            </motion.div>

            <p className="text-sm">
              © 2026 Klear AI - Aviv Granot, Nevo Peretz & Dana Mordoh
            </p>

            <div className="flex gap-6">
              <Link href="/pricing" className="hover:text-white transition-colors">
                תמחור
              </Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                לוח בקרה
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
