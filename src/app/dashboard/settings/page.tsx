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
  { id: "conversation.started", label: "התחלת שיחה", description: "נשלח כאשר שיחה חדשה מתחילה" },
  { id: "conversation.ended", label: "סיום שיחה", description: "נשלח כאשר שיחה מסתיימת" },
  { id: "message.received", label: "הודעה נכנסת", description: "נשלח כאשר מתקבלת הודעה" },
  { id: "message.sent", label: "הודעה יוצאת", description: "נשלח כאשר נשלחת תשובה" },
  { id: "escalation.created", label: "הסלמה", description: "נשלח כאשר שיחה מוסלמת למנהל" },
  { id: "knowledge.updated", label: "עדכון ידע", description: "נשלח כאשר מאגר הידע מתעדכן" },
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
              <CardTitle className="text-lg font-medium">Webhooks</CardTitle>
            </div>
            <Button
              size="sm"
              className="bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)] gap-1.5"
              onClick={() => setShowNewWebhookModal(true)}
            >
              <Plus className="w-4 h-4" />
              הוסף Webhook
            </Button>
          </div>
          <CardDescription>
            קבל התראות בזמן אמת על אירועים במערכת
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Webhook className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">אין Webhooks מוגדרים</p>
              <p className="text-xs text-gray-400">הוסף webhook לקבלת התראות בזמן אמת</p>
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
              className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">הוסף Webhook חדש</h3>
                <button
                  onClick={() => setShowNewWebhookModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">שם</label>
                  <Input
                    placeholder="לדוגמה: Slack Notifications"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Endpoint URL</label>
                  <Input
                    placeholder="https://your-server.com/webhook"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">אירועים</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {WEBHOOK_EVENTS.map((event) => (
                      <label
                        key={event.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
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
                          className="mt-0.5"
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
                    צור Webhook
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
  })

  // AI Configuration state
  const [aiConfig, setAiConfig] = useState({
    tone: "professional" as "professional" | "friendly" | "casual",
    responseLength: "medium" as "short" | "medium" | "detailed",
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
                      ? "border-[var(--klear-green)] bg-[rgba(37,211,102,0.05)]"
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
                      ? "border-[var(--klear-green)] bg-[rgba(37,211,102,0.05)]"
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
                  className={integration.status === "connected" ? "" : "bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]"}
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
