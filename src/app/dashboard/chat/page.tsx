"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Sparkles, RotateCcw, Copy, Check, Zap, BookOpen, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { getRepetitiveQuestions, company } from "@/data/jolika-data"
import {
  createConversation,
  getConversation,
  addMessage,
  getAllConversations,
  Message as StoredMessage,
  Conversation,
  formatTimestamp,
} from "@/lib/conversation-store"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isTyping?: boolean
}

const SUGGESTED_QUESTIONS = getRepetitiveQuestions().slice(0, 4).map(q => q.title)

// Convert stored messages to UI messages
function storedToUIMessages(stored: StoredMessage[]): Message[] {
  return stored.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.timestamp),
  }))
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    inputRef.current?.focus()
    // Load recent conversations on mount
    const convs = getAllConversations(company.id)
    setRecentConversations(convs.slice(0, 10))
  }, [])

  // Load a conversation from history
  const loadConversation = useCallback((conversationId: string) => {
    const conversation = getConversation(conversationId)
    if (conversation) {
      setMessages(storedToUIMessages(conversation.messages))
      setCurrentConversationId(conversationId)
      setShowHistory(false)
    }
  }, [])

  const handleSubmit = async (e?: React.FormEvent, overrideMessage?: string) => {
    e?.preventDefault()
    const messageText = overrideMessage || input.trim()
    if (!messageText || isLoading) return

    // Create conversation if needed
    let convId = currentConversationId
    if (!convId) {
      const newConv = createConversation(company.id, messageText)
      convId = newConv.id
      setCurrentConversationId(convId)
    }

    // Add user message to store
    const userMsg = addMessage(convId, "user", messageText)
    const userMessage: Message = {
      id: userMsg.id,
      role: "user",
      content: messageText,
      timestamp: new Date(userMsg.timestamp),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Add typing indicator
    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    }
    setMessages(prev => [...prev, typingMessage])

    try {
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          companyId: company.id,
          userId: `dashboard-${Date.now()}`,
          conversationHistory,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      // Store assistant message
      const assistantMsg = addMessage(convId, "assistant", data.response)

      // Remove typing indicator and add real response
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isTyping)
        return [...filtered, {
          id: assistantMsg.id,
          role: "assistant",
          content: data.response,
          timestamp: new Date(assistantMsg.timestamp),
        }]
      })

      // Refresh recent conversations
      setRecentConversations(getAllConversations(company.id).slice(0, 10))
    } catch (error) {
      console.error("Error:", error)
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isTyping)
        return [...filtered, {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "מצטער, אירעה שגיאה. אנא נסה שוב.",
          timestamp: new Date(),
        }]
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

  const handleSuggestedQuestion = (question: string) => {
    handleSubmit(undefined, question)
  }

  const startNewChat = () => {
    setMessages([])
    setCurrentConversationId(null)
    setInput("")
    setShowHistory(false)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">צ׳אט AI</h1>
          <p className="text-gray-500 mt-1">שאל שאלות על מאגר הידע של {company.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors",
              showHistory
                ? "bg-[#25D366] text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <History className="w-4 h-4" />
            היסטוריה
          </button>
          {messages.length > 0 && (
            <button
              onClick={startNewChat}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              שיחה חדשה
            </button>
          )}
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="mb-4 bg-white rounded-2xl border border-gray-200 p-4 max-h-64 overflow-y-auto">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <History className="w-4 h-4" />
            שיחות אחרונות
          </h3>
          {recentConversations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">אין שיחות קודמות</p>
          ) : (
            <div className="space-y-2">
              {recentConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={cn(
                    "w-full text-right px-3 py-2 rounded-lg transition-colors flex items-center justify-between",
                    currentConversationId === conv.id
                      ? "bg-[#25D366]/10 text-[#25D366]"
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                >
                  <span className="truncate text-sm">{conv.title}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0 mr-2">
                    {formatTimestamp(conv.updatedAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            // Welcome screen
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">איך אפשר לעזור?</h2>
              <p className="text-gray-500 mb-8 max-w-md">
                אני יכול לענות על שאלות לגבי נהלים, מדיניות והנחיות של {company.name} בהתבסס על מאגר הידע.
              </p>

              {/* Suggested questions */}
              <div className="w-full max-w-lg">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2 justify-center">
                  <Zap className="w-3 h-3" />
                  שאלות נפוצות
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map((question, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="p-3 text-sm text-right text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors line-clamp-2"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Messages list
            <div className="p-6 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    message.role === "user" ? "flex-row-reverse" : ""
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === "user"
                      ? "bg-gray-200 text-gray-600"
                      : "bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white"
                  )}>
                    {message.role === "user" ? (
                      <span className="text-sm font-medium">א</span>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message content */}
                  <div className={cn(
                    "flex-1 max-w-[85%]",
                    message.role === "user" ? "text-left" : "text-right"
                  )}>
                    {message.isTyping ? (
                      // Typing indicator
                      <div className="inline-flex items-center gap-1.5 px-4 py-3 bg-gray-100 rounded-2xl">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className={cn(
                          "inline-block px-4 py-3 rounded-2xl",
                          message.role === "user"
                            ? "bg-[#25D366] text-white"
                            : "bg-gray-100 text-gray-900"
                        )}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        </div>

                        {/* Actions for assistant messages */}
                        {message.role === "assistant" && (
                          <div className="flex items-center gap-2 mt-2 mr-1">
                            <button
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="העתק"
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

        {/* Input area */}
        <div className="border-t border-gray-100 p-4">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
          <p className="text-[10px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
            <BookOpen className="w-3 h-3" />
            מבוסס על מאגר הידע של {company.name}
          </p>
        </div>
      </div>
    </div>
  )
}
