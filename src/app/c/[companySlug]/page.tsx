"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useParams, notFound } from "next/navigation"
import { Send, Sparkles, Copy, Check, Zap, MessageCircle, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  createConversation,
  getConversation,
  addMessage,
  getAllConversations,
  Message as StoredMessage,
  Conversation,
} from "@/lib/conversation-store"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isTyping?: boolean
  isEscalated?: boolean
}

// Company data - will be fetched from DB in production
const COMPANY_DATA: Record<string, { name: string; id: string; primaryColor: string }> = {
  "jolika-chocolate": { name: "ג'וליקה שוקולד", id: "jolika-chocolate", primaryColor: "#25D366" },
  "jolika": { name: "ג'וליקה שוקולד", id: "jolika-chocolate", primaryColor: "#25D366" },
  "demo": { name: "חברת הדגמה", id: "demo-company-001", primaryColor: "#3B82F6" },
}

const SUGGESTED_QUESTIONS = [
  "מה שעות הפעילות של המשלוחים?",
  "איך רושמים לקוח עסקי?",
  "מה ההנחות ללקוחות עסקיים?",
  "איך מכינים שוקולד לגובה?",
]

function storedToUIMessages(stored: StoredMessage[]): Message[] {
  return stored.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.timestamp),
  }))
}

