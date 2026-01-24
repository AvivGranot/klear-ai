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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { safeFetch } from "@/lib/safeFetch"
import { useDropzone } from "react-dropzone"
import { getAutomationPatterns, getAutomationPatternsByManager } from "@/data/jolika-data"

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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
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
    setUploadedFiles(acceptedFiles)
    handleFileUpload(acceptedFiles)
  }, [companyId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between bg-[var(--klear-green)]">
          <div className="flex items-center gap-3">
            <Plus className="w-6 h-6 text-white" />
            <span className="text-lg font-semibold text-white">הוספת תוכן</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Upload Section */}
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
                  <p className="text-sm text-gray-600">
                    {uploadState === "dragover" ? "שחררו להעלאה" : "גררו קבצים או לחצו לבחירה"}
                  </p>
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

          {/* Text Form Section */}
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
              <Button type="button" variant="outline" onClick={onClose}>
                ביטול
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Automation Edit Screen Component
function AutomationEditScreen({
  pattern,
  managerName,
  patternIndex,
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
  patternIndex: number
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

  const handleSave = () => {
    onSave(editedResponse, editedQuestions)
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
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between bg-[var(--klear-green)] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Edit3 className="w-6 h-6 text-white" />
            <span className="text-lg font-semibold text-white">עריכת אוטומציה</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Manager Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              {managerName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{managerName}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{pattern.topic}</Badge>
                <Badge className="text-xs bg-amber-500 text-white">{pattern.frequency}x</Badge>
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

          {/* Trigger Questions */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">שאלות שמפעילות תשובה זו</label>
            <div className="space-y-2 mb-3">
              {editedQuestions.map((question, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
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

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              onClick={handleSave}
              className="bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]"
            >
              <Check className="w-4 h-4 ml-2" />
              אשר ושמור
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
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
  const [totalItems, setTotalItems] = useState(0)
  const [patternStatuses, setPatternStatuses] = useState<Record<string, PatternStatus>>({})
  const [actionToast, setActionToast] = useState<{ message: string; type: "success" | "info" } | null>(null)
  const [statusFilter, setStatusFilter] = useState<AutomationStatus | "all">("all")
  const [editingAutomation, setEditingAutomation] = useState<{
    pattern: {
      rawAnswer: string
      exampleQuestions: string[]
      topic: string
      frequency: number
    }
    managerName: string
    patternIndex: number
  } | null>(null)

  // Load pattern statuses from localStorage
  useEffect(() => {
    const savedStatuses = localStorage.getItem("automationPatternStatuses")
    if (savedStatuses) {
      setPatternStatuses(JSON.parse(savedStatuses))
    }
  }, [])

  // Save pattern status to localStorage
  const savePatternStatus = (patternId: string, status: AutomationStatus, editedResponse?: string, editedQuestions?: string[]) => {
    const newStatuses = {
      ...patternStatuses,
      [patternId]: {
        status,
        updatedAt: new Date().toISOString(),
        editedResponse,
        editedQuestions,
      }
    }
    setPatternStatuses(newStatuses)
    localStorage.setItem("automationPatternStatuses", JSON.stringify(newStatuses))
  }

  // Handle opening edit screen
  const handleOpenEditScreen = (managerName: string, patternIndex: number, pattern: {
    rawAnswer: string
    exampleQuestions: string[]
    topic: string
    frequency: number
  }) => {
    setEditingAutomation({ pattern, managerName, patternIndex })
  }

  // Handle save from edit screen
  const handleSaveAutomation = (editedResponse: string, editedQuestions: string[]) => {
    if (!editingAutomation) return

    const patternId = `${editingAutomation.managerName}-${editingAutomation.patternIndex}`
    savePatternStatus(patternId, "approved", editedResponse, editedQuestions)
    setEditingAutomation(null)
    setActionToast({ message: "התבנית אושרה ותפעל אוטומטית", type: "success" })
    setTimeout(() => setActionToast(null), 3000)
  }

  // Handle reject automation
  const handleReject = (managerName: string, patternIndex: number) => {
    const patternId = `${managerName}-${patternIndex}`
    savePatternStatus(patternId, "rejected")
    setActionToast({ message: "התבנית נדחתה", type: "info" })
    setTimeout(() => setActionToast(null), 3000)
  }

  // Get pattern status
  const getPatternStatus = (managerName: string, patternIndex: number): AutomationStatus => {
    const patternId = `${managerName}-${patternIndex}`
    return patternStatuses[patternId]?.status || "pending"
  }

  // Count patterns by status
  const getPatternCounts = () => {
    const patterns = getAutomationPatterns()
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

    return { pending, approved, rejected, total: patterns.length }
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

        if (seedData?.companyId) {
          setCompanyId(seedData.companyId)
        } else {
          setCompanyId("demo-company-001")
        }
      } catch {
        setCompanyId("demo-company-001")
      }
    }
    init()
  }, [])

  // Load data
  useEffect(() => {
    if (!companyId) return
    loadData()
  }, [companyId])

  const loadData = async () => {
    if (!companyId) return
    setLoading(true)

    try {
      const data = await safeFetch<{ knowledgeItems: KnowledgeItem[] }>(`/api/knowledge?companyId=${companyId}`)
      const items = data?.knowledgeItems || []
      setTotalItems(items.length)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  const patternCounts = getPatternCounts()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">מרכז הידע</h1>
          <p className="text-sm text-gray-500">העלו וארגנו את תוכן הידע של החברה</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Knowledge Items Count */}
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--klear-green)] flex items-center justify-center">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
                <p className="text-sm text-gray-500">פריטי ידע במאגר</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automation Status Count */}
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-500 flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-3xl font-bold text-gray-900">{patternCounts.total}</p>
                <p className="text-sm text-gray-500">תבניות אוטומציה</p>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-amber-600">{patternCounts.pending} ממתינות</span>
                <span className="text-green-600">{patternCounts.approved} אושרו</span>
                <span className="text-gray-500">{patternCounts.rejected} נדחו</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Patterns Section */}
      <Card className="border border-gray-200 bg-white" id="automations">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              תבניות אוטומציה
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                {patternCounts.pending} ממתינות
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                {patternCounts.approved} אושרו
              </Badge>
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                {patternCounts.rejected} נדחו
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            תשובות חוזרות מהמנהלים שיכולות להיות אוטומטיות
          </p>
          {/* Status Filter */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-500">סנן לפי:</span>
            {(["all", "pending", "approved", "rejected"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  statusFilter === status
                    ? status === "all" ? "bg-[var(--klear-green)] text-white"
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
        <CardContent>
          <div className="space-y-6">
            {Object.entries(getAutomationPatternsByManager()).map(([managerName, patterns]) => {
              // Filter patterns based on status
              const filteredPatterns = patterns.map((p, i) => ({ ...p, originalIndex: i }))
                .filter((_, index) => {
                  if (statusFilter === "all") return true
                  return getPatternStatus(managerName, index) === statusFilter
                })

              if (filteredPatterns.length === 0) return null

              return (
                <div key={managerName} className="space-y-3">
                  {/* Manager Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      {managerName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{managerName}</p>
                      <p className="text-xs text-gray-500">{filteredPatterns.length} תבניות</p>
                    </div>
                  </div>

                  {/* Manager's Patterns - Clean white cards */}
                  {filteredPatterns.slice(0, 5).map((pattern) => {
                    const patternStatus = getPatternStatus(managerName, pattern.originalIndex)
                    const patternId = `${managerName}-${pattern.originalIndex}`
                    const savedData = patternStatuses[patternId]

                    return (
                      <motion.div
                        key={pattern.originalIndex}
                        className={cn(
                          "p-4 rounded-xl bg-white border border-gray-200",
                          patternStatus === "rejected" && "opacity-60"
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: pattern.originalIndex * 0.05 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className={cn(
                              "w-4 h-4",
                              patternStatus === "pending" && "text-amber-600",
                              patternStatus === "approved" && "text-green-600",
                              patternStatus === "rejected" && "text-gray-400"
                            )} />
                            <Badge className={cn(
                              "text-white text-xs",
                              patternStatus === "pending" && "bg-amber-500",
                              patternStatus === "approved" && "bg-green-500",
                              patternStatus === "rejected" && "bg-gray-400"
                            )}>
                              {pattern.frequency}x
                            </Badge>
                            <Badge variant="outline" className={cn(
                              "text-xs",
                              patternStatus === "pending" && "bg-amber-50 text-amber-600 border-amber-200",
                              patternStatus === "approved" && "bg-green-50 text-green-600 border-green-200",
                              patternStatus === "rejected" && "bg-gray-50 text-gray-500 border-gray-200"
                            )}>
                              {patternStatus === "pending" ? "ממתין לאישור" : patternStatus === "approved" ? "✓ אושר" : "נדחה"}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {pattern.topic}
                          </Badge>
                        </div>

                        {/* Answer - show edited if available */}
                        <p className={cn(
                          "text-sm font-medium mb-2 text-gray-900",
                          patternStatus === "rejected" && "text-gray-500 line-through"
                        )}>
                          {(savedData?.editedResponse || pattern.rawAnswer).slice(0, 100)}
                          {(savedData?.editedResponse || pattern.rawAnswer).length > 100 ? '...' : ''}
                        </p>

                        {/* Example Questions - Show ALL questions */}
                        {(savedData?.editedQuestions || pattern.exampleQuestions).length > 0 && patternStatus !== "rejected" && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">שאלות שמפעילות תשובה זו:</p>
                            <div className="flex flex-wrap gap-1">
                              {(savedData?.editedQuestions || pattern.exampleQuestions).map((q, i) => (
                                <span key={i} className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200 text-gray-600">
                                  {q}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Approval Actions */}
                        {patternStatus === "pending" && (
                          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)] text-xs h-7"
                              onClick={() => handleOpenEditScreen(managerName, pattern.originalIndex, {
                                rawAnswer: pattern.rawAnswer,
                                exampleQuestions: pattern.exampleQuestions,
                                topic: pattern.topic,
                                frequency: pattern.frequency,
                              })}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              אשר
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={() => handleReject(managerName, pattern.originalIndex)}
                            >
                              <X className="w-3 h-3 mr-1" />
                              דחה
                            </Button>
                          </div>
                        )}

                        {/* Edit/Undo for approved/rejected */}
                        {patternStatus !== "pending" && (
                          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-2">
                            {patternStatus === "approved" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-7 text-gray-600"
                                onClick={() => handleOpenEditScreen(managerName, pattern.originalIndex, {
                                  rawAnswer: savedData?.editedResponse || pattern.rawAnswer,
                                  exampleQuestions: savedData?.editedQuestions || pattern.exampleQuestions,
                                  topic: pattern.topic,
                                  frequency: pattern.frequency,
                                })}
                              >
                                <Edit3 className="w-3 h-3 mr-1" />
                                ערוך
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7 text-gray-500"
                              onClick={() => {
                                const newStatuses = { ...patternStatuses }
                                delete newStatuses[patternId]
                                setPatternStatuses(newStatuses)
                                localStorage.setItem("automationPatternStatuses", JSON.stringify(newStatuses))
                                setActionToast({ message: "הוחזר לממתין לאישור", type: "info" })
                                setTimeout(() => setActionToast(null), 3000)
                              }}
                            >
                              ↩ בטל והחזר לממתין
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Content Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowContentForm(true)}
          size="lg"
          className="bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)] gap-2 px-8"
        >
          <Plus className="w-5 h-5" />
          הוסף תוכן
        </Button>
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
            {actionToast.type === "success" ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{actionToast.message}</span>
          </motion.div>
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
            patternIndex={editingAutomation.patternIndex}
            onClose={() => setEditingAutomation(null)}
            onSave={handleSaveAutomation}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
