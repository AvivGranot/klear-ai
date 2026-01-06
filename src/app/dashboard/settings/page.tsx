"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Webhook,
  Key,
  Link2,
  Bell,
  Globe,
  Shield,
  ChevronRight,
  Copy,
  Check,
  Eye,
  EyeOff,
  Bot,
  MessageSquare,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"

export default function SettingsPage() {
  const [copiedKey, setCopiedKey] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [notifications, setNotifications] = useState({
    errorEmails: true,
    dailyDigest: false,
    weeklyReport: true,
  })

  // AI Configuration state
  const [aiConfig, setAiConfig] = useState({
    tone: "professional" as "professional" | "friendly" | "casual",
    responseLength: "medium" as "short" | "medium" | "detailed",
    includeEmoji: false,
    autoSuggest: true,
  })

  const apiKey = "kl_live_****************************"
  const fullApiKey = "kl_live_8f7d9a3b2c1e4f5g6h7i8j9k0l1m2n3o"

  const handleCopyKey = () => {
    navigator.clipboard.writeText(fullApiKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const integrations = [
    {
      name: "WhatsApp Business",
      type: "messaging",
      status: "connected" as const,
      icon: "📱",
      lastSync: "לפני 5 דקות",
      account: "+972-50-1234567"
    },
    {
      name: "Google Drive",
      type: "storage",
      status: "disconnected" as const,
      icon: "📁",
      lastSync: null,
      account: null
    },
    {
      name: "Slack",
      type: "notifications",
      status: "error" as const,
      icon: "💬",
      lastSync: "לפני שעה",
      account: "#klear-alerts"
    },
  ]

  const getIntegrationStatusBadge = (status: "connected" | "disconnected" | "error") => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-700 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            מחובר
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 gap-1">
            <AlertCircle className="w-3 h-3" />
            שגיאה
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-gray-500 gap-1">
            <XCircle className="w-3 h-3" />
            לא מחובר
          </Badge>
        )
    }
  }

  const toneOptions = [
    { value: "professional", label: "מקצועי", desc: "תשובות פורמליות ומדויקות" },
    { value: "friendly", label: "ידידותי", desc: "נעים וקרוב יותר" },
    { value: "casual", label: "לא פורמלי", desc: "שיחתי וקליל" },
  ]

  const lengthOptions = [
    { value: "short", label: "קצר", desc: "תשובות תמציתיות" },
    { value: "medium", label: "בינוני", desc: "איזון בין קיצור למידע" },
    { value: "detailed", label: "מפורט", desc: "הסברים מלאים" },
  ]

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">הגדרות</h1>
        <p className="text-gray-500 mt-1">
          הגדר את ההעדפות שלך עבור מערכת Klear AI
        </p>
      </div>

      {/* AI Configuration */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-gray-400" />
            <CardTitle className="text-lg font-medium">הגדרות AI</CardTitle>
          </div>
          <CardDescription>
            התאם את אופי התשובות של הבוט
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tone Selection */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">טון התשובות</p>
            <div className="grid grid-cols-3 gap-3">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAiConfig((prev) => ({ ...prev, tone: option.value as typeof prev.tone }))}
                  className={`p-4 rounded-lg border-2 transition-all text-right ${
                    aiConfig.tone === option.value
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Response Length */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">אורך התשובות</p>
            <div className="grid grid-cols-3 gap-3">
              {lengthOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAiConfig((prev) => ({ ...prev, responseLength: option.value as typeof prev.responseLength }))}
                  className={`p-4 rounded-lg border-2 transition-all text-right ${
                    aiConfig.responseLength === option.value
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">שימוש באמוג׳י</p>
                  <p className="text-sm text-gray-500">הוסף אמוג׳ים לתשובות הבוט</p>
                </div>
              </div>
              <button
                onClick={() => setAiConfig((prev) => ({ ...prev, includeEmoji: !prev.includeEmoji }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  aiConfig.includeEmoji ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    aiConfig.includeEmoji ? "translate-x-0.5" : "translate-x-6"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">הצעות אוטומטיות</p>
                  <p className="text-sm text-gray-500">הצע תשובות מהירות למשתמשים</p>
                </div>
              </div>
              <button
                onClick={() => setAiConfig((prev) => ({ ...prev, autoSuggest: !prev.autoSuggest }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  aiConfig.autoSuggest ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    aiConfig.autoSuggest ? "translate-x-0.5" : "translate-x-6"
                  }`}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-gray-400" />
            <CardTitle className="text-lg font-medium">מפתחות API</CardTitle>
          </div>
          <CardDescription>
            השתמש במפתחות אלו לשילוב המערכת עם שירותים חיצוניים
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-1">מפתח Production</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-white px-3 py-1.5 rounded border border-gray-200 flex-1">
                  {showKey ? fullApiKey : apiKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyKey}
                >
                  {copiedKey ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Key className="w-4 h-4" />
            צור מפתח חדש
          </Button>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-gray-400" />
            <CardTitle className="text-lg font-medium">Webhooks</CardTitle>
          </div>
          <CardDescription>
            קבל התראות בזמן אמת על אירועים במערכת
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Webhook התחלת שיחה
            </p>
            <Input
              placeholder="https://your-server.com/webhook"
              className="bg-white"
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Webhook סיום שיחה
            </p>
            <Input
              placeholder="https://your-server.com/webhook/end"
              className="bg-white"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Webhook className="w-4 h-4" />
            הוסף webhook
          </Button>
        </CardContent>
      </Card>

      {/* Integrations with Status */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-gray-400" />
            <CardTitle className="text-lg font-medium">אינטגרציות</CardTitle>
          </div>
          <CardDescription>
            חבר שירותים חיצוניים למערכת
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {integrations.map((integration, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{integration.name}</p>
                    {getIntegrationStatusBadge(integration.status)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">{integration.type}</p>
                    {integration.account && (
                      <>
                        <span className="text-gray-300">•</span>
                        <p className="text-xs text-gray-500">{integration.account}</p>
                      </>
                    )}
                    {integration.lastSync && (
                      <>
                        <span className="text-gray-300">•</span>
                        <p className="text-xs text-gray-400">סנכרון: {integration.lastSync}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {integration.status === "connected" && (
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant={integration.status === "connected" ? "outline" : "default"}
                  size="sm"
                  className={integration.status === "connected" ? "" : "bg-gray-900 hover:bg-gray-800"}
                >
                  {integration.status === "connected" ? "הגדרות" : "חבר"}
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" className="gap-2 w-full">
            <Link2 className="w-4 h-4" />
            הוסף אינטגרציה
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            <CardTitle className="text-lg font-medium">התראות</CardTitle>
          </div>
          <CardDescription>
            הגדר מתי ואיך תקבל התראות
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "errorEmails", label: "התראות דוא״ל על שגיאות", desc: "קבל התראה כאשר מתרחשת שגיאה במערכת" },
            { key: "dailyDigest", label: "סיכום יומי", desc: "קבל סיכום פעילות יומי בכל בוקר" },
            { key: "weeklyReport", label: "דו״ח שבועי", desc: "קבל דו״ח מפורט כל יום ראשון" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <button
                onClick={() =>
                  setNotifications((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key as keyof typeof notifications],
                  }))
                }
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications[item.key as keyof typeof notifications]
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notifications[item.key as keyof typeof notifications]
                      ? "translate-x-0.5"
                      : "translate-x-6"
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            <CardTitle className="text-lg font-medium">אבטחה</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="gap-2 w-full justify-start">
            <Shield className="w-4 h-4" />
            שנה סיסמה
          </Button>
          <Button variant="outline" className="gap-2 w-full justify-start">
            <Globe className="w-4 h-4" />
            הגדרות גישה
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-red-700">
            אזור מסוכן
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-4">
            פעולות אלו הן בלתי הפיכות. אנא היזהר.
          </p>
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-100">
            מחק את כל הנתונים
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
