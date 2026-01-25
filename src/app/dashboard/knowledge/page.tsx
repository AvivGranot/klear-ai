"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  X,
  Upload,
  Check,
  AlertCircle,
  Plus,
  Zap,
  MessageSquare,
  Database,
  Edit3,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"
import { safeFetch } from "@/lib/safeFetch"
import { useDropzone } from "react-dropzone"
import { getAutomationPatterns, getAutomationPatternsByManager, CHOCOLATE_SHOP_TOPICS } from "@/data/jolika-data"

// Hebrew topic mapping
const TOPIC_HEBREW: Record<string, string> = {
  "משלוחים": "משלוחים",
  "הזמנות": "הזמנות",
  "מלאי ופרלינים": "מלאי ופרלינים",
  "תשלומים": "תשלומים",
  "מועדון לקוחות": "מועדון לקוחות",
  "נהלים ותפעול": "נהלים ותפעול",
  "אלרגנים": "אלרגנים",
  "שירות לקוחות": "שירות לקוחות",
  "משמרות": "משמרות",
  "אריזות": "אריזות",
  "אחר": "כללי",
  // English fallbacks
  "deliveries": "משלוחים",
  "orders": "הזמנות",
  "inventory": "מלאי ופרלינים",
  "payments": "תשלומים",
  "loyalty": "מועדון לקוחות",
  "procedures": "נהלים ותפעול",
  "allergens": "אלרגנים",
  "customers": "שירות לקוחות",
  "shifts": "משמרות",
  "packaging": "אריזות",
  "other": "כללי",
}

// Get Hebrew topic name
const getHebrewTopic = (topic: string): string => {
  return TOPIC_HEBREW[topic] || topic
}

// Scale frequency to reflect actual 28 Q&A pairs in last 12 months
// Original data has ~143 total frequency, scaling to 28
const FREQUENCY_SCALE = 0.196
const scaleFrequency = (freq: number): number => {
  return Math.max(1, Math.round(freq * FREQUENCY_SCALE))
}

// Get related topics based on current topic
const getRelatedTopics = (currentTopic: string): string[] => {
  const topicRelations: Record<string, string[]> = {
    "משלוחים": ["הזמנות", "תשלומים", "שירות לקוחות"],
    "הזמנות": ["משלוחים", "מלאי ופרלינים", "תשלומים"],
    "מלאי ופרלינים": ["הזמנות", "אלרגנים", "אריזות"],
    "תשלומים": ["הזמנות", "מועדון לקוחות", "שירות לקוחות"],
    "מועדון לקוחות": ["תשלומים", "שירות לקוחות"],
    "נהלים ותפעול": ["משמרות", "אריזות"],
    "אלרגנים": ["מלאי ופרלינים", "שירות לקוחות"],
    "שירות לקוחות": ["הזמנות", "משלוחים", "תשלומים"],
    "משמרות": ["נהלים ותפעול"],
    "אריזות": ["מלאי ופרלינים", "נהלים ותפעול"],
  }
  const hebrewTopic = getHebrewTopic(currentTopic)
  return topicRelations[hebrewTopic] || ["כללי"]
}

// Document type options for unified form
const DOCUMENT_TYPES = [
  { value: "procedure", label: "נוהל" },
  { value: "policy", label: "מדיניות" },
  { value: "faq", label: "שאלות נפוצות" },
  { value: "document", label: "מסמך" },
]

interface KnowledgeItem {
  id: string
  title: string
  titleHe: string | null
  content: string
  contentHe: string | null
  type: string
  createdAt: string
  updatedAt: string
  viewCount?: number
  media: Array<{
    id: string
    url: string
    mimeType: string
  }>
}

type UploadState = "idle" | "dragover" | "uploading" | "success" | "error"

