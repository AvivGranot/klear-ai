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
  Database,
  Edit3,
  Trash2,
  Calendar,
} from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"
import { safeFetch } from "@/lib/safeFetch"
import { useDropzone } from "react-dropzone"
import { getAutomationPatterns, getAutomationPatternsByManager } from "@/data/jolika-data"

// Hebrew topic mapping - comprehensive
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
}

const getHebrewTopic = (topic: string): string => TOPIC_HEBREW[topic] || topic

// Document types
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
  media: Array<{ id: string; url: string; mimeType: string }>
}

type UploadState = "idle" | "dragover" | "uploading" | "success" | "error"
type AutomationStatus = "pending" | "approved" | "rejected"

interface PatternStatus {
  status: AutomationStatus
  updatedAt: string
  editedResponse?: string
  editedQuestions?: string[]
}

// Content Form Modal
function ContentForm({ onClose, companyId, onSuccess }: { onClose: () => void; companyId: string; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ titleHe: "", contentHe: "", type: "document" })
  const [saving, setSaving] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileUpload = async (files: File[]) => {
    setUploadState("uploading")
    setUploadProgress(0)
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 30))
      setUploadProgress(i)
    }
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("companyId", companyId)
        await fetch("/api/upload", { method: "POST", body: fd })
      }
      setUploadState("success")
      setTimeout(() => { onSuccess(); onClose() }, 1000)
    } catch {
      setUploadState("error")
      setUploadError("שגיאה בהעלאה")
      setTimeout(() => setUploadState("idle"), 2000)
    }
  }

  const onDrop = useCallback((files: File[]) => handleFileUpload(files), [companyId])
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setUploadState("dragover"),
    onDragLeave: () => setUploadState("idle"),
    multiple: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.titleHe, titleHe: formData.titleHe, content: formData.contentHe, contentHe: formData.contentHe, type: formData.type, companyId }),
      })
      onSuccess()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}>
        <div className="px-6 py-4 flex items-center justify-between bg-[#25D366]">
          <div className="flex items-center gap-3">
            <Plus className="w-6 h-6 text-white" />
            <span className="text-lg font-semibold text-white">הוספת תוכן</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5 text-white" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">העלאת קובץ</label>
            <div {...getRootProps()} className={cn("h-28 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center",
              uploadState === "dragover" && "border-[#25D366] bg-green-50",
              uploadState === "idle" && "border-gray-200 hover:border-gray-300 bg-gray-50",
              uploadState === "uploading" && "border-gray-200 bg-white",
              uploadState === "success" && "border-green-300 bg-green-50",
              uploadState === "error" && "border-red-300 bg-red-50"
            )}>
              <input {...getInputProps()} />
              {uploadState === "uploading" && <div className="flex flex-col items-center"><div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#25D366] animate-spin mb-2" /><span className="text-sm text-gray-600">{uploadProgress}%</span></div>}
              {(uploadState === "idle" || uploadState === "dragover") && <><Upload className={cn("w-7 h-7 mb-2", uploadState === "dragover" ? "text-[#25D366]" : "text-gray-400")} /><p className="text-sm text-gray-600">{uploadState === "dragover" ? "שחררו להעלאה" : "גררו קבצים או לחצו"}</p></>}
              {uploadState === "success" && <><Check className="w-7 h-7 text-green-500 mb-2" /><p className="text-sm text-green-600">הועלה!</p></>}
              {uploadState === "error" && <><AlertCircle className="w-7 h-7 text-red-500 mb-2" /><p className="text-sm text-red-600">{uploadError}</p></>}
            </div>
          </div>
          <div className="flex items-center"><div className="flex-grow border-t border-gray-200" /><span className="mx-4 text-gray-400 text-sm">או</span><div className="flex-grow border-t border-gray-200" /></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">כותרת</label><Input value={formData.titleHe} onChange={(e) => setFormData({ ...formData, titleHe: e.target.value })} placeholder="כותרת הפריט" required /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">סוג</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]">{DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1.5 block">תוכן</label><Textarea value={formData.contentHe} onChange={(e) => setFormData({ ...formData, contentHe: e.target.value })} placeholder="תוכן..." rows={3} required /></div>
            <div className="flex gap-3 pt-2"><Button type="submit" disabled={saving} className="bg-[#25D366] hover:bg-[#128C7E]">{saving ? "שומר..." : "שמור"}</Button><Button type="button" variant="outline" onClick={onClose}>ביטול</Button></div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Edit Automation Modal
