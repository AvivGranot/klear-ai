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
  FileSpreadsheet,
  Image,
  Video,
  Type,
  X,
  Upload,
  HardDrive,
  Check,
  AlertCircle,
  Clock,
  ChevronLeft,
  Plus,
  Zap,
  MessageSquare,
} from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"
import { safeFetch } from "@/lib/safeFetch"
import { useDropzone, Accept } from "react-dropzone"
import { getAutomationPatterns, getAutomationPatternsByManager } from "@/data/jolika-data"

// Content type configuration
interface ContentType {
  id: string
  label: string
  icon: typeof FileText
  color: string
  bgColor: string
  hoverBg: string
  lightBg: string
  borderColor: string
  textColor: string
  accept: Accept
}

const CONTENT_TYPES: ContentType[] = [
  { id: "pdf", label: "PDF", icon: FileText, color: "red", bgColor: "bg-red-500", hoverBg: "hover:bg-red-600", lightBg: "bg-red-50", borderColor: "border-red-200", textColor: "text-red-600", accept: { "application/pdf": [".pdf"] } },
  { id: "excel", label: "Excel", icon: FileSpreadsheet, color: "green", bgColor: "bg-green-500", hoverBg: "hover:bg-green-600", lightBg: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-600", accept: { "application/vnd.ms-excel": [".xls"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "text/csv": [".csv"] } },
  { id: "word", label: "Word", icon: FileText, color: "blue", bgColor: "bg-blue-500", hoverBg: "hover:bg-blue-600", lightBg: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-600", accept: { "application/msword": [".doc"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] } },
  { id: "images", label: "תמונות", icon: Image, color: "purple", bgColor: "bg-purple-500", hoverBg: "hover:bg-purple-600", lightBg: "bg-purple-50", borderColor: "border-purple-200", textColor: "text-purple-600", accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] } },
  { id: "video", label: "סרטונים", icon: Video, color: "orange", bgColor: "bg-orange-500", hoverBg: "hover:bg-orange-600", lightBg: "bg-orange-50", borderColor: "border-orange-200", textColor: "text-orange-600", accept: { "video/*": [".mp4", ".mov", ".avi", ".webm"] } },
  { id: "text", label: "טקסט", icon: Type, color: "teal", bgColor: "bg-teal-500", hoverBg: "hover:bg-teal-600", lightBg: "bg-teal-50", borderColor: "border-teal-200", textColor: "text-teal-600", accept: {} },
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

interface RecentItem {
  id: string
  title: string
  type: string
  createdAt: string
  mimeType?: string
}

type UploadState = "idle" | "dragover" | "uploading" | "success" | "error"

// Circle position calculation for hexagonal layout
function getCirclePosition(index: number, total: number, radius: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  }
}

