"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Send, Sparkles, Copy, Check, Zap, MessageCircle, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import {
  createConversation,
  getConversation,
  addMessage,
  Conversation,
  Message as StoredMessage,
} from "@/lib/conversation-store"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isTyping?: boolean
}

const COMPANY_DATA: Record<string, { name: string; id: string }> = {
  "jolika-chocolate": { name: "ג'וליקה שוקולד", id: "jolika-chocolate" },
  "demo-company-001": { name: "חברת הדגמה", id: "demo-company-001" },
}

const SUGGESTED_QUESTIONS = [
  "מה שעות הפעילות של המשלוחים?",
  "איך רושמים לקוח עסקי?",
  "מה ההנחות ללקוחות עסקיים?",
  "איך מכינים שוקולד לגובה?",
]

// Convert stored messages to UI messages
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
  const companyId = params.companyId as string
  const company = COMPANY_DATA[companyId] || { name: "Klear AI", id: companyId }

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])
  useEffect(() => { inputRef.current?.focus() }, [])

  // Load conversation when selected
  const loadConversation = useCallback((conversationId: string | null) => {
    if (!conversationId) {
      setMessages([])
      setCurrentConversationId(null)
      return
    }

    const conversation = getConversation(conversationId)
    if (conversation) {
      setMessages(storedToUIMessages(conversation.messages))
      setCurrentConversationId(conversationId)
    }
  }, [])

  // Start new chat
  const startNewChat = useCallback(() => {
    setMessages([])
    setCurrentConversationId(null)
    setInput("")
    inputRef.current?.focus()
  }, [])

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

  return (
    <div className="flex h-screen bg-white" dir="rtl">
      {/* Sidebar */}
      {sidebarOpen && (
        <ChatSidebar
          companyId={company.id}
          companyName={company.name}
          currentConversationId={currentConversationId}
          onSelectConversation={loadConversation}
          onNewChat={startNewChat}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-gradient-to-r from-[#25D366] to-[#128C7E] flex items-center justify-between px-4 lg:px-6 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">{company.name}</h1>
              <p className="text-white/70 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                {isLoading ? "מעבד..." : "Klear AI מחובר"}
              </p>
            </div>
          </div>
        </header>

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-green-500/20">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">שלום! איך אפשר לעזור?</h2>
              <p className="text-gray-500 mb-8 max-w-md">
                אני יכול לענות על שאלות לגבי נהלים, מדיניות והנחיות של {company.name}
              </p>
              <div className="w-full max-w-lg">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2 justify-center">
                  <Zap className="w-3 h-3" />שאלות נפוצות
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
            <div className="max-w-3xl mx-auto p-4 lg:p-6 space-y-4">
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
                        : "bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white"
                    )}
                  >
                    {message.role === "user" ? (
                      <span className="text-sm font-medium">א</span>
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
                              : "bg-white text-gray-900 border border-gray-100"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                        {message.role === "assistant" && (
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
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
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
          <p className="text-[10px] text-gray-400 text-center mt-2">
            מופעל על ידי Llama 3.1 · Klear AI
          </p>
        </div>
      </div>
    </div>
  )
}