function EditAutomation({ pattern, managerName, onClose, onSave }: {
  pattern: { rawAnswer: string; exampleQuestions: string[]; topic: string; frequency: number }
  managerName: string
  onClose: () => void
  onSave: (response: string, questions: string[]) => void
}) {
  const [response, setResponse] = useState(pattern.rawAnswer)
  const [questions, setQuestions] = useState([...pattern.exampleQuestions])
  const [newQ, setNewQ] = useState("")

  const addQuestion = () => { if (newQ.trim()) { setQuestions([...questions, newQ.trim()]); setNewQ("") } }
  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i))

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}>
        <div className="px-6 py-4 flex items-center justify-between bg-[#25D366] sticky top-0 z-10">
          <div className="flex items-center gap-3"><Edit3 className="w-6 h-6 text-white" /><span className="text-lg font-semibold text-white">עריכת תבנית</span></div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5 text-white" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold">{managerName.charAt(0)}</div>
            <div><p className="text-sm font-medium text-gray-900">{managerName}</p><Badge variant="outline" className="text-xs">{getHebrewTopic(pattern.topic)}</Badge></div>
          </div>
          <div><label className="text-sm font-medium text-gray-700 mb-2 block">תשובה</label><Textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={5} /></div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">שאלות מפעילות ({questions.length})</label>
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                  <span className="text-sm text-gray-700 flex-1">{q}</span>
                  <button onClick={() => removeQuestion(i)} className="p-1 hover:bg-red-100 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2"><Input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="הוסף שאלה..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addQuestion())} /><Button type="button" variant="outline" onClick={addQuestion}><Plus className="w-4 h-4" /></Button></div>
          </div>
          <div className="flex gap-3 pt-4 border-t"><Button onClick={() => onSave(response, questions)} className="bg-[#25D366] hover:bg-[#128C7E]"><Check className="w-4 h-4 ml-2" />אשר</Button><Button variant="outline" onClick={onClose}>ביטול</Button></div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Main Page
