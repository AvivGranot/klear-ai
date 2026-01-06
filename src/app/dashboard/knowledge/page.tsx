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
type ModalType = "none" | "text" | "upload" | "url"

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

  // Storage stats (mock data)
  const storageUsed = 2.4 // GB
  const storageTotal = 10 // GB
  const storagePercent = (storageUsed / storageTotal) * 100

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "video/*": [],
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) return

    setSaving(true)

    try {
      const uploadedMediaUrls: string[] = []
      for (const file of uploadedFiles) {
        const formDataUpload = new FormData()
        formDataUpload.append("file", file)
        formDataUpload.append("companyId", companyId)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          uploadedMediaUrls.push(uploadData.url)
        }
      }

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

  if (loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Storage Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">נכסי ידע</h1>
          <p className="text-sm text-gray-500">נהלו את התיעוד והמשאבים של החברה</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Storage Indicator */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <HardDrive className="w-4 h-4 text-gray-400" />
            <div className="w-24">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">אחסון</span>
                <span className="text-gray-700">{storageUsed}GB / {storageTotal}GB</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full transition-all"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </div>
          </div>
          <Button onClick={() => setModalType("text")} className="gap-2 bg-gray-900 hover:bg-gray-800">
            <Plus className="w-4 h-4" />
            העלאת נכס
          </Button>
        </div>
      </div>

      {/* Action Cards - ElevenLabs Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setModalType("url")}
          className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-right"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">הוסף קישור</h3>
            <p className="text-sm text-gray-500">הוסף URL לאינדקס</p>
          </div>
        </button>

        <button
          onClick={() => setModalType("upload")}
          className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-right"
        >
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
            <FileUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">העלה קבצים</h3>
            <p className="text-sm text-gray-500">PDF, Word, Excel</p>
          </div>
        </button>

        <button
          onClick={() => setModalType("text")}
          className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-right"
        >
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
            <Type className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">צור טקסט</h3>
            <p className="text-sm text-gray-500">הזן תוכן ידנית</p>
          </div>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חפש במאגר הידע..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {(["all", "document", "procedure", "policy", "faq"] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors",
                filterType === type
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {type === "all" ? "הכל" : typeLabels[type]} ({typeCounts[type]})
            </button>
          ))}
        </div>
      </div>

      {/* URL Modal */}
      {modalType === "url" && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-gray-200">
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
                    <Link className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                  <Button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-800">
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

      {/* Upload Modal */}
      {modalType === "upload" && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
              <CardTitle className="text-lg font-medium">העלה קבצים</CardTitle>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 font-medium">גרור קבצים לכאן</p>
                <p className="text-sm text-gray-400 mt-1">או לחץ לבחירה</p>
                <p className="text-xs text-gray-400 mt-3">
                  PDF, Word, Excel, תמונות וסרטונים
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-700 truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedFiles((prev) =>
                            prev.filter((_, index) => index !== i)
                          )
                        }
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={saving || uploadedFiles.length === 0}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  {saving ? "מעלה..." : "העלה קבצים"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  ביטול
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Text/Edit Modal */}
      {modalType === "text" && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
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
                  <Button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-800">
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
      <Card className="border border-gray-200 overflow-hidden">
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
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
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
            <p className="text-sm text-gray-400 mt-1">התחל להוסיף נהלים, מדיניות והנחיות</p>
            <Button
              onClick={() => setModalType("text")}
              className="mt-4 gap-2 bg-gray-900 hover:bg-gray-800"
            >
              <Plus className="w-4 h-4" />
              הוסף פריט ראשון
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