// All Questions Modal Component
function AllQuestionsModal({
  questions,
  frequency,
  topic,
  onClose,
}: {
  questions: string[]
  frequency: number
  topic: string
  onClose: () => void
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 max-h-[80vh]"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between bg-amber-500 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-white" />
            <span className="text-lg font-semibold text-white">
              דוגמאות לשאלות ({questions.length} מתוך {frequency})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Topic Badge */}
        <div className="px-6 pt-4">
          <Badge variant="outline" className="text-sm">
            {getHebrewTopic(topic)}
          </Badge>
        </div>

        {/* Questions List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-2">
            {questions.map((question, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <span className="text-xs text-gray-400 font-medium mt-0.5">{index + 1}.</span>
                <span className="text-sm text-gray-700">{question}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Unified Content Form Component
function UnifiedContentForm({
  onClose,
  companyId,
  onSuccess,
}: {
  onClose: () => void
  companyId: string
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    titleHe: "",
    contentHe: "",
    type: "document",
  })
  const [saving, setSaving] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileUpload = async (files: File[]) => {
    setUploadState("uploading")
    setUploadProgress(0)
    setUploadError(null)

    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 40))
      setUploadProgress(i)
    }

    try {
      for (const file of files) {
        const formDataUpload = new FormData()
        formDataUpload.append("file", file)
        formDataUpload.append("companyId", companyId)

        await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        })
      }

      setUploadState("success")
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch {
      setUploadState("error")
      setUploadError("שגיאה בהעלאה. נסו שנית.")
      setTimeout(() => setUploadState("idle"), 3000)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFileUpload(acceptedFiles)
  }, [companyId])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setUploadState("dragover"),
    onDragLeave: () => setUploadState("idle"),
    multiple: true,
  })

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.titleHe,
          titleHe: formData.titleHe,
          content: formData.contentHe,
          contentHe: formData.contentHe,
          type: formData.type,
          companyId,
        }),
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="px-6 py-4 flex items-center justify-between bg-[var(--klear-green)]">
          <div className="flex items-center gap-3">
            <Plus className="w-6 h-6 text-white" />
            <span className="text-lg font-semibold text-white">הוספת תוכן</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">העלאת קובץ</label>
            <div
              {...getRootProps()}
              className={cn(
                "relative h-32 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer",
                "flex flex-col items-center justify-center",
                uploadState === "dragover" && "border-[var(--klear-green)] bg-green-50",
                uploadState === "idle" && "border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100",
                uploadState === "uploading" && "border-gray-200 bg-white",
                uploadState === "success" && "border-green-300 bg-green-50",
                uploadState === "error" && "border-red-300 bg-red-50"
              )}
            >
              <input {...getInputProps()} />
              {uploadState === "uploading" && (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[var(--klear-green)] animate-spin mb-2" />
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
              )}
              {(uploadState === "idle" || uploadState === "dragover") && (
                <>
                  <Upload className={cn("w-8 h-8 mb-2", uploadState === "dragover" ? "text-[var(--klear-green)]" : "text-gray-400")} />
                  <p className="text-sm text-gray-600">{uploadState === "dragover" ? "שחררו להעלאה" : "גררו קבצים או לחצו לבחירה"}</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, תמונות, סרטונים</p>
                </>
              )}
              {uploadState === "success" && (
                <div className="flex flex-col items-center">
                  <Check className="w-8 h-8 text-green-500 mb-2" />
                  <p className="text-sm text-green-600">הועלה בהצלחה!</p>
                </div>
              )}
              {uploadState === "error" && (
                <div className="flex flex-col items-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">או</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">כותרת</label>
              <Input
                value={formData.titleHe}
                onChange={(e) => setFormData({ ...formData, titleHe: e.target.value })}
                placeholder="כותרת הפריט"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">סוג מסמך</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--klear-green)] focus:border-transparent"
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">תוכן</label>
              <Textarea
                value={formData.contentHe}
                onChange={(e) => setFormData({ ...formData, contentHe: e.target.value })}
                placeholder="תוכן הפריט..."
                rows={4}
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]">
                {saving ? "שומר..." : "שמור"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Enhanced Automation Edit Screen Component
function AutomationEditScreen({
  pattern,
  managerName,
  onClose,
  onSave,
}: {
  pattern: {
    rawAnswer: string
    exampleQuestions: string[]
    topic: string
    frequency: number
  }
  managerName: string
  onClose: () => void
  onSave: (editedResponse: string, editedQuestions: string[]) => void
}) {
  const [editedResponse, setEditedResponse] = useState(pattern.rawAnswer)
  const [editedQuestions, setEditedQuestions] = useState<string[]>([...pattern.exampleQuestions])
  const [newQuestion, setNewQuestion] = useState("")

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setEditedQuestions([...editedQuestions, newQuestion.trim()])
      setNewQuestion("")
    }
  }

  const handleRemoveQuestion = (index: number) => {
    setEditedQuestions(editedQuestions.filter((_, i) => i !== index))
  }

  const relatedTopics = getRelatedTopics(pattern.topic)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="px-6 py-4 flex items-center justify-between bg-[var(--klear-green)] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Edit3 className="w-6 h-6 text-white" />
            <span className="text-lg font-semibold text-white">עריכת אוטומציה</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Manager & Topic Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              {managerName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{managerName}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{getHebrewTopic(pattern.topic)}</Badge>
                <Badge className="text-xs bg-amber-500 text-white">{scaleFrequency(pattern.frequency)}×</Badge>
              </div>
            </div>
          </div>

          {/* Response Editor */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">תשובה אוטומטית</label>
            <Textarea
              value={editedResponse}
              onChange={(e) => setEditedResponse(e.target.value)}
              rows={6}
              className="w-full"
              placeholder="הקלידו את התשובה האוטומטית..."
            />
          </div>

          {/* ALL Trigger Questions */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              כל השאלות שמפעילות תשובה זו ({editedQuestions.length})
            </label>
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
              {editedQuestions.map((question, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 w-5">{index + 1}.</span>
                  <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 flex-1">{question}</span>
                  <button
                    onClick={() => handleRemoveQuestion(index)}
                    className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="הוסיפו שאלה נוספת..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddQuestion())}
              />
              <Button type="button" variant="outline" onClick={handleAddQuestion}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Related Topics Section */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">נושאים קשורים</label>
            <div className="flex flex-wrap gap-2">
              {relatedTopics.map(topic => (
                <Badge key={topic} variant="outline" className="text-sm bg-blue-50 text-blue-600 border-blue-200">
                  {topic}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">נושאים אלו עשויים להכיל שאלות דומות</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button onClick={() => onSave(editedResponse, editedQuestions)} className="bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]">
              <Check className="w-4 h-4 ml-2" />
              אשר ושמור
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Automation pattern status type
type AutomationStatus = "pending" | "approved" | "rejected"

interface PatternStatus {
  status: AutomationStatus
  updatedAt: string
  editedResponse?: string
  editedQuestions?: string[]
}

// Main Page Component
export default function KnowledgePage() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContentForm, setShowContentForm] = useState(false)
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
  const [patternStatuses, setPatternStatuses] = useState<Record<string, PatternStatus>>({})
  const [actionToast, setActionToast] = useState<{ message: string; type: "success" | "info" } | null>(null)
  const [statusFilter, setStatusFilter] = useState<AutomationStatus | "all">("all")
  const [editingAutomation, setEditingAutomation] = useState<{
    pattern: { rawAnswer: string; exampleQuestions: string[]; topic: string; frequency: number }
    managerName: string
    patternIndex: number
  } | null>(null)
  const [viewingQuestions, setViewingQuestions] = useState<{
    questions: string[]
    frequency: number
    topic: string
  } | null>(null)

  // Load pattern statuses from localStorage
  useEffect(() => {
    const savedStatuses = localStorage.getItem("automationPatternStatuses")
    if (savedStatuses) {
      setPatternStatuses(JSON.parse(savedStatuses))
    }
  }, [])

  // Save pattern status
  const savePatternStatus = (patternId: string, status: AutomationStatus, editedResponse?: string, editedQuestions?: string[]) => {
    const newStatuses = {
      ...patternStatuses,
      [patternId]: { status, updatedAt: new Date().toISOString(), editedResponse, editedQuestions }
    }
    setPatternStatuses(newStatuses)
    localStorage.setItem("automationPatternStatuses", JSON.stringify(newStatuses))
  }

  const handleOpenEditScreen = (managerName: string, patternIndex: number, pattern: {
    rawAnswer: string; exampleQuestions: string[]; topic: string; frequency: number
  }) => {
    setEditingAutomation({ pattern, managerName, patternIndex })
  }

  const handleSaveAutomation = (editedResponse: string, editedQuestions: string[]) => {
    if (!editingAutomation) return
    const patternId = `${editingAutomation.managerName}-${editingAutomation.patternIndex}`
    savePatternStatus(patternId, "approved", editedResponse, editedQuestions)
    setEditingAutomation(null)
    setActionToast({ message: "התבנית אושרה ותפעל אוטומטית", type: "success" })
    setTimeout(() => setActionToast(null), 3000)
  }

  const handleReject = (managerName: string, patternIndex: number) => {
    const patternId = `${managerName}-${patternIndex}`
    savePatternStatus(patternId, "rejected")
    setActionToast({ message: "התבנית נדחתה", type: "info" })
    setTimeout(() => setActionToast(null), 3000)
  }

  const getPatternStatus = (managerName: string, patternIndex: number): AutomationStatus => {
    const patternId = `${managerName}-${patternIndex}`
    return patternStatuses[patternId]?.status || "pending"
  }

  const getPatternCounts = () => {
    const patternsByManager = getAutomationPatternsByManager()
    let pending = 0, approved = 0, rejected = 0
    Object.entries(patternsByManager).forEach(([managerName, managerPatterns]) => {
      managerPatterns.forEach((_, index) => {
        const status = getPatternStatus(managerName, index)
        if (status === "pending") pending++
        else if (status === "approved") approved++
        else rejected++
      })
    })
    return { pending, approved, rejected, total: getAutomationPatterns().length }
  }

  // Initialize
  useEffect(() => {
    async function init() {
      try {
        let seedData = await safeFetch<{ seeded: boolean; companyId: string }>("/api/seed")
        if (!seedData?.seeded) {
          await safeFetch("/api/seed", { method: "POST" })
          seedData = await safeFetch<{ seeded: boolean; companyId: string }>("/api/seed")
        }
        setCompanyId(seedData?.companyId || "demo-company-001")
      } catch {
        setCompanyId("demo-company-001")
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (companyId) loadData()
  }, [companyId])

  const loadData = async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const data = await safeFetch<{ knowledgeItems: KnowledgeItem[] }>(`/api/knowledge?companyId=${companyId}`)
      setKnowledgeItems(data?.knowledgeItems || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-96 bg-gray-200 rounded-lg animate-pulse" />
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  const patternCounts = getPatternCounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">מרכז הידע</h1>
          <p className="text-sm text-gray-500">ניהול תוכן ואוטומציות</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Right - Automation Templates (3 columns / 60%) */}
        <div className="lg:col-span-3">
          <Card className="border border-gray-200 bg-white h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    תבניות אוטומציה
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    28 שאילתות ב-12 החודשים האחרונים
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                    {patternCounts.pending} ממתינות
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                    {patternCounts.approved} אושרו
                  </Badge>
                </div>
              </div>
              {/* Status Filter */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">סנן:</span>
                {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      statusFilter === status
                        ? status === "all" ? "bg-gray-800 text-white"
                          : status === "pending" ? "bg-amber-500 text-white"
                          : status === "approved" ? "bg-green-500 text-white"
                          : "bg-gray-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {status === "all" ? "הכל" : status === "pending" ? "ממתינות" : status === "approved" ? "אושרו" : "נדחו"}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(100vh-280px)]">
              <div className="space-y-4">
                {Object.entries(getAutomationPatternsByManager()).map(([managerName, patterns]) => {
                  const filteredPatterns = patterns.map((p, i) => ({ ...p, originalIndex: i }))
                    .filter((_, index) => statusFilter === "all" || getPatternStatus(managerName, index) === statusFilter)

                  if (filteredPatterns.length === 0) return null

                  return (
                    <div key={managerName} className="space-y-2">
                      {/* Manager Header - Compact */}
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                          {managerName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{managerName}</span>
                        <span className="text-xs text-gray-400">({filteredPatterns.length})</span>
                      </div>

                      {/* Simplified Pattern Cards */}
                      {filteredPatterns.map((pattern) => {
                        const patternStatus = getPatternStatus(managerName, pattern.originalIndex)
                        const patternId = `${managerName}-${pattern.originalIndex}`
                        const savedData = patternStatuses[patternId]
                        const displayAnswer = savedData?.editedResponse || pattern.rawAnswer

                        return (
                          <motion.div
                            key={pattern.originalIndex}
                            className={cn(
                              "p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-colors",
                              patternStatus === "rejected" && "opacity-50"
                            )}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {/* Top Row: Topic + Frequency + Status */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs font-medium">
                                  {getHebrewTopic(pattern.topic)}
                                </Badge>
                                <button
                                  onClick={() => setViewingQuestions({
                                    questions: savedData?.editedQuestions || pattern.exampleQuestions,
                                    frequency: scaleFrequency(pattern.frequency),
                                    topic: pattern.topic
                                  })}
                                  className={cn(
                                    "text-xs font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors",
                                    patternStatus === "pending" && "bg-amber-100 text-amber-700 hover:bg-amber-200",
                                    patternStatus === "approved" && "bg-green-100 text-green-700 hover:bg-green-200",
                                    patternStatus === "rejected" && "bg-gray-100 text-gray-500"
                                  )}
                                >
                                  {scaleFrequency(pattern.frequency)}×
                                </button>
                              </div>
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                patternStatus === "pending" && "bg-amber-500",
                                patternStatus === "approved" && "bg-green-500",
                                patternStatus === "rejected" && "bg-gray-400"
                              )} />
                            </div>

                            {/* Hebrew Title */}
                            <p className={cn(
                              "text-sm font-medium text-gray-900 mb-1",
                              patternStatus === "rejected" && "line-through text-gray-400"
                            )}>
                              {pattern.title}
                            </p>
                            {/* Answer Preview */}
                            <p className={cn(
                              "text-xs text-gray-500 leading-relaxed",
                              patternStatus === "rejected" && "line-through text-gray-400"
                            )}>
                              {displayAnswer.slice(0, 60)}{displayAnswer.length > 60 ? "..." : ""}
                            </p>

                            {/* Questions Count (collapsed) */}
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => setViewingQuestions({
                                  questions: savedData?.editedQuestions || pattern.exampleQuestions,
                                  frequency: scaleFrequency(pattern.frequency),
                                  topic: pattern.topic
                                })}
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3" />
                                {scaleFrequency(pattern.frequency)} שאילתות ({(savedData?.editedQuestions || pattern.exampleQuestions).length} דוגמאות)
                              </button>

                              {/* Action Buttons - Subtle */}
                              {patternStatus === "pending" && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditScreen(managerName, pattern.originalIndex, {
                                      rawAnswer: pattern.rawAnswer,
                                      exampleQuestions: pattern.exampleQuestions,
                                      topic: pattern.topic,
                                      frequency: pattern.frequency,
                                    })}
                                    className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                  >
                                    אשר
                                  </button>
                                  <button
                                    onClick={() => handleReject(managerName, pattern.originalIndex)}
                                    className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
                                  >
                                    דחה
                                  </button>
                                </div>
                              )}
                              {patternStatus === "approved" && (
                                <button
                                  onClick={() => handleOpenEditScreen(managerName, pattern.originalIndex, {
                                    rawAnswer: savedData?.editedResponse || pattern.rawAnswer,
                                    exampleQuestions: savedData?.editedQuestions || pattern.exampleQuestions,
                                    topic: pattern.topic,
                                    frequency: pattern.frequency,
                                  })}
                                  className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                  ערוך
                                </button>
                              )}
                              {patternStatus === "rejected" && (
                                <button
                                  onClick={() => {
                                    const newStatuses = { ...patternStatuses }
                                    delete newStatuses[patternId]
                                    setPatternStatuses(newStatuses)
                                    localStorage.setItem("automationPatternStatuses", JSON.stringify(newStatuses))
                                  }}
                                  className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                  שחזר
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Left - Knowledge Items (2 columns / 40%) */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200 bg-white h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Database className="w-5 h-5 text-[var(--klear-green)]" />
                  מאגר הידע
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {knowledgeItems.length} פריטים
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(100vh-340px)]">
              {knowledgeItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">אין פריטים במאגר</p>
                  <p className="text-xs mt-1">הוסיפו תוכן להתחיל</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {knowledgeItems.slice(0, 15).map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.titleHe || item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {DOCUMENT_TYPES.find(t => t.value === item.type)?.label || item.type}
                          </Badge>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
            {/* Add Content Button */}
            <div className="p-4 border-t border-gray-100">
              <Button
                onClick={() => setShowContentForm(true)}
                className="w-full bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)] gap-2"
              >
                <Plus className="w-4 h-4" />
                הוסף תוכן
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {actionToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className={cn(
              "fixed top-4 left-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2",
              actionToast.type === "success" ? "bg-green-500 text-white" : "bg-gray-700 text-white"
            )}
          >
            {actionToast.type === "success" ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{actionToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Questions Modal */}
      <AnimatePresence>
        {viewingQuestions && (
          <AllQuestionsModal
            questions={viewingQuestions.questions}
            frequency={viewingQuestions.frequency}
            topic={viewingQuestions.topic}
            onClose={() => setViewingQuestions(null)}
          />
        )}
      </AnimatePresence>

      {/* Unified Content Form Modal */}
      <AnimatePresence>
        {showContentForm && companyId && (
          <UnifiedContentForm
            onClose={() => setShowContentForm(false)}
            companyId={companyId}
            onSuccess={loadData}
          />
        )}
      </AnimatePresence>

      {/* Automation Edit Screen Modal */}
      <AnimatePresence>
        {editingAutomation && (
          <AutomationEditScreen
            pattern={editingAutomation.pattern}
            managerName={editingAutomation.managerName}
            onClose={() => setEditingAutomation(null)}
            onSave={handleSaveAutomation}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