// ContentCircle Component
function ContentCircle({
  type,
  count,
  onClick,
  index,
  total,
  radius,
}: {
  type: ContentType
  count: number
  onClick: () => void
  index: number
  total: number
  radius: number
}) {
  const position = getCirclePosition(index, total, radius)
  const Icon = type.icon

  return (
    <motion.button
      className={cn(
        "absolute w-28 h-28 rounded-full flex flex-col items-center justify-center",
        "border-4 border-white shadow-lg cursor-pointer transition-shadow",
        type.bgColor, type.hoverBg
      )}
      style={{
        left: `calc(50% + ${position.x}px - 56px)`,
        top: `calc(50% + ${position.y}px - 56px)`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
        delay: index * 0.1,
      }}
      whileHover={{ scale: 1.1, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <Icon className="w-10 h-10 text-white mb-1" />
      <span className="text-white text-sm font-medium">{type.label}</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-800 shadow">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </motion.button>
  )
}

// CentralHub Component
function CentralHub({ totalItems, onClick }: { totalItems: number; onClick: () => void }) {
  return (
    <motion.button
      className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-[var(--klear-green)] to-[var(--klear-green-dark)] flex flex-col items-center justify-center border-4 border-white shadow-2xl cursor-pointer"
      style={{
        left: "calc(50% - 72px)",
        top: "calc(50% - 72px)",
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <span className="text-3xl font-bold text-white">{totalItems}</span>
      <span className="text-xs text-gray-300">פריטי ידע</span>
    </motion.button>
  )
}

// ExpandedUploader Component
function ExpandedUploader({
  type,
  onClose,
  companyId,
  onSuccess,
}: {
  type: ContentType
  onClose: () => void
  companyId: string
  onSuccess: () => void
}) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const Icon = type.icon

  const simulateUpload = async (files: File[]) => {
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
    simulateUpload(acceptedFiles)
  }, [companyId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setUploadState("dragover"),
    onDragLeave: () => setUploadState("idle"),
    accept: Object.keys(type.accept).length > 0 ? type.accept : undefined,
    multiple: true,
  })

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        className={cn(
          "relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden",
          type.borderColor, "border-4"
        )}
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: 50 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Header */}
        <div className={cn("px-6 py-4 flex items-center justify-between", type.bgColor)}>
          <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-white" />
            <span className="text-lg font-semibold text-white">העלאת {type.label}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "relative h-64 rounded-2xl border-3 border-dashed transition-all duration-300 cursor-pointer",
              "flex flex-col items-center justify-center",
              uploadState === "dragover" && cn(type.lightBg, type.borderColor.replace("border-", "border-")),
              uploadState === "idle" && "border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100",
              uploadState === "uploading" && "border-gray-200 bg-white",
              uploadState === "success" && "border-green-300 bg-green-50",
              uploadState === "error" && "border-red-300 bg-red-50"
            )}
          >
            <input {...getInputProps()} />

            {/* Progress Ring */}
            {uploadState === "uploading" && (
              <div className="relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={type.color === "red" ? "#ef4444" : type.color === "green" ? "#22c55e" : type.color === "blue" ? "#3b82f6" : type.color === "purple" ? "#a855f7" : type.color === "orange" ? "#f97316" : "#14b8a6"}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: uploadProgress / 100 }}
                    style={{ strokeDasharray: "251.2", strokeDashoffset: 0 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn("text-2xl font-bold", type.textColor)}>{uploadProgress}%</span>
                </div>
              </div>
            )}

            {/* Idle/Dragover State */}
            {(uploadState === "idle" || uploadState === "dragover") && (
              <>
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all",
                  uploadState === "dragover" ? type.bgColor : "bg-gray-200"
                )}>
                  <Upload className={cn("w-8 h-8", uploadState === "dragover" ? "text-white animate-bounce" : "text-gray-500")} />
                </div>
                <p className={cn("font-medium text-center", uploadState === "dragover" ? type.textColor : "text-gray-600")}>
                  {uploadState === "dragover" ? "שחררו להעלאה" : "גררו קבצים לכאן"}
                </p>
                <p className="text-sm text-gray-400 mt-1">או לחצו לבחירת קבצים</p>
              </>
            )}

            {/* Success State */}
            {uploadState === "success" && (
              <div className="flex flex-col items-center">
                <motion.div
                  className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <p className="font-medium text-green-600">הועלה בהצלחה!</p>
              </div>
            )}

            {/* Error State */}
            {uploadState === "error" && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <p className="font-medium text-red-600">שגיאה</p>
                <p className="text-sm text-red-500 mt-1">{uploadError}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// TextInputForm Component
function TextInputForm({
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

  const handleSubmit = async (e: React.FormEvent) => {
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
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-teal-200"
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: 50 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between bg-teal-500">
          <div className="flex items-center gap-3">
            <Type className="w-6 h-6 text-white" />
            <span className="text-lg font-semibold text-white">הוספת טקסט</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">סוג</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white"
            >
              <option value="document">מסמך</option>
              <option value="procedure">נוהל</option>
              <option value="policy">מדיניות</option>
              <option value="faq">שאלות נפוצות</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">תוכן</label>
            <Textarea
              value={formData.contentHe}
              onChange={(e) => setFormData({ ...formData, contentHe: e.target.value })}
              placeholder="תוכן הפריט..."
              rows={6}
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
      </motion.div>
    </motion.div>
  )
}

// RecentItems Component
function RecentItems({ items, typeFilter }: { items: RecentItem[]; typeFilter: string | null }) {
  const filteredItems = typeFilter
    ? items.filter(item => {
        if (typeFilter === "pdf") return item.mimeType?.includes("pdf")
        if (typeFilter === "excel") return item.mimeType?.includes("sheet") || item.mimeType?.includes("excel") || item.mimeType?.includes("csv")
        if (typeFilter === "word") return item.mimeType?.includes("word") || item.mimeType?.includes("document")
        if (typeFilter === "images") return item.mimeType?.startsWith("image")
        if (typeFilter === "video") return item.mimeType?.startsWith("video")
        if (typeFilter === "text") return !item.mimeType || item.type === "document"
        return true
      })
    : items

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">אין פריטים אחרונים</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filteredItems.slice(0, 5).map((item, index) => {
        const typeConfig = CONTENT_TYPES.find(t => {
          if (t.id === "pdf") return item.mimeType?.includes("pdf")
          if (t.id === "excel") return item.mimeType?.includes("sheet") || item.mimeType?.includes("excel")
          if (t.id === "word") return item.mimeType?.includes("word") || item.mimeType?.includes("document")
          if (t.id === "images") return item.mimeType?.startsWith("image")
          if (t.id === "video") return item.mimeType?.startsWith("video")
          return false
        }) || CONTENT_TYPES[5] // Default to text

        const Icon = typeConfig.icon

        return (
          <motion.div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", typeConfig.lightBg)}>
              <Icon className={cn("w-5 h-5", typeConfig.textColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
              <p className="text-xs text-gray-400">{formatRelativeTime(item.createdAt)}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// StorageIndicator Component
function StorageIndicator({ used, total }: { used: number; total: number }) {
  const percentage = (used / total) * 100

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
      <HardDrive className="w-4 h-4 text-gray-400" />
      <div className="w-32">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">אחסון</span>
          <span className="text-gray-700">{used}/{total}GB</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  )
}

// Automation pattern status type
type AutomationStatus = "pending" | "approved" | "rejected"

interface PatternStatus {
  status: AutomationStatus
  updatedAt: string
}

// Main Page Component
export default function KnowledgePage() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedType, setExpandedType] = useState<ContentType | null>(null)
  const [showTextForm, setShowTextForm] = useState(false)
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({})
  const [totalItems, setTotalItems] = useState(0)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [patternStatuses, setPatternStatuses] = useState<Record<string, PatternStatus>>({})
  const [actionToast, setActionToast] = useState<{ message: string; type: "success" | "info" } | null>(null)
  const [statusFilter, setStatusFilter] = useState<AutomationStatus | "all">("all")

  // Storage stats
  const storageUsed = 2.4
  const storageTotal = 10

  // Load pattern statuses from localStorage
  useEffect(() => {
    const savedStatuses = localStorage.getItem("automationPatternStatuses")
    if (savedStatuses) {
      setPatternStatuses(JSON.parse(savedStatuses))
    }
  }, [])

  // Save pattern statuses to localStorage
  const savePatternStatus = (patternId: string, status: AutomationStatus) => {
    const newStatuses = {
      ...patternStatuses,
      [patternId]: { status, updatedAt: new Date().toISOString() }
    }
    setPatternStatuses(newStatuses)
    localStorage.setItem("automationPatternStatuses", JSON.stringify(newStatuses))
  }

  // Handle approve automation
  const handleApprove = (managerName: string, patternIndex: number, patternAnswer: string) => {
    const patternId = `${managerName}-${patternIndex}`
    savePatternStatus(patternId, "approved")
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

      // Calculate counts by type (based on media mime type or item type)
      const counts: Record<string, number> = {
        pdf: 0,
        excel: 0,
        word: 0,
        images: 0,
        video: 0,
        text: 0,
      }

      items.forEach(item => {
        if (item.media.length > 0) {
          const mimeType = item.media[0].mimeType
          if (mimeType.includes("pdf")) counts.pdf++
          else if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("csv")) counts.excel++
          else if (mimeType.includes("word") || mimeType.includes("document")) counts.word++
          else if (mimeType.startsWith("image")) counts.images++
          else if (mimeType.startsWith("video")) counts.video++
          else counts.text++
        } else {
          counts.text++
        }
      })

      setTypeCounts(counts)
      setTotalItems(items.length)

      // Recent items
      const recent = items.slice(-10).reverse().map(item => ({
        id: item.id,
        title: item.titleHe || item.title,
        type: item.type,
        createdAt: item.createdAt,
        mimeType: item.media[0]?.mimeType,
      }))
      setRecentItems(recent)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCircleClick = (type: ContentType) => {
    if (type.id === "text") {
      setShowTextForm(true)
    } else {
      setExpandedType(type)
    }
    setSelectedFilter(type.id)
  }

  const handleCentralClick = () => {
    setSelectedFilter(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex justify-center py-12">
          <div className="w-80 h-80 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">מרכז הידע</h1>
          <p className="text-sm text-gray-500">העלו וארגנו את תוכן הידע של החברה</p>
        </div>
        <StorageIndicator used={storageUsed} total={storageTotal} />
      </div>

      {/* Pango-Style Circle Hub */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Circle Container */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-80 h-80 md:w-96 md:h-96">
            {/* Central Hub */}
            <CentralHub totalItems={totalItems} onClick={handleCentralClick} />

            {/* Content Type Circles */}
            {CONTENT_TYPES.map((type, index) => (
              <ContentCircle
                key={type.id}
                type={type}
                count={typeCounts[type.id] || 0}
                onClick={() => handleCircleClick(type)}
                index={index}
                total={CONTENT_TYPES.length}
                radius={155}
              />
            ))}
          </div>
        </div>

        {/* Recent Items Panel */}
        <div className="lg:w-80">
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">פריטים אחרונים</CardTitle>
                {selectedFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFilter(null)}
                    className="text-xs"
                  >
                    <ChevronLeft className="w-3 h-3 ml-1" />
                    הכל
                  </Button>
                )}
              </div>
              {selectedFilter && (
                <div className="flex items-center gap-2 mt-2">
                  {(() => {
                    const type = CONTENT_TYPES.find(t => t.id === selectedFilter)
                    if (!type) return null
                    const Icon = type.icon
                    return (
                      <Badge variant="outline" className={cn("text-xs", type.textColor, type.borderColor)}>
                        <Icon className="w-3 h-3 mr-1" />
                        {type.label}
                      </Badge>
                    )
                  })()}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <RecentItems items={recentItems} typeFilter={selectedFilter} />
            </CardContent>
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
            {actionToast.type === "success" ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{actionToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Automation Patterns Section - By Manager */}
      <Card className="border border-gray-200" id="automations">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              תבניות אוטומציה
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                {getPatternCounts().pending} ממתינות
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                {getPatternCounts().approved} אושרו
              </Badge>
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                {getPatternCounts().rejected} נדחו
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

                  {/* Manager's Patterns */}
                  {filteredPatterns.slice(0, 5).map((pattern) => {
                    const patternStatus = getPatternStatus(managerName, pattern.originalIndex)

                    return (
                      <motion.div
                        key={pattern.originalIndex}
                        className={cn(
                          "p-4 rounded-xl border",
                          patternStatus === "pending" && "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100",
                          patternStatus === "approved" && "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200",
                          patternStatus === "rejected" && "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 opacity-60"
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

                        {/* Answer */}
                        <p className={cn(
                          "text-sm font-medium mb-2",
                          patternStatus === "rejected" ? "text-gray-500 line-through" : "text-gray-900"
                        )}>
                          {pattern.rawAnswer.slice(0, 100)}{pattern.rawAnswer.length > 100 ? '...' : ''}
                        </p>

                        {/* Associated Media */}
                        {pattern.associatedMedia && pattern.associatedMedia.length > 0 && (
                          <div className="mb-2 flex items-center gap-2">
                            <Image className="w-4 h-4 text-purple-500" />
                            <div className="flex flex-wrap gap-1">
                              {pattern.associatedMedia.map((media, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                                  {media.type === 'image' ? '🖼️' : media.type === 'video' ? '🎬' : '📄'} {media.filename?.slice(0, 20) || 'מדיה'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Example Questions */}
                        {pattern.exampleQuestions.length > 0 && patternStatus !== "rejected" && (
                          <div className="mt-2 pt-2 border-t border-amber-100">
                            <p className="text-xs text-gray-500 mb-1">שאלות שמפעילות תשובה זו:</p>
                            <div className="flex flex-wrap gap-1">
                              {pattern.exampleQuestions.slice(0, 2).map((q, i) => (
                                <span key={i} className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-600 truncate max-w-[200px]">
                                  {q.slice(0, 40)}...
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Approval Actions */}
                        {patternStatus === "pending" && (
                          <div className="mt-3 pt-2 border-t border-amber-100 flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)] text-xs h-7"
                              onClick={() => handleApprove(managerName, pattern.originalIndex, pattern.rawAnswer)}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              אשר אוטומציה
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

                        {/* Undo action for approved/rejected */}
                        {patternStatus !== "pending" && (
                          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7 text-gray-500"
                              onClick={() => {
                                const patternId = `${managerName}-${pattern.originalIndex}`
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

      {/* Type Legend - Mobile */}
      <div className="lg:hidden flex flex-wrap items-center justify-center gap-3">
        {CONTENT_TYPES.map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.id}
              onClick={() => handleCircleClick(type)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                selectedFilter === type.id ? type.bgColor : "bg-gray-100 hover:bg-gray-200",
                selectedFilter === type.id && "text-white"
              )}
            >
              <Icon className={cn("w-4 h-4", selectedFilter === type.id ? "text-white" : type.textColor)} />
              <span className={cn("text-sm font-medium", selectedFilter === type.id ? "text-white" : "text-gray-700")}>
                {type.label}
              </span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                selectedFilter === type.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              )}>
                {typeCounts[type.id] || 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Expanded Uploader Modal */}
      <AnimatePresence>
        {expandedType && companyId && (
          <ExpandedUploader
            type={expandedType}
            onClose={() => setExpandedType(null)}
            companyId={companyId}
            onSuccess={loadData}
          />
        )}
      </AnimatePresence>

      {/* Text Input Form Modal */}
      <AnimatePresence>
        {showTextForm && companyId && (
          <TextInputForm
            onClose={() => setShowTextForm(false)}
            companyId={companyId}
            onSuccess={loadData}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
