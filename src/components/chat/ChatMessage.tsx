"use client"

import { motion } from "framer-motion"
import { cn, formatRelativeTime } from "@/lib/utils"
import { Check, CheckCheck, Play, FileText, Download } from "lucide-react"

interface MediaItem {
  url: string
  mimeType: string
  thumbnailUrl?: string | null
}

interface ChatMessageProps {
  content: string
  role: "user" | "assistant"
  timestamp: Date | string
  media?: MediaItem[]
  isDelivered?: boolean
  isRead?: boolean
}

export function ChatMessage({
  content,
  role,
  timestamp,
  media = [],
  isDelivered = true,
  isRead = false,
}: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div
      className={cn(
        "flex w-full mb-2",
        isUser ? "justify-start" : "justify-end"
      )}
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={cn(
          "max-w-[80%] rounded-xl px-4 py-2.5 shadow-sm relative",
          isUser
            ? "bg-white text-gray-900 rounded-tr-sm"
            : "bg-[#DCF8C6] text-gray-900 rounded-tl-sm"
        )}
      >
        {/* Message tail */}
        <div
          className={cn(
            "absolute top-0 w-3 h-3",
            isUser
              ? "right-[-6px] border-t-[8px] border-t-white border-l-[8px] border-l-transparent"
              : "left-[-6px] border-t-[8px] border-t-[#DCF8C6] border-r-[8px] border-r-transparent"
          )}
        />

        {/* Media attachments */}
        {media.length > 0 && (
          <div className="mb-3 space-y-2">
            {media.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg overflow-hidden"
              >
                {item.mimeType.startsWith("image/") ? (
                  <motion.img
                    whileHover={{ scale: 1.02 }}
                    src={item.url}
                    alt="Attached image"
                    className="max-w-full h-auto rounded-lg cursor-pointer"
                  />
                ) : item.mimeType.startsWith("video/") ? (
                  <div className="relative group">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt="Video thumbnail"
                        className="max-w-full h-auto rounded-lg"
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-full h-40 flex items-center justify-center rounded-lg">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <Play className="w-8 h-8 text-gray-600 ml-1" />
                        </motion.div>
                      </div>
                    )}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors rounded-lg"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Play className="w-8 h-8 text-gray-600 ml-1" />
                      </motion.div>
                    </a>
                  </div>
                ) : (
                  <motion.a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.url.split("/").pop()}
                      </p>
                      <p className="text-xs text-gray-500">לחץ להורדה</p>
                    </div>
                    <Download className="w-5 h-5 text-gray-400" />
                  </motion.a>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </p>

        {/* Timestamp and status */}
        <div className="flex items-center justify-end gap-1.5 mt-1.5">
          <span className="text-[11px] text-gray-500">
            {formatRelativeTime(timestamp)}
          </span>
          {!isUser && (
            <span className="text-gray-500">
              {isRead ? (
                <CheckCheck className="w-4 h-4 text-blue-500" />
              ) : isDelivered ? (
                <CheckCheck className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  )
}