export default function KnowledgePage() {
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [statuses, setStatuses] = useState<Record<string, PatternStatus>>({})
  const [toast, setToast] = useState<{ msg: string; type: "success" | "info" } | null>(null)
  const [filter, setFilter] = useState<AutomationStatus | "all">("all")
  const [editing, setEditing] = useState<{ pattern: { rawAnswer: string; exampleQuestions: string[]; topic: string; frequency: number }; manager: string; index: number } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("automationStatuses")
    if (saved) setStatuses(JSON.parse(saved))
  }, [])

  const saveStatus = (id: string, status: AutomationStatus, response?: string, questions?: string[]) => {
    const updated = { ...statuses, [id]: { status, updatedAt: new Date().toISOString(), editedResponse: response, editedQuestions: questions } }
    setStatuses(updated)
    localStorage.setItem("automationStatuses", JSON.stringify(updated))
  }

  const getStatus = (manager: string, index: number): AutomationStatus => statuses[`${manager}-${index}`]?.status || "pending"

  const getCounts = () => {
    const patterns = getAutomationPatternsByManager()
    let pending = 0, approved = 0, rejected = 0
    Object.entries(patterns).forEach(([m, ps]) => ps.forEach((_, i) => { const s = getStatus(m, i); if (s === "pending") pending++; else if (s === "approved") approved++; else rejected++ }))
    return { pending, approved, rejected, total: getAutomationPatterns().length }
  }

  useEffect(() => {
    (async () => {
      try {
        let seed = await safeFetch<{ seeded: boolean; companyId: string }>("/api/seed")
        if (!seed?.seeded) { await safeFetch("/api/seed", { method: "POST" }); seed = await safeFetch("/api/seed") }
        setCompanyId(seed?.companyId || "demo-company-001")
      } catch { setCompanyId("demo-company-001") }
    })()
  }, [])

  useEffect(() => { if (companyId) loadData() }, [companyId])

  const loadData = async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const data = await safeFetch<{ knowledgeItems: KnowledgeItem[] }>(`/api/knowledge?companyId=${companyId}`)
      setItems(data?.knowledgeItems || [])
    } finally { setLoading(false) }
  }

  const handleSave = (response: string, questions: string[]) => {
    if (!editing) return
    saveStatus(`${editing.manager}-${editing.index}`, "approved", response, questions)
    setEditing(null)
    setToast({ msg: "התבנית אושרה", type: "success" })
    setTimeout(() => setToast(null), 2000)
  }

  const handleReject = (manager: string, index: number) => {
    saveStatus(`${manager}-${index}`, "rejected")
    setToast({ msg: "התבנית נדחתה", type: "info" })
    setTimeout(() => setToast(null), 2000)
  }

  const handleRestore = (id: string) => {
    const updated = { ...statuses }
    delete updated[id]
    setStatuses(updated)
    localStorage.setItem("automationStatuses", JSON.stringify(updated))
  }

  if (loading) return <div className="space-y-6"><div className="h-8 w-32 bg-gray-200 rounded animate-pulse" /><div className="grid grid-cols-1 lg:grid-cols-5 gap-6"><div className="lg:col-span-3 h-96 bg-gray-200 rounded-lg animate-pulse" /><div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg animate-pulse" /></div></div>

  const counts = getCounts()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">מרכז הידע</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Automations - 60% */}
        <div className="lg:col-span-3">
          <Card className="border border-gray-200 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" />תבניות אוטומציה</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">{counts.pending} ממתינות</Badge>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">{counts.approved} אושרו</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">סנן:</span>
                {(["all", "pending", "approved", "rejected"] as const).map(s => (
                  <button key={s} onClick={() => setFilter(s)} className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                    filter === s ? s === "all" ? "bg-gray-800 text-white" : s === "pending" ? "bg-amber-500 text-white" : s === "approved" ? "bg-green-500 text-white" : "bg-gray-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}>{s === "all" ? "הכל" : s === "pending" ? "ממתינות" : s === "approved" ? "אושרו" : "נדחו"}</button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(100vh-280px)]">
              <div className="space-y-4">
                {Object.entries(getAutomationPatternsByManager()).map(([manager, patterns]) => {
                  const filtered = patterns.map((p, i) => ({ ...p, idx: i })).filter((_, i) => filter === "all" || getStatus(manager, i) === filter)
                  if (!filtered.length) return null

                  return (
                    <div key={manager} className="space-y-2">
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white text-xs font-bold">{manager.charAt(0)}</div>
                        <span className="text-sm font-medium text-gray-700">{manager}</span>
                        <span className="text-xs text-gray-400">({filtered.length})</span>
                      </div>

                      {filtered.map(pattern => {
                        const status = getStatus(manager, pattern.idx)
                        const id = `${manager}-${pattern.idx}`
                        const saved = statuses[id]
                        const answer = saved?.editedResponse || pattern.rawAnswer

                        return (
                          <motion.div key={pattern.idx} className={cn("p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-colors", status === "rejected" && "opacity-50")} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{getHebrewTopic(pattern.topic)}</Badge>
                                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                                  status === "pending" && "bg-amber-100 text-amber-700",
                                  status === "approved" && "bg-green-100 text-green-700",
                                  status === "rejected" && "bg-gray-100 text-gray-500"
                                )}>{pattern.frequency}×</span>
                              </div>
                              <div className={cn("w-2 h-2 rounded-full", status === "pending" && "bg-amber-500", status === "approved" && "bg-green-500", status === "rejected" && "bg-gray-400")} />
                            </div>

                            <p className={cn("text-sm font-medium text-gray-900 mb-1", status === "rejected" && "line-through text-gray-400")}>{pattern.title}</p>
                            <p className={cn("text-xs text-gray-500", status === "rejected" && "line-through text-gray-400")}>{answer.slice(0, 80)}{answer.length > 80 ? "..." : ""}</p>

                            <div className="flex items-center justify-end mt-2">
                              {status === "pending" && (
                                <div className="flex gap-1">
                                  <button onClick={() => setEditing({ pattern: { rawAnswer: pattern.rawAnswer, exampleQuestions: pattern.exampleQuestions, topic: pattern.topic, frequency: pattern.frequency }, manager, index: pattern.idx })} className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100">אשר</button>
                                  <button onClick={() => handleReject(manager, pattern.idx)} className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-500 hover:bg-gray-100">דחה</button>
                                </div>
                              )}
                              {status === "approved" && <button onClick={() => setEditing({ pattern: { rawAnswer: saved?.editedResponse || pattern.rawAnswer, exampleQuestions: saved?.editedQuestions || pattern.exampleQuestions, topic: pattern.topic, frequency: pattern.frequency }, manager, index: pattern.idx })} className="text-xs text-gray-400 hover:text-gray-600">ערוך</button>}
                              {status === "rejected" && <button onClick={() => handleRestore(id)} className="text-xs text-gray-400 hover:text-gray-600">שחזר</button>}
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

        {/* Knowledge Items - 40% */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2"><Database className="w-5 h-5 text-[#25D366]" />מאגר הידע</CardTitle>
                <Badge variant="outline" className="text-xs">{items.length} פריטים</Badge>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(100vh-340px)]">
              {!items.length ? (
                <div className="text-center py-12 text-gray-400"><Database className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">אין פריטים</p></div>
              ) : (
                <div className="space-y-2">
                  {items.slice(0, 15).map((item, i) => (
                    <motion.div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><FileText className="w-4 h-4 text-gray-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.titleHe || item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{DOCUMENT_TYPES.find(t => t.value === item.type)?.label || item.type}</Badge>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatRelativeTime(item.createdAt)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t border-gray-100">
              <Button onClick={() => setShowForm(true)} className="w-full bg-[#25D366] hover:bg-[#128C7E] gap-2"><Plus className="w-4 h-4" />הוסף תוכן</Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -50, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -50 }} className={cn("fixed top-4 left-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2", toast.type === "success" ? "bg-green-500 text-white" : "bg-gray-700 text-white")}>
            {toast.type === "success" ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>{showForm && companyId && <ContentForm onClose={() => setShowForm(false)} companyId={companyId} onSuccess={loadData} />}</AnimatePresence>
      <AnimatePresence>{editing && <EditAutomation pattern={editing.pattern} managerName={editing.manager} onClose={() => setEditing(null)} onSave={handleSave} />}</AnimatePresence>
    </div>
  )
}
