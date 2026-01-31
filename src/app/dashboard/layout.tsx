import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { prisma } from "@/lib/prisma"

// Get demo user - no authentication required
async function getDemoUser() {
  try {
    // Get the first company and owner from the database
    const company = await prisma.company.findFirst({
      include: {
        users: {
          where: { role: 'owner' },
          take: 1
        }
      }
    })

    if (company && company.users[0]) {
      return {
        id: company.users[0].id,
        email: company.users[0].email,
        name: company.users[0].name,
        role: company.users[0].role as 'owner' | 'admin' | 'manager' | 'employee',
        companyId: company.id,
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          primaryColor: company.primaryColor,
          botName: company.botName,
        }
      }
    }
  } catch (error) {
    console.error('Failed to get user from database:', error)
  }

  // Fallback demo user if database is empty or error
  return {
    id: 'demo-user',
    email: 'demo@klear.ai',
    name: 'Demo User',
    role: 'owner' as const,
    companyId: 'demo-company',
    company: {
      id: 'demo-company',
      name: 'חברת הדגמה',
      slug: 'demo',
      primaryColor: '#25D366',
      botName: 'Klear AI',
    }
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getDemoUser()

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  )
}
