"use client"

import { useState, useEffect, useCallback } from "react"
import {
  AlertCircle,
  Clock,
  CheckCircle,
  MessageSquare,
  Send,
  RefreshCw,
  Inbox,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Escalation {
  id: string
  companyId: string
  question: string
  conversationId: string | null
  status: 'pending' | 'in_progress' | 'resolved'
  managerResponse: string | null
  priority: number
  createdAt: string
  resolvedAt: string | null
  resolvedBy: string | null
  shouldAddToKB: boolean
}

interface EscalationCounts {
  pending: number
  in_progress: number
  resolved: number
}

const STATUS_TABS = [
  { value: 'pending', label: 'ממתין', icon: Clock, color: 'text-orange-600 bg-orange-100' },
  { value: 'in_progress', label: 'בטיפול', icon: AlertCircle, color: 'text-blue-600 bg-blue-100' },
  { value: 'resolved', label: 'נפתר', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
] as const

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'עכשיו'
  if (diffMins < 60) return `לפני ${diffMins} דקות`
  if (diffHours < 24) return `לפני ${diffHours} שעות`
  if (diffDays < 7) return `לפני ${diffDays} ימים`

  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
  })
}

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([])
  const [counts, setCounts] = useState<EscalationCounts>({ pending: 0, in_progress: 0, resolved: 0 })
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'resolved'>('pending')
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null)
  const [response, setResponse] = useState('')
  const [shouldAddToKB, setShouldAddToKB] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const fetchEscalations = useCallback(async () => {
    try {
      const res = await fetch(`/api/escalations?status=${activeTab}`)
      if (res.ok) {
        const data = await res.json()
        setEscalations(data.escalations)
        setCounts(data.counts)
      }
    } catch (error) {
      console.error('Failed to fetch escalations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchEscalations()
    // Poll for new escalations every 30 seconds
    const interval = setInterval(fetchEscalations, 30000)
    return () => clearInterval(interval)
  }, [fetchEscalations])

  const handleSelectEscalation = (escalation: Escalation) => {
    setSelectedEscalation(escalation)
    setResponse(escalation.managerResponse || '')
    setShouldAddToKB(escalation.shouldAddToKB)
  }

  const handleSendResponse = async () => {
    if (!selectedEscalation || !response.trim()) return

    setIsSending(true)
    try {
      const res = await fetch('/api/escalations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalationId: selectedEscalation.id,
          response: response.trim(),
          status: 'resolved',
          shouldAddToKB,
        }),
      })

      if (res.ok) {
        // Refresh and clear selection
        await fetchEscalations()
        setSelectedEscalation(null)
        setResponse('')
      }
    } catch (error) {
      console.error('Failed to send response:', error)
    } finally {
      setIsSending(false)
    }
  }

  const filteredEscalations = escalations.filter(e => e.status === activeTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">שאלות ושיחות</h1>
          <p className="text-gray-500 mt-1">שאלות שהועברו על ידי עובדים לטיפול מנהל</p>
        </div>
        <button
          onClick={fetchEscalations}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          רענן
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((tab) => {
          const count = counts[tab.value]
          const Icon = tab.icon
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value)
                setSelectedEscalation(null)
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive && tab.color.split(' ')[0])} />
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  isActive ? tab.color : "bg-gray-200 text-gray-600"
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Escalations List */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              {STATUS_TABS.find(t => t.value === activeTab)?.label}
              <span className="text-gray-400 text-sm">({filteredEscalations.length})</span>
            </h2>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {filteredEscalations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Inbox className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  {activeTab === 'pending' && 'אין שאלות ממתינות'}
                  {activeTab === 'in_progress' && 'אין שאלות בטיפול'}
                  {activeTab === 'resolved' && 'אין שאלות שנפתרו'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredEscalations.map((escalation) => (
                  <button
                    key={escalation.id}
                    onClick={() => handleSelectEscalation(escalation)}
                    className={cn(
                      "w-full p-4 text-right hover:bg-gray-50 transition-colors",
                      selectedEscalation?.id === escalation.id && "bg-[#25D366]/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium line-clamp-2">
                          {escalation.question}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(escalation.createdAt)}
                          {escalation.priority > 0 && (
                            <span className="mr-2 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[10px]">
                              עדיפות גבוהה
                            </span>
                          )}
                        </p>
                      </div>
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0 mt-2",
                        escalation.status === 'pending' && "bg-orange-500",
                        escalation.status === 'in_progress' && "bg-blue-500",
                        escalation.status === 'resolved' && "bg-green-500"
                      )} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Response Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {selectedEscalation ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium text-gray-900">פרטי השאלה</h2>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    selectedEscalation.status === 'pending' && "bg-orange-100 text-orange-600",
                    selectedEscalation.status === 'in_progress' && "bg-blue-100 text-blue-600",
                    selectedEscalation.status === 'resolved' && "bg-green-100 text-green-600"
                  )}>
                    {STATUS_TABS.find(t => t.value === selectedEscalation.status)?.label}
                  </span>
                </div>
              </div>

              {/* Question */}
              <div className="p-4 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-1">השאלה:</p>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedEscalation.question}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {formatDate(selectedEscalation.createdAt)}
                </p>
              </div>

              {/* Response Area */}
              {selectedEscalation.status !== 'resolved' ? (
                <div className="flex-1 p-4 flex flex-col">
                  <p className="text-xs text-gray-500 mb-2">התשובה שלך:</p>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="כתוב את התשובה כאן..."
                    className="flex-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366] text-sm min-h-[120px]"
                  />

                  {/* Add to KB checkbox */}
                  <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shouldAddToKB}
                      onChange={(e) => setShouldAddToKB(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#25D366] focus:ring-[#25D366]"
                    />
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    הוסף למאגר הידע
                  </label>

                  {/* Send button */}
                  <button
                    onClick={handleSendResponse}
                    disabled={!response.trim() || isSending}
                    className={cn(
                      "mt-4 w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                      response.trim() && !isSending
                        ? "bg-[#25D366] text-white hover:bg-[#128C7E]"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        שולח...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        שלח תשובה
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex-1 p-4">
                  <p className="text-xs text-gray-500 mb-2">התשובה:</p>
                  <p className="text-sm text-gray-900 bg-green-50 p-3 rounded-lg border border-green-100">
                    {selectedEscalation.managerResponse}
                  </p>
                  {selectedEscalation.resolvedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      נפתר {formatDate(selectedEscalation.resolvedAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                בחר שאלה מהרשימה כדי לענות
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
