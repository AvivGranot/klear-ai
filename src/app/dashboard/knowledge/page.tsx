"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  FileVideo,
  Image,
  X,
  Upload,
  Filter,
  Globe,
  FileUp,
  Type,
  HardDrive,
  Link,
  Check,
  AlertCircle,
  Cloud,
  Copy,
  Download,
  FileSpreadsheet,
  Presentation,
} from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"
import { safeFetch } from "@/lib/safeFetch"
import { useDropzone } from "react-dropzone"

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
  category?: {
    id: string
    name: string
    nameHe: string
  }
  media: Array<{
    id: string
    url: string
    mimeType: string
  }>
}

type FilterType = "all" | "document" | "procedure" | "policy" | "faq"
type ModalType = "none" | "text" | "url"
type UploadState = "idle" | "dragover" | "uploading" | "success" | "error"

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [modalType, setModalType] = useState<ModalType>("none")
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    titleHe: "",
    content: "",
    contentHe: "",
    type: "document",
  })
  const [urlInput, setUrlInput] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Storage stats (mock data)
  const storageUsed = 2.4 // GB
  const storageTotal = 10 // GB
  const storagePercent = (storageUsed / storageTotal) * 100

  // File size limits
  const fileSizeLimits: Record<string, number> = {
    "application/pdf": 25,
    "application/msword": 25,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 25,
    "text/plain": 25,
    "application/vnd.ms-excel": 15,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": 15,
    "text/csv": 15,
    "application/vnd.ms-powerpoint": 30,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": 30,
    "image/png": 10,
    "image/jpeg": 10,
    "image/jpg": 10,
  }

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
      } catch (e) {
        console.error(e)
        setCompanyId("demo-company-001")
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!companyId) return
    loadItems()
  }, [companyId])

  const loadItems = async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ companyId })
      if (filterType !== "all") params.append("type", filterType)
      if (searchQuery) params.append("search", searchQuery)

      const data = await safeFetch<{ knowledgeItems: KnowledgeItem[] }>(`/api/knowledge?${params}`)
      setItems(data?.knowledgeItems || [])
    } catch (e) {
      console.error("Error loading knowledge items:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (companyId) {
      const timeoutId = setTimeout(loadItems, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, filterType, companyId])

  const validateFile = (file: File): string | null => {
    const maxSize = fileSizeLimits[file.type] || 10
    const fileSizeMB = file.size / 1024 / 1024
    if (fileSizeMB > maxSize) {
      return `הקובץ "${file.name}" גדול מדי. מקסימום ${maxSize}MB`
    }
    return null
  }

  const simulateUpload = async (files: File[]) => {
    setUploadState("uploading")
    setUploadProgress(0)
    setUploadError(null)

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 50))
      setUploadProgress(i)
    }

    // Simulate API call
    try {
      if (!companyId) throw new Error("No company ID")

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
        setUploadState("idle")
        setUploadedFiles([])
        loadItems()
      }, 2000)
    } catch (e) {
      setUploadState("error")
      setUploadError("שגיאה בהעלאה. נסו שנית.")
      setTimeout(() => {
        setUploadState("idle")
        setUploadError(null)
      }, 3000)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate files
    for (const file of acceptedFiles) {
      const error = validateFile(file)
      if (error) {
        setUploadState("error")
        setUploadError(error)
        setTimeout(() => {
          setUploadState("idle")
          setUploadError(null)
        }, 3000)
        return
      }
    }

    setUploadedFiles(acceptedFiles)
    simulateUpload(acceptedFiles)
  }, [companyId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setUploadState("dragover"),
    onDragLeave: () => setUploadState("idle"),
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    multiple: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    setSaving(true)

    try {
      const method = editingItem ? "PUT" : "POST"
      const body = {
        ...(editingItem && { id: editingItem.id }),
        ...formData,
        companyId,
      }

      const res = await fetch("/api/knowledge", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        resetForm()
        loadItems()
      }
    } catch (e) {
      console.error("Error saving knowledge item:", e)
    } finally {
      setSaving(false)
    }
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !urlInput.trim()) return

    setSaving(true)
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: urlInput,
          titleHe: urlInput,
          content: `URL: ${urlInput}`,
          contentHe: `קישור: ${urlInput}`,
          type: "document",
          companyId,
        }),
      })

      if (res.ok) {
        setUrlInput("")
        setModalType("none")
        loadItems()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      titleHe: "",
      content: "",
      contentHe: "",
      type: "document",
    })
    setUploadedFiles([])
    setModalType("none")
    setEditingItem(null)
  }

  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      titleHe: item.titleHe || "",
      content: item.content,
      contentHe: item.contentHe || "",
      type: item.type,
    })
    setModalType("text")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק פריט זה?")) return

    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" })
    loadItems()
  }

  const typeLabels: Record<string, string> = {
    document: "מסמך",
    procedure: "נוהל",
    policy: "מדיניות",
    faq: "שאלות נפוצות",
  }

  const typeIcons: Record<string, React.ReactNode> = {
    document: <FileText className="w-4 h-4" />,
    procedure: <BookOpen className="w-4 h-4" />,
    policy: <FileText className="w-4 h-4" />,
    faq: <BookOpen className="w-4 h-4" />,
  }

  const typeCounts = {
    all: items.length,
    document: items.filter(i => i.type === "document").length,
    procedure: items.filter(i => i.type === "procedure").length,
    policy: items.filter(i => i.type === "policy").length,
    faq: items.filter(i => i.type === "faq").length,
  }

  // Get upload circle styles based on state
  const getCircleStyles = () => {
    switch (uploadState) {
      case "dragover":
        return "border-emerald-500 bg-emerald-50 scale-105 shadow-xl shadow-emerald-200"
      case "uploading":
        return "border-emerald-500 bg-white"
      case "success":
        return "border-emerald-500 bg-emerald-50"
      case "error":
        return "border-red-500 bg-red-50 animate-shake"
      default:
        return "border-gray-200 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/30 hover:scale-[1.02]"
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex justify-center py-12">
          <div className="w-72 h-72 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">נכסי ידע</h1>
          <p className="text-sm text-gray-500">נהלו את התיעוד והמשאבים של החברה</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="חיפוש..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>
          {/* Storage Indicator */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <HardDrive className="w-4 h-4 text-gray-400" />
            <div className="w-24">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">אחסון</span>
                <span className="text-gray-700">{storageUsed}/{storageTotal}GB</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Upload Circle - Pango Style */}
      <div className="flex flex-col items-center py-8">
        <div
          {...getRootProps()}
          className={cn(
            "relative w-72 h-72 rounded-full cursor-pointer transition-all duration-300 ease-out",
            "flex flex-col items-center justify-center",
            "border-4 border-dashed",
            getCircleStyles()
          )}
          style={{
            // Progress ring using conic gradient
            background: uploadState === "uploading"
              ? `conic-gradient(#10B981 ${uploadProgress * 3.6}deg, #f3f4f6 0deg)`
              : undefined,
          }}
        >
          {/* Inner circle for uploading state */}
          {uploadState === "uploading" && (
            <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-emerald-600">{uploadProgress}%</span>
              <span className="text-sm text-gray-500 mt-1">מעלה...</span>
              {uploadedFiles[0] && (
                <span className="text-xs text-gray-400 mt-2 max-w-[150px] truncate">
                  {uploadedFiles[0].name}
                </span>
              )}
            </div>
          )}

          {/* Default/Hover/Dragover state */}
          {(uploadState === "idle" || uploadState === "dragover") && (
            <>
              <input {...getInputProps()} />
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-300",
                uploadState === "dragover"
                  ? "bg-emerald-500 scale-110"
                  : "bg-gradient-to-br from-emerald-400 to-emerald-600"
              )}>
                <Cloud className={cn(
                  "w-12 h-12 text-white transition-transform",
                  uploadState === "dragover" && "animate-bounce"
                )} />
              </div>
              <p className={cn(
                "font-semibold text-lg transition-colors text-center",
                uploadState === "dragover" ? "text-emerald-600" : "text-gray-700"
              )}>
                {uploadState === "dragover" ? "שחררו להעלאה" : "גררו קבצים לכאן"}
              </p>
              <p className="text-sm text-gray-400 mt-1">או לחצו להעלאה</p>
              <p className="text-xs text-gray-400 mt-3">PDF, Word, Excel עד 25MB</p>
            </>
          )}

          {/* Success state */}
          {uploadState === "success" && (
            <div className="flex flex-col items-center justify-center animate-in zoom-in duration-300">
              <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                <Check className="w-14 h-14 text-white" />
              </div>
              <p className="font-semibold text-lg text-emerald-600">הועלה בהצלחה!</p>
            </div>
          )}

          {/* Error state */}
          {uploadState === "error" && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center mb-4">
                <AlertCircle className="w-14 h-14 text-white" />
              </div>
              <p className="font-semibold text-lg text-red-600">שגיאה</p>
              <p className="text-sm text-red-500 mt-1 text-center px-8">{uploadError}</p>
            </div>
          )}
        </div>

        {/* Supported formats badges */}
        <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
            <FileText className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-gray-600">PDF</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-gray-600">Word</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs text-gray-600">Excel</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
            <Presentation className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs text-gray-600">PowerPoint</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
            <Image className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs text-gray-600">תמונות</span>
          </div>
        </div>

        {/* Secondary Action Buttons */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setModalType("url")}
            className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all w-28"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Link className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">קישור</span>
          </button>

          <button
            onClick={() => setModalType("text")}
            className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all w-28"
          >
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Type className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">טקסט</span>
          </button>

          <button
            onClick={() => {
              setFormData({
                title: "",
                titleHe: "תבנית חדשה",
                content: "",
                contentHe: "תוכן התבנית...",
                type: "procedure",
              })
              setModalType("text")
            }}
            className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all w-28"
          >
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <Copy className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">תבנית</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        {(["all", "document", "procedure", "policy", "faq"] as FilterType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              "px-4 py-2 text-sm rounded-full transition-colors",
              filterType === type
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {type === "all" ? "הכל" : typeLabels[type]} ({typeCounts[type]})
          </button>
        ))}
      </div>

      {/* URL Modal */}
      {modalType === "url" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-gray-200 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
              <CardTitle className="text-lg font-medium">הוסף קישור</CardTitle>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    כתובת URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/document"
                      className="pr-9"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    הקישור יאונדקס ויתווסף למאגר הידע
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                    {saving ? "מוסיף..." : "הוסף קישור"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    ביטול
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Text/Edit Modal */}
      {modalType === "text" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
              <CardTitle className="text-lg font-medium">
                {editingItem ? "ערוך פריט ידע" : "צור פריט ידע חדש"}
              </CardTitle>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      כותרת (עברית)
                    </label>
                    <Input
                      value={formData.titleHe}
                      onChange={(e) =>
                        setFormData({ ...formData, titleHe: e.target.value })
                      }
                      placeholder="כותרת בעברית"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Title (English)
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Title in English"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    סוג
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white"
                  >
                    <option value="document">מסמך</option>
                    <option value="procedure">נוהל</option>
                    <option value="policy">מדיניות</option>
                    <option value="faq">שאלות נפוצות</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    תוכן (עברית)
                  </label>
                  <Textarea
                    value={formData.contentHe}
                    onChange={(e) =>
                      setFormData({ ...formData, contentHe: e.target.value })
                    }
                    placeholder="תוכן בעברית..."
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Content (English)
                  </label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Content in English..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                    {saving ? "שומר..." : editingItem ? "עדכן" : "שמור"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    ביטול
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Knowledge Items Table */}
      <Card className="border border-gray-200 overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  כותרת
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  סוג
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  מדיה
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  עודכן
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                        {item.media.length > 0 ? (
                          item.media[0].mimeType.startsWith("video") ? (
                            <FileVideo className="w-5 h-5" />
                          ) : (
                            <Image className="w-5 h-5" />
                          )
                        ) : (
                          typeIcons[item.type]
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">
                          {item.titleHe || item.title}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                          {item.contentHe || item.content}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className="text-xs">
                      {typeLabels[item.type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    {item.media.length > 0 ? (
                      <div className="flex -space-x-2">
                        {item.media.slice(0, 3).map((m) => (
                          <div
                            key={m.id}
                            className="w-8 h-8 bg-gray-100 rounded border-2 border-white overflow-hidden"
                          >
                            {m.mimeType.startsWith("image") ? (
                              <img
                                src={m.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileVideo className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                        ))}
                        {item.media.length > 3 && (
                          <div className="w-8 h-8 bg-gray-100 rounded border-2 border-white flex items-center justify-center text-xs text-gray-500">
                            +{item.media.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {formatRelativeTime(item.updatedAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        title="עריכה"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="שכפול"
                        onClick={() => {
                          setFormData({
                            title: item.title,
                            titleHe: (item.titleHe || "") + " (עותק)",
                            content: item.content,
                            contentHe: item.contentHe || "",
                            type: item.type,
                          })
                          setModalType("text")
                        }}
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        title="מחיקה"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && !loading && (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">אין פריטי ידע</p>
            <p className="text-sm text-gray-400 mt-1">גררו קבצים לעיגול למעלה להתחלה</p>
          </div>
        )}
      </Card>

      {/* Add shake animation to global styles */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
