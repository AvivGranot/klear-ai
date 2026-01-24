"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Mail,
  Phone,
  Shield,
  User,
  UserPlus,
  Trash2,
  Edit,
  X,
  Send,
  Copy,
  Check,
  Link2,
} from "lucide-react"
import { safeFetch } from "@/lib/safeFetch"

interface UserData {
  id: string
  name: string
  phone: string
  email?: string
  role: string
  status: "active" | "inactive"
  lastActive: string
  avatarUrl?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Invite modal state
  const [inviteMethod, setInviteMethod] = useState<"email" | "phone" | "link">("email")
  const [inviteEmail, setInviteEmail] = useState("")
  const [invitePhone, setInvitePhone] = useState("")
  const [inviteRole, setInviteRole] = useState<"employee" | "manager">("employee")
  const [inviteName, setInviteName] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [editPhone, setEditPhone] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null)
  const [deleting, setDeleting] = useState(false)

  const inviteLink = "https://klear.ai/join/abc123xyz"

  useEffect(() => {
    async function init() {
      try {
        const seedData = await safeFetch<{ seeded: boolean; companyId: string }>("/api/seed")
        if (seedData?.seeded && seedData?.companyId) {
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

    async function loadUsers() {
      try {
        const data = await safeFetch<{ users: any[] }>(`/api/users?companyId=${companyId}`)

        // Transform and add mock data
        const transformedUsers: UserData[] = (data?.users || []).map((u: any) => ({
          ...u,
          email: `${u.name.replace(/\s/g, "").toLowerCase()}@example.com`,
          status: "active" as const,
          lastActive: new Date().toISOString(),
        }))

        // Add some mock users if none exist
        if (transformedUsers.length === 0) {
          transformedUsers.push(
            {
              id: "1",
              name: "יוסי כהן",
              phone: "050-1234567",
              email: "yosi@example.com",
              role: "manager",
              status: "active",
              lastActive: new Date().toISOString(),
            },
            {
              id: "2",
              name: "שרה לוי",
              phone: "052-9876543",
              email: "sara@example.com",
              role: "employee",
              status: "active",
              lastActive: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: "3",
              name: "דני אברהם",
              phone: "054-5555555",
              email: "dani@example.com",
              role: "employee",
              status: "inactive",
              lastActive: new Date(Date.now() - 86400000 * 5).toISOString(),
            }
          )
        }

        setUsers(transformedUsers)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [companyId])

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-700">מנהל מערכת</Badge>
      case "manager":
        return <Badge className="bg-blue-100 text-blue-700">מנהל</Badge>
      default:
        return <Badge variant="outline">עובד</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-700">פעיל</Badge>
    ) : (
      <Badge variant="outline" className="text-gray-500">לא פעיל</Badge>
    )
  }

  const formatLastActive = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 5) return "עכשיו"
    if (diffMins < 60) return `לפני ${diffMins} דקות`
    if (diffHours < 24) return `לפני ${diffHours} שעות`
    return `לפני ${diffDays} ימים`
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleSendInvite = async () => {
    setInviteSending(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setInviteSending(false)
    setInviteSent(true)
    setTimeout(() => {
      setShowAddModal(false)
      setInviteSent(false)
      setInviteEmail("")
      setInvitePhone("")
      setInviteName("")
      setInviteRole("employee")
    }, 2000)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setInviteSent(false)
    setInviteEmail("")
    setInvitePhone("")
    setInviteName("")
    setInviteRole("employee")
    setInviteMethod("email")
  }

  const handleEditClick = (user: UserData) => {
    setEditingUser(user)
    setEditPhone(user.phone)
    setEditEmail(user.email || "")
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingUser(null)
    setEditPhone("")
    setEditEmail("")
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    setEditSaving(true)

    try {
      await safeFetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          phone: editPhone,
          email: editEmail,
        }),
      })

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, phone: editPhone, email: editEmail }
            : u
        )
      )
      closeEditModal()
    } catch (e) {
      console.error("Failed to update user:", e)
    } finally {
      setEditSaving(false)
    }
  }

  const handleDeleteClick = (user: UserData) => {
    setDeletingUser(user)
    setShowDeleteConfirm(true)
  }

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false)
    setDeletingUser(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return
    setDeleting(true)

    try {
      await safeFetch(`/api/users?id=${deletingUser.id}`, {
        method: "DELETE",
      })

      // Remove from local state
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id))
      closeDeleteConfirm()
    } catch (e) {
      console.error("Failed to delete user:", e)
      // Still remove from local state for demo purposes
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id))
      closeDeleteConfirm()
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">משתמשים</h1>
        <Button
          className="gap-2 bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4" />
          הזמן משתמש
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[rgba(37,211,102,0.1)] rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-[var(--klear-green)]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
                <p className="text-sm text-gray-500">סה״כ משתמשים</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter((u) => u.status === "active").length}
                </p>
                <p className="text-sm text-gray-500">פעילים</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[rgba(37,211,102,0.1)] rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-[var(--klear-green)]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter((u) => u.role === "manager" || u.role === "admin").length}
                </p>
                <p className="text-sm text-gray-500">מנהלים</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="חפש משתמשים לפי שם, טלפון או דוא״ל..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 h-12"
        />
      </div>

      {/* Users Table */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  משתמש
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  תפקיד
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  סטטוס
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  פעילות אחרונה
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  פרטי קשר
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-4">{getStatusBadge(user.status)}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {formatLastActive(user.lastActive)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5" />
                        {user.phone}
                      </div>
                      {user.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-3.5 h-3.5" />
                          {user.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(user)}
                        title="ערוך פרטי קשר"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                        title="מחק משתמש"
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

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">לא נמצאו משתמשים</p>
          </div>
        )}
      </Card>

      {/* Invite User Modal */}
      {showAddModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">הזמן משתמש חדש</h2>
                <button
                  onClick={closeModal}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-6">
                {inviteSent ? (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">ההזמנה נשלחה!</h3>
                    <p className="text-gray-500">המשתמש יקבל הודעה עם קישור להצטרפות</p>
                  </div>
                ) : (
                  <>
                    {/* Invite Method Selection */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">שיטת ההזמנה</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setInviteMethod("email")}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            inviteMethod === "email"
                              ? "border-[var(--klear-green)] bg-[rgba(37,211,102,0.05)]"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Mail className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                          <p className="text-sm font-medium text-gray-900">דוא״ל</p>
                        </button>
                        <button
                          onClick={() => setInviteMethod("phone")}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            inviteMethod === "phone"
                              ? "border-[var(--klear-green)] bg-[rgba(37,211,102,0.05)]"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Phone className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                          <p className="text-sm font-medium text-gray-900">SMS</p>
                        </button>
                        <button
                          onClick={() => setInviteMethod("link")}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            inviteMethod === "link"
                              ? "border-[var(--klear-green)] bg-[rgba(37,211,102,0.05)]"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <Link2 className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                          <p className="text-sm font-medium text-gray-900">קישור</p>
                        </button>
                      </div>
                    </div>

                    {/* Form Fields */}
                    {inviteMethod !== "link" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            שם מלא
                          </label>
                          <Input
                            placeholder="הכנס שם מלא"
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                          />
                        </div>

                        {inviteMethod === "email" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              כתובת דוא״ל
                            </label>
                            <Input
                              type="email"
                              placeholder="user@example.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              dir="ltr"
                            />
                          </div>
                        )}

                        {inviteMethod === "phone" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              מספר טלפון
                            </label>
                            <Input
                              type="tel"
                              placeholder="050-1234567"
                              value={invitePhone}
                              onChange={(e) => setInvitePhone(e.target.value)}
                              dir="ltr"
                            />
                          </div>
                        )}

                        {/* Role Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            תפקיד
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setInviteRole("employee")}
                              className={`p-3 rounded-lg border-2 transition-all text-right ${
                                inviteRole === "employee"
                                  ? "border-[var(--klear-green)] bg-[rgba(37,211,102,0.05)]"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <p className="font-medium text-gray-900">עובד</p>
                              <p className="text-xs text-gray-500">גישה בסיסית לצ׳אט</p>
                            </button>
                            <button
                              onClick={() => setInviteRole("manager")}
                              className={`p-3 rounded-lg border-2 transition-all text-right ${
                                inviteRole === "manager"
                                  ? "border-[var(--klear-green)] bg-[rgba(37,211,102,0.05)]"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <p className="font-medium text-gray-900">מנהל</p>
                              <p className="text-xs text-gray-500">גישה לדאשבורד</p>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Link Sharing */}
                    {inviteMethod === "link" && (
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">קישור הזמנה</p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-white px-3 py-2 rounded border border-gray-200 flex-1 overflow-hidden text-ellipsis" dir="ltr">
                              {inviteLink}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyLink}
                              className="shrink-0"
                            >
                              {linkCopied ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            שתף קישור זה עם משתמשים שברצונך להזמין
                          </p>
                        </div>

                        {/* Role Selection for Link */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            תפקיד ברירת מחדל למצטרפים
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setInviteRole("employee")}
                              className={`p-3 rounded-lg border-2 transition-all text-right ${
                                inviteRole === "employee"
                                  ? "border-[var(--klear-green)] bg-[rgba(37,211,102,0.05)]"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <p className="font-medium text-gray-900">עובד</p>
                              <p className="text-xs text-gray-500">גישה בסיסית לצ׳אט</p>
                            </button>
                            <button
                              onClick={() => setInviteRole("manager")}
                              className={`p-3 rounded-lg border-2 transition-all text-right ${
                                inviteRole === "manager"
                                  ? "border-[var(--klear-green)] bg-[rgba(37,211,102,0.05)]"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <p className="font-medium text-gray-900">מנהל</p>
                              <p className="text-xs text-gray-500">גישה לדאשבורד</p>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              {!inviteSent && (
                <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                  <Button variant="outline" onClick={closeModal}>
                    ביטול
                  </Button>
                  {inviteMethod !== "link" && (
                    <Button
                      className="gap-2 bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]"
                      onClick={handleSendInvite}
                      disabled={
                        inviteSending ||
                        !inviteName ||
                        (inviteMethod === "email" && !inviteEmail) ||
                        (inviteMethod === "phone" && !invitePhone)
                      }
                    >
                      {inviteSending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {inviteSending ? "שולח..." : "שלח הזמנה"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeEditModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  עריכת פרטי קשר - {editingUser.name}
                </h2>
                <button
                  onClick={closeEditModal}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מספר טלפון
                  </label>
                  <Input
                    type="tel"
                    placeholder="050-1234567"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    כתובת דוא״ל
                  </label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                <Button variant="outline" onClick={closeEditModal}>
                  ביטול
                </Button>
                <Button
                  className="gap-2 bg-[var(--klear-green)] hover:bg-[var(--klear-green-dark)]"
                  onClick={handleSaveEdit}
                  disabled={editSaving || !editPhone}
                >
                  {editSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editSaving ? "שומר..." : "שמור שינויים"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingUser && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeDeleteConfirm}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">מחיקת משתמש</h2>
                <button
                  onClick={closeDeleteConfirm}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{deletingUser.name}</p>
                    <p className="text-sm text-gray-500">{deletingUser.phone}</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  האם אתה בטוח שברצונך למחוק את המשתמש הזה? פעולה זו אינה ניתנת לביטול.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                <Button variant="outline" onClick={closeDeleteConfirm}>
                  ביטול
                </Button>
                <Button
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {deleting ? "מוחק..." : "מחק משתמש"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
