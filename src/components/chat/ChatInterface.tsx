"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChatMessage } from "./ChatMessage"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Send,
  Paperclip,
  Mic,
  MoreVertical,
  Phone,
  Video,
  ArrowDown,
  Sparkles,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  createdAt: Date | string
  mediaUrls?: string[]
}

interface ChatInterfaceProps {
  companyId: string
  companyName: string
  companyLogo?: string | null
  userId: string
  initialMessages?: Message[]
}

const messageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export function ChatInterface({
  companyId,
  companyName,
  companyLogo,
  userId,
  initialMessages = [],
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Build conversation history for context (last 10 messages)
      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          companyId,
          userId,
          conversationHistory,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      const assistantMessage: Message = {
        id: data.messageId || Date.now().toString(),
        content: data.response,
        role: "assistant",
        createdAt: new Date(),
        mediaUrls: data.mediaUrls,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "מצטער, אירעה שגיאה. אנא נסה שוב.",
          role: "assistant",
          createdAt: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#E5DDD5]" dir="rtl">
      {/* WhatsApp-like header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white px-4 py-2 flex items-center gap-3 shadow-lg relative z-10"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Avatar className="h-11 w-11 ring-2 ring-white/20">
            {companyLogo ? (
              <AvatarImage src={companyLogo} alt={companyName} />
            ) : null}
            <AvatarFallback className="bg-white/20 text-white font-bold">
              {companyName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        <div className="flex-1">
          <h1 className="font-semibold text-base">{companyName} - Klear AI</h1>
          <div className="flex items-center gap-1.5">
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-green-400 rounded-full"
            />
            <p className="text-xs text-green-200">
              {isLoading ? "מקליד..." : "מחובר"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[Video, Phone, MoreVertical].map((Icon, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.9 }}
              className="p-2.5 rounded-full transition-colors"
            >
              <Icon className="w-5 h-5" />
            </motion.button>
          ))}
        </div>
      </motion.header>

      {/* Chat messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 relative"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Welcome message */}
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="bg-white rounded-2xl p-8 shadow-xl max-w-sm border border-gray-100"
              >
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-12 h-12 text-white"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  ברוכים הבאים ל-Klear AI
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  אני כאן לעזור לך עם כל שאלה על נהלים, מדיניות והנחיות של החברה.
                  פשוט שאל והתשובה תגיע מיד!
                </p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>מופעל על ידי AI</span>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                variants={messageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, delay: index === messages.length - 1 ? 0.1 : 0 }}
                layout
              >
                <ChatMessage
                  content={message.content}
                  role={message.role}
                  timestamp={message.createdAt}
                  media={
                    message.mediaUrls?.map((url) => ({
                      url,
                      mimeType: url.match(/\.(mp4|webm|mov)$/i)
                        ? "video/mp4"
                        : "image/jpeg",
                    })) || []
                  }
                  isDelivered={true}
                  isRead={message.role === "assistant"}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-end mb-2"
              >
                <div className="bg-[#DCF8C6] rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-2.5 h-2.5 bg-gray-500 rounded-full"
                        animate={{
                          y: [0, -8, 0],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scrollToBottom()}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center z-10"
            >
              <ArrowDown className="w-5 h-5 text-gray-600" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSubmit}
        className="bg-[#F0F0F0] px-3 py-2 flex items-end gap-2 border-t border-gray-200"
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
        >
          <Paperclip className="w-6 h-6" />
        </motion.button>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="הקלד הודעה..."
            className="resize-none min-h-[48px] max-h-[120px] py-3 px-4 rounded-3xl border-0 bg-white shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            rows={1}
            disabled={isLoading}
          />
        </div>

        <AnimatePresence mode="wait">
          {input.trim() ? (
            <motion.div
              key="send"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="submit"
                className="rounded-full w-12 h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] hover:opacity-90 shadow-lg"
                disabled={isLoading}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Send className="w-5 h-5" />
                </motion.div>
              </Button>
            </motion.div>
          ) : (
            <motion.button
              key="mic"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white rounded-full shadow-lg"
            >
              <Mic className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.form>
    </div>
  )
}