export default function EmployeeChatPage() {
  const params = useParams()
  const companySlug = params.companySlug as string
  const company = COMPANY_DATA[companySlug]

  // If company not found, show 404
  if (!company) {
    notFound()
  }

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [escalateQuestion, setEscalateQuestion] = useState("")
  const [isEscalating, setIsEscalating] = useState(false)
  const [escalateSuccess, setEscalateSuccess] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])
  useEffect(() => { inputRef.current?.focus() }, [])

  // Load last conversation on mount
  useEffect(() => {
    const conversations = getAllConversations(company.id)
    if (conversations.length > 0) {
      const lastConv = conversations[0]
      const conv = getConversation(lastConv.id)
      if (conv) {
        setMessages(storedToUIMessages(conv.messages))
        setCurrentConversationId(lastConv.id)
      }
    }
  }, [company.id])

  const handleSubmit = async (e?: React.FormEvent, overrideMessage?: string) => {
    e?.preventDefault()
    const text = overrideMessage || input.trim()
    if (!text || isLoading) return

    // Create conversation if needed
    let convId = currentConversationId
    if (!convId) {
      const newConv = createConversation(company.id, text)
      convId = newConv.id
      setCurrentConversationId(convId)
    }

    // Add user message
    const userMsg = addMessage(convId, "user", text)
    const userMessage: Message = {
      id: userMsg.id,
      role: "user",
      content: text,
      timestamp: new Date(userMsg.timestamp),
    }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Show typing indicator
    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    }
    setMessages(prev => [...prev, typingMessage])

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          companyId: company.id,
          userId: `employee-${Date.now()}`,
          conversationHistory: history,
        }),
      })

      if (!res.ok) throw new Error("Failed")
      const data = await res.json()

      // Store assistant message
      const assistantMsg = addMessage(convId, "assistant", data.response)

      setMessages(prev => {
        const filtered = prev.filter(m => !m.isTyping)
        return [
          ...filtered,
          {
            id: assistantMsg.id,
            role: "assistant" as const,
            content: data.response,
            timestamp: new Date(assistantMsg.timestamp),
          },
        ]
      })
    } catch {
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isTyping)
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            role: "assistant" as const,
            content: "מצטער, אירעה שגיאה. אנא נסה שוב.",
            timestamp: new Date(),
          },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const startNewChat = () => {
    setMessages([])
    setCurrentConversationId(null)
    setInput("")
    inputRef.current?.focus()
  }

  const handleEscalate = async () => {
    if (!escalateQuestion.trim()) return

    setIsEscalating(true)
    try {
      const res = await fetch("/api/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          question: escalateQuestion,
          conversationId: currentConversationId,
        }),
      })

      if (res.ok) {
        setEscalateSuccess(true)
        // Add escalation message to chat
        const escalationMsg: Message = {
          id: `escalation-${Date.now()}`,
          role: "assistant",
          content: `השאלה שלך הועברה למנהל: "${escalateQuestion}"\n\nתקבל תשובה בהקדם האפשרי.`,
          timestamp: new Date(),
          isEscalated: true,
        }
        setMessages(prev => [...prev, escalationMsg])

        setTimeout(() => {
          setShowEscalateModal(false)
          setEscalateQuestion("")
          setEscalateSuccess(false)
        }, 2000)
      }
    } catch (err) {
      console.error("Escalation error:", err)
    } finally {
      setIsEscalating(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50" dir="rtl">
      {/* Compact Header */}
      <header className="bg-gradient-to-r from-[#25D366] to-[#128C7E] px-4 py-3 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">{company.name}</h1>
              <p className="text-white/70 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                {isLoading ? "מעבד..." : "מוכן לעזור"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={startNewChat}
                className="px-3 py-1.5 text-xs text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                שיחה חדשה
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // Welcome screen
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-green-500/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">שלום! איך אפשר לעזור?</h2>
            <p className="text-gray-500 mb-8 max-w-md">
              אני יכול לענות על שאלות לגבי נהלים, מדיניות והנחיות של {company.name}
            </p>

            {/* Suggested questions */}
            <div className="w-full max-w-lg">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2 justify-center">
                <Zap className="w-3 h-3" />
                שאלות נפוצות
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(undefined, q)}
                    className="p-3 text-sm text-right text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-gray-300 transition-all shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Messages list
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "")}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === "user"
                      ? "bg-gray-200 text-gray-600"
                      : message.isEscalated
                        ? "bg-orange-100 text-orange-600"
                        : "bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white"
                  )}
                >
                  {message.role === "user" ? (
                    <span className="text-sm font-medium">א</span>
                  ) : message.isEscalated ? (
                    <UserCircle className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "flex-1 max-w-[85%]",
                    message.role === "user" ? "text-left" : "text-right"
                  )}
                >
                  {message.isTyping ? (
                    <div className="inline-flex items-center gap-1.5 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "inline-block px-4 py-3 rounded-2xl shadow-sm",
                          message.role === "user"
                            ? "bg-[#25D366] text-white"
                            : message.isEscalated
                              ? "bg-orange-50 text-gray-900 border border-orange-200"
                              : "bg-white text-gray-900 border border-gray-100"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                      {message.role === "assistant" && !message.isEscalated && (
                        <div className="flex items-center gap-2 mt-1.5 mr-1">
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="שאל שאלה..."
              rows={1}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366] disabled:opacity-50 text-sm"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors",
                input.trim() && !isLoading
                  ? "bg-[#25D366] text-white hover:bg-[#128C7E]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Ask Manager Button */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] text-gray-400">
              מופעל על ידי Klear AI
            </p>
            <button
              onClick={() => setShowEscalateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <UserCircle className="w-3.5 h-3.5" />
              שאל מנהל
            </button>
          </div>
        </div>
      </div>

      {/* Escalation Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            {!escalateSuccess ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">שאל את המנהל</h3>
                    <p className="text-sm text-gray-500">השאלה תועבר למנהל ותקבל תשובה בהקדם</p>
                  </div>
                </div>

                <textarea
                  value={escalateQuestion}
                  onChange={e => setEscalateQuestion(e.target.value)}
                  placeholder="מה השאלה שלך?"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm mb-4"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEscalateModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleEscalate}
                    disabled={!escalateQuestion.trim() || isEscalating}
                    className="flex-1 px-4 py-2.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {isEscalating ? "שולח..." : "שלח למנהל"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">השאלה נשלחה!</h3>
                <p className="text-sm text-gray-500">המנהל יקבל את השאלה ויענה בהקדם</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
