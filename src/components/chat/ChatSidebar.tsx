"use client"

import { useState, useEffect, useCallback } from "react"
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Conversation,
  getAllConversations,
  deleteConversation,
  updateConversationTitle,
  groupConversationsByDate,
  formatTimestamp,
} from "@/lib/conversation-store"

interface ChatSidebarProps {
  companyId: string
  companyName: string
  currentConversationId: string | null
  onSelectConversation: (id: string | null) => void
  onNewChat: () => void
}

export function ChatSidebar({
  companyId,
  companyName,
  currentConversationId,
  onSelectConversation,
  onNewChat,
}: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  // Load conversations
  const loadConversations = useCallback(() => {
    const convs = getAllConversations(companyId)
    setConversations(convs)
  }, [companyId])

  useEffect(() => {
    loadConversations()
    // Refresh every 5 seconds to catch new messages
    const interval = setInterval(loadConversations, 5000)
    return () => clearInterval(interval)
  }, [loadConversations])

  // Filter conversations by search
  const filteredConversations = searchQuery
    ? conversations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : conversations

  // Group by date
  const grouped = groupConversationsByDate(filteredConversations)

  // Handle delete
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("האם למחוק שיחה זו?")) {
      deleteConversation(id)
      loadConversations()
      if (currentConversationId === id) {
        onNewChat()
      }
    }
  }

  // Handle edit
  const startEdit = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(id)
    setEditTitle(title)
  }

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (editingId && editTitle.trim()) {
      updateConversationTitle(editingId, editTitle.trim())
      loadConversations()
    }
    setEditingId(null)
  }

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
  }

  // Render conversation group
  const renderGroup = (title: string, convs: Conversation[]) => {
    if (convs.length === 0) return null

    return (
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          {title}
        </p>
        <div className="space-y-1">
          {convs.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                currentConversationId === conv.id
                  ? "bg-emerald-50 text-emerald-700"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />

              {editingId === conv.id ? (
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 text-sm bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  <button onClick={saveEdit} className="p-1 hover:bg-gray-200 rounded">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                  <button onClick={cancelEdit} className="p-1 hover:bg-gray-200 rounded">
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-[10px] text-gray-400">{formatTimestamp(conv.updatedAt)}</p>
                  </div>

                  {/* Action buttons - show on hover */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white rounded-lg shadow-sm border border-gray-100 p-1">
                    <button
                      onClick={e => startEdit(conv.id, conv.title, e)}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      title="ערוך שם"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button
                      onClick={e => handleDelete(conv.id, e)}
                      className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                      title="מחק"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Collapsed sidebar
  if (!isOpen) {
    return (
      <div className="w-12 bg-gray-50 border-l border-gray-200 flex flex-col items-center py-4 gap-4">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="פתח תפריט"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={onNewChat}
          className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
          title="שיחה חדשה"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1" />
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-72 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{companyName}</p>
              <p className="text-[10px] text-gray-500">Klear AI</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors shadow-sm shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          שיחה חדשה
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="חפש בשיחות..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">אין שיחות קודמות</p>
            <p className="text-xs text-gray-400 mt-1">התחל שיחה חדשה</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">לא נמצאו תוצאות</p>
          </div>
        ) : (
          <>
            {renderGroup("היום", grouped.today)}
            {renderGroup("אתמול", grouped.yesterday)}
            {renderGroup("השבוע", grouped.thisWeek)}
            {renderGroup("החודש", grouped.thisMonth)}
            {renderGroup("ישן יותר", grouped.older)}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <p className="text-[10px] text-gray-400 text-center">
          {conversations.length} שיחות שמורות
        </p>
      </div>
    </div>
  )
}
