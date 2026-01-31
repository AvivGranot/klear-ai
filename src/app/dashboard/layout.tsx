import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard/DashboardShell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth check
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/dashboard')
  }

  // Check role - only manager, admin, owner can access dashboard
  if (user.role === 'employee') {
    // Redirect employees to their chat
    redirect(`/c/${user.company.slug}`)
  }

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  )
}
