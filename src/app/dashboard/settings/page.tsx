"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Webhook,
  Key,
  Link2,
  Bell,
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
  Plus,
  Trash2,
  X,
} from "lucide-react"

// API Key interface
interface ApiKey {
  id: string
  name: string
  key: string
  prefix: string
  scopes: string[]
  createdAt: string
  lastUsed: string | null
  status: "active" | "revoked"
}

// Generate random API key
function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = "kl_live_"
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Available scopes for API keys
const AVAILABLE_SCOPES = [
  { id: "chat:read", label: "קריאת שיחות", description: "גישה לקריאת היסטוריית שיחות" },
  { id: "chat:write", label: "כתיבת שיחות", description: "שליחת הודעות והתחלת שיחות" },
  { id: "knowledge:read", label: "קריאת ידע", description: "גישה למאגר הידע" },
  { id: "knowledge:write", label: "כתיבת ידע", description: "הוספה ועדכון מאגר הידע" },
  { id: "analytics:read", label: "קריאת אנליטיקה", description: "גישה לנתוני אנליטיקה" },
  { id: "users:read", label: "קריאת משתמשים", description: "גישה לרשימת משתמשים" },
]

// Webhook types
interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  secret: string
  status: "active" | "paused" | "error"
  lastTriggered: string | null
  successRate: number
}

const WEBHOOK_EVENTS = [
  { id: "conversation.started", label: "התחלת שיחה", description: "קבל התראה כאשר עובד מתחיל שיחה חדשה עם הבוט" },
  { id: "conversation.ended", label: "סיום שיחה", description: "קבל התראה כאשר שיחה מסתיימת (אחרי 30 דקות ללא פעילות)" },
  { id: "message.received", label: "הודעה נכנסת", description: "קבל התראה על כל הודעה שנשלחת לבוט" },
  { id: "message.sent", label: "הודעה יוצאת", description: "קבל התראה על כל תשובה שהבוט שולח" },
  { id: "escalation.created", label: "הסלמה למנהל", description: "קבל התראה כאשר הבוט לא יודע לענות והשאלה מועברת למנהל" },
  { id: "knowledge.updated", label: "עדכון מאגר ידע", description: "קבל התראה כאשר מתווספת או מתעדכנת תשובה במאגר הידע" },
]

function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [showNewWebhookModal, setShowNewWebhookModal] = useState(false)
  const [newWebhook, setNewWebhook] = useState({ name: "", url: "", events: ["conversation.started"] })
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean } | null>(null)

  // Load webhooks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("klear_webhooks")
    if (saved) {
      setWebhooks(JSON.parse(saved))
    }
  }, [])

  // Save webhooks
  const saveWebhooks = (hooks: WebhookConfig[]) => {
    setWebhooks(hooks)
    localStorage.setItem("klear_webhooks", JSON.stringify(hooks))
  }

  // Generate secret
  const generateSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = "whsec_"
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Create webhook
  const handleCreate = () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) return

    const webhook: WebhookConfig = {
      id: `wh-${Date.now()}`,
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events,
      secret: generateSecret(),
      status: "active",
      lastTriggered: null,
      successRate: 100,
    }

    saveWebhooks([...webhooks, webhook])
    setNewWebhook({ name: "", url: "", events: ["conversation.started"] })
    setShowNewWebhookModal(false)
  }

  // Test webhook
  const handleTest = async (webhookId: string) => {
    setTestingWebhookId(webhookId)
    // Simulate test
    await new Promise((r) => setTimeout(r, 1500))
    const success = Math.random() > 0.2
    setTestResult({ id: webhookId, success })
    setTestingWebhookId(null)
    setTimeout(() => setTestResult(null), 3000)
  }

  // Toggle status
  const handleToggle = (webhookId: string) => {
    const updated = webhooks.map((w) =>
      w.id === webhookId
        ? { ...w, status: w.status === "active" ? ("paused" as const) : ("active" as const) }
        : w
    )
    saveWebhooks(updated)
  }

  // Delete webhook
  const handleDelete = (webhookId: string) => {
    saveWebhooks(webhooks.filter((w) => w.id !== webhookId))
  }

  return (
    <>
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-gray-400" />
              <CardTitle className="text-lg font-medium">התראות אוטומטיות (Webhooks)</CardTitle>
            </div>
            <Button
              size="sm"
              className="bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)] gap-1.5"
              onClick={() => setShowNewWebhookModal(true)}
            >
              <Plus className="w-4 h-4" />
              הוסף התראה
            </Button>
          </div>
          <CardDescription>
            הגדר התראות אוטומטיות שיישלחו למערכות אחרות (כמו Slack או מערכת CRM) כאשר מתרחשים אירועים במערכת
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Webhook className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">אין התראות אוטומטיות מוגדרות</p>
              <p className="text-xs text-gray-400 mt-1">הוסף התראה כדי לקבל עדכונים אוטומטיים במערכות אחרות</p>
            </div>
          ) : (
            webhooks.map((webhook) => (
              <motion.div
                key={webhook.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  webhook.status === "error"
                    ? "border-red-200 bg-red-50"
                    : webhook.status === "paused"
                    ? "border-gray-200 bg-gray-50 opacity-60"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{webhook.name}</p>
                      {webhook.status === "active" && (
                        <Badge className="bg-green-100 text-green-700 text-[10px]">פעיל</Badge>
                      )}
                      {webhook.status === "paused" && (
                        <Badge className="bg-gray-100 text-gray-500 text-[10px]">מושהה</Badge>
                      )}
                      {webhook.status === "error" && (
                        <Badge className="bg-red-100 text-red-700 text-[10px]">שגיאה</Badge>
                      )}
                      {testResult?.id === webhook.id && (
                        <Badge className={testResult.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {testResult.success ? "✓ בדיקה עברה" : "✗ בדיקה נכשלה"}
                        </Badge>
                      )}
                    </div>
                    <code className="text-xs text-gray-500 block mt-1">{webhook.url}</code>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleTest(webhook.id)}
                      disabled={testingWebhookId === webhook.id}
                    >
                      {testingWebhookId === webhook.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-xs">בדיקה</span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleToggle(webhook.id)}
                    >
                      {webhook.status === "active" ? "השהה" : "הפעל"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-600 h-8 px-2"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Events */}
                <div className="flex flex-wrap gap-1.5">
                  {webhook.events.map((event) => {
                    const eventInfo = WEBHOOK_EVENTS.find((e) => e.id === event)
                    return (
                      <Badge key={event} variant="outline" className="text-[10px] bg-gray-50">
                        {eventInfo?.label || event}
                      </Badge>
                    )
                  })}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span>הפעלה אחרונה: {webhook.lastTriggered || "אף פעם"}</span>
                  <span>הצלחה: {webhook.successRate}%</span>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      {/* New Webhook Modal */}
      <AnimatePresence>
        {showNewWebhookModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNewWebhookModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">הוסף התראה אוטומטית</h3>
                <button
                  onClick={() => setShowNewWebhookModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Explanation banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>מה זה?</strong> התראה אוטומטית שולחת מידע למערכת אחרת כשמשהו קורה.
                    לדוגמה, אפשר לשלוח הודעה ל-Slack כשעובד שואל שאלה שהבוט לא יודע לענות עליה.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">שם ההתראה</label>
                  <p className="text-xs text-gray-500 mb-2">תן שם שיעזור לך לזהות את ההתראה הזו</p>
                  <Input
                    placeholder="לדוגמה: התראות הסלמה ל-Slack"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">כתובת יעד (URL)</label>
                  <p className="text-xs text-gray-500 mb-2">הכתובת שאליה יישלחו ההתראות. בדרך כלל מקבלים אותה מהמערכת שאליה רוצים לשלוח</p>
                  <Input
                    placeholder="https://hooks.slack.com/services/..."
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    dir="ltr"
                    className="text-left font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">מתי לשלוח התראה?</label>
                  <p className="text-xs text-gray-500 mb-3">בחר את האירועים שיגרמו לשליחת התראה</p>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {WEBHOOK_EVENTS.map((event) => (
                      <label
                        key={event.id}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          newWebhook.events.includes(event.id)
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-50 border border-transparent hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={newWebhook.events.includes(event.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event.id] })
                            } else {
                              setNewWebhook({ ...newWebhook, events: newWebhook.events.filter((ev) => ev !== event.id) })
                            }
                          }}
                          className="mt-0.5 accent-green-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.label}</p>
                          <p className="text-xs text-gray-500">{event.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]"
                    onClick={handleCreate}
                    disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
                  >
                    צור התראה
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewWebhookModal(false)}>
                    ביטול
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function SettingsPage() {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [visibleKeyId, setVisibleKeyId] = useState<string | null>(null)
  const [showNewKeyModal, setShowNewKeyModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["chat:read", "chat:write"])
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [notifications, setNotifications] = useState({
    errorEmails: true,
    dailyDigest: false,
    weeklyReport: true,
    escalationAlerts: true,
  })

  // AI Configuration state (simplified - only emoji and auto-suggest)
  const [aiConfig, setAiConfig] = useState({
    includeEmoji: false,
    autoSuggest: true,
  })

  // Load API keys from localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem("klear_api_keys")
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys))
    } else {
      // Create default key
      const defaultKey: ApiKey = {
        id: "default-key",
        name: "מפתח ברירת מחדל",
        key: generateApiKey(),
        prefix: "kl_live_****",
        scopes: ["chat:read", "chat:write", "knowledge:read"],
        createdAt: new Date().toISOString(),
        lastUsed: new Date(Date.now() - 3600000).toISOString(),
        status: "active",
      }
      setApiKeys([defaultKey])
      localStorage.setItem("klear_api_keys", JSON.stringify([defaultKey]))
    }
  }, [])

  // Save API keys to localStorage
  const saveApiKeys = (keys: ApiKey[]) => {
    setApiKeys(keys)
    localStorage.setItem("klear_api_keys", JSON.stringify(keys))
  }

  // Create new API key
  const handleCreateKey = () => {
    if (!newKeyName.trim()) return

    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      key: generateApiKey(),
      prefix: "kl_live_****",
      scopes: newKeyScopes,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      status: "active",
    }

    saveApiKeys([...apiKeys, newKey])
    setNewlyCreatedKey(newKey)
    setNewKeyName("")
    setNewKeyScopes(["chat:read", "chat:write"])
  }

  // Revoke API key
  const handleRevokeKey = (keyId: string) => {
    const updatedKeys = apiKeys.map(k =>
      k.id === keyId ? { ...k, status: "revoked" as const } : k
    )
    saveApiKeys(updatedKeys)
  }

  // Delete API key
  const handleDeleteKey = (keyId: string) => {
    const updatedKeys = apiKeys.filter(k => k.id !== keyId)
    saveApiKeys(updatedKeys)
  }

  // Copy key to clipboard
  const handleCopyKey = (key: ApiKey) => {
    navigator.clipboard.writeText(key.key)
    setCopiedKeyId(key.id)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Format relative time
  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "אף פעם"
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return "לפני פחות משעה"
    if (hours < 24) return `לפני ${hours} שעות`
    const days = Math.floor(hours / 24)
    if (days < 7) return `לפני ${days} ימים`
    return formatDate(dateStr)
  }

  const [showAddIntegrationModal, setShowAddIntegrationModal] = useState(false)

  const integrations = [
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      type: "הודעות",
      status: "connected" as const,
      icon: "📱",
      lastSync: "לפני 5 דקות",
      account: "+972-50-1234567",
      description: "חבר את חשבון WhatsApp Business שלך לקבלת הודעות ושליחת תשובות אוטומטיות"
    },
    {
      id: "google-drive",
      name: "Google Drive",
      type: "אחסון",
      status: "disconnected" as const,
      icon: "📁",
      lastSync: null,
      account: null,
      description: "סנכרן מסמכים ממאגר הידע שלך ב-Google Drive"
    },
  ]

  const availableIntegrations = [
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      icon: "📱",
      description: "חבר את חשבון WhatsApp Business שלך לקבלת הודעות ושליחת תשובות אוטומטיות",
      comingSoon: false
    },
    {
      id: "google-drive",
      name: "Google Drive",
      icon: "📁",
      description: "סנכרן מסמכים ממאגר הידע שלך ב-Google Drive",
      comingSoon: false
    },
    {
      id: "sheets",
      name: "Google Sheets",
      icon: "📊",
      description: "יצא נתונים ודוחות ישירות ל-Google Sheets",
      comingSoon: true
    },
    {
      id: "zapier",
      name: "Zapier",
      icon: "⚡",
      description: "חבר את Klear לאלפי אפליקציות אחרות דרך Zapier",
      comingSoon: true
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

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">הגדרות</h1>
        <p className="text-gray-500 mt-1">
          הגדר את ההעדפות שלך עבור מערכת Klear AI
        </p>
      </div>

      {/* AI Configuration - Simplified */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-gray-400" />
            <CardTitle className="text-lg font-medium">הגדרות AI</CardTitle>
          </div>
          <CardDescription>
            התאם את התנהגות הבוט
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">שימוש באמוג׳י</p>
                <p className="text-sm text-gray-500">הבוט יוסיף אמוג׳ים לתשובות כדי להפוך אותן לידידותיות יותר</p>
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
                <p className="text-sm text-gray-500">הבוט יציע תשובות מהירות לעובדים על סמך שאלות נפוצות</p>
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
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-gray-400" />
              <CardTitle className="text-lg font-medium">מפתחות API</CardTitle>
            </div>
            <Button
              size="sm"
              className="bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)] gap-1.5"
              onClick={() => setShowNewKeyModal(true)}
            >
              <Plus className="w-4 h-4" />
              צור מפתח חדש
            </Button>
          </div>
          <CardDescription>
            השתמש במפתחות אלו לשילוב המערכת עם שירותים חיצוניים
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Key className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">אין מפתחות API</p>
              <p className="text-xs text-gray-400">צור מפתח חדש להתחלה</p>
            </div>
          ) : (
            apiKeys.map((key) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  key.status === "revoked"
                    ? "bg-gray-50 border-gray-200 opacity-60"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{key.name}</p>
                      {key.status === "active" ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px]">פעיל</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-500 text-[10px]">בוטל</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      נוצר: {formatDate(key.createdAt)} • שימוש אחרון: {formatRelativeTime(key.lastUsed)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {key.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                        onClick={() => handleRevokeKey(key.id)}
                      >
                        בטל
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600 h-8 px-2"
                      onClick={() => handleDeleteKey(key.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* API Key display */}
                <div className="flex items-center gap-2 mb-3">
                  <code className="text-xs bg-gray-50 px-3 py-2 rounded border border-gray-200 flex-1 font-mono">
                    {visibleKeyId === key.id ? key.key : `${key.prefix}${"•".repeat(28)}`}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setVisibleKeyId(visibleKeyId === key.id ? null : key.id)}
                    disabled={key.status === "revoked"}
                  >
                    {visibleKeyId === key.id ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => handleCopyKey(key)}
                    disabled={key.status === "revoked"}
                  >
                    {copiedKeyId === key.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Scopes */}
                <div className="flex flex-wrap gap-1.5">
                  {key.scopes.map((scope) => {
                    const scopeInfo = AVAILABLE_SCOPES.find((s) => s.id === scope)
                    return (
                      <Badge
                        key={scope}
                        variant="outline"
                        className="text-[10px] bg-gray-50"
                      >
                        {scopeInfo?.label || scope}
                      </Badge>
                    )
                  })}
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      {/* New API Key Modal */}
      <AnimatePresence>
        {showNewKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowNewKeyModal(false)
              setNewlyCreatedKey(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {newlyCreatedKey ? "מפתח נוצר בהצלחה" : "צור מפתח API חדש"}
                </h3>
                <button
                  onClick={() => {
                    setShowNewKeyModal(false)
                    setNewlyCreatedKey(null)
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                {newlyCreatedKey ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <p className="font-medium text-green-800">המפתח נוצר בהצלחה!</p>
                      </div>
                      <p className="text-sm text-green-700">
                        העתק את המפתח עכשיו - לא תוכל לראות אותו שוב.
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        מפתח ה-API שלך
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-50 px-3 py-2 rounded border border-gray-200 flex-1 font-mono break-all">
                          {newlyCreatedKey.key}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyKey(newlyCreatedKey)}
                        >
                          {copiedKeyId === newlyCreatedKey.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]"
                      onClick={() => {
                        setShowNewKeyModal(false)
                        setNewlyCreatedKey(null)
                      }}
                    >
                      סיום
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        שם המפתח
                      </label>
                      <Input
                        placeholder="לדוגמה: אינטגרציה עם Zapier"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        הרשאות
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {AVAILABLE_SCOPES.map((scope) => (
                          <label
                            key={scope.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={newKeyScopes.includes(scope.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewKeyScopes([...newKeyScopes, scope.id])
                                } else {
                                  setNewKeyScopes(newKeyScopes.filter((s) => s !== scope.id))
                                }
                              }}
                              className="mt-0.5"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{scope.label}</p>
                              <p className="text-xs text-gray-500">{scope.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        className="flex-1 bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]"
                        onClick={handleCreateKey}
                        disabled={!newKeyName.trim() || newKeyScopes.length === 0}
                      >
                        צור מפתח
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowNewKeyModal(false)}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webhooks */}
      <WebhooksSection />

      {/* Integrations with Status */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-gray-400" />
              <CardTitle className="text-lg font-medium">אינטגרציות</CardTitle>
            </div>
            <Button
              size="sm"
              className="bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)] gap-1.5"
              onClick={() => setShowAddIntegrationModal(true)}
            >
              <Plus className="w-4 h-4" />
              הוסף אינטגרציה
            </Button>
          </div>
          <CardDescription>
            חבר שירותים חיצוניים כדי להרחיב את יכולות המערכת
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{integration.name}</p>
                    {getIntegrationStatusBadge(integration.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{integration.description}</p>
                  {integration.status === "connected" && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400">{integration.account}</p>
                      <span className="text-gray-300">•</span>
                      <p className="text-xs text-gray-400">סנכרון: {integration.lastSync}</p>
                    </div>
                  )}
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
                  className={integration.status === "connected" ? "" : "bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]"}
                >
                  {integration.status === "connected" ? "הגדרות" : "חבר"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add Integration Modal */}
      <AnimatePresence>
        {showAddIntegrationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddIntegrationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">הוסף אינטגרציה</h3>
                <button
                  onClick={() => setShowAddIntegrationModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4">
                  בחר שירות לחיבור למערכת Klear. האינטגרציה תאפשר סנכרון נתונים ופעולות אוטומטיות.
                </p>
                <div className="space-y-3">
                  {availableIntegrations.map((integration) => {
                    const isConnected = integrations.some(
                      (i) => i.id === integration.id && i.status === "connected"
                    )
                    return (
                      <div
                        key={integration.id}
                        className={`p-4 rounded-lg border ${
                          integration.comingSoon
                            ? "border-gray-100 bg-gray-50 opacity-60"
                            : isConnected
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
                        } transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{integration.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{integration.name}</p>
                                {integration.comingSoon && (
                                  <Badge variant="outline" className="text-[10px]">בקרוב</Badge>
                                )}
                                {isConnected && (
                                  <Badge className="bg-green-100 text-green-700 text-[10px]">מחובר</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{integration.description}</p>
                            </div>
                          </div>
                          {!integration.comingSoon && !isConnected && (
                            <Button
                              size="sm"
                              className="bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]"
                            >
                              חבר
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            <CardTitle className="text-lg font-medium">התראות</CardTitle>
          </div>
          <CardDescription>
            הגדר מתי ואיך תקבל התראות על פעילות המערכת
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              key: "escalationAlerts",
              label: "התראות הסלמה",
              desc: "קבל התראה בכל פעם ששאלה מועברת למנהל - ההתראה תישאר עד שתטופל",
              icon: AlertCircle
            },
            {
              key: "errorEmails",
              label: "התראות על שגיאות",
              desc: "קבל התראה כאשר מתרחשת שגיאה במערכת שדורשת טיפול",
              icon: XCircle
            },
            {
              key: "dailyDigest",
              label: "סיכום יומי",
              desc: "קבל סיכום של כל הפעילות מהיום הקודם בכל בוקר ב-8:00",
              icon: Bell
            },
            {
              key: "weeklyReport",
              label: "דו״ח שבועי",
              desc: "קבל דו״ח מפורט עם סטטיסטיקות ותובנות כל יום ראשון",
              icon: Bell
            },
          ].map((item) => {
            const IconComponent = item.icon
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
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
            )
          })}
        </CardContent>
      </Card>

    </div>
  )
}
