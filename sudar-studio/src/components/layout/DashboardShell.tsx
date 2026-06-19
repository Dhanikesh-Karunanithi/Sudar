'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { SidebarContentProvider } from '@/contexts/SidebarContentContext'
import { SudarStudioChat } from '@/components/agent/SudarStudioChat'

interface DashboardShellProps {
  user: { email: string; full_name?: string | null; avatar_url?: string | null }
  orgRole?: 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER'
  isSuperAdmin?: boolean
  children: React.ReactNode
}

export function DashboardShell({ user, orgRole = 'LEARNER', isSuperAdmin = false, children }: DashboardShellProps) {
  return (
    <SidebarContentProvider>
      <div className="dark flex min-h-0 flex-1 overflow-hidden bg-background text-foreground">
        <Sidebar user={user} orgRole={orgRole} isSuperAdmin={isSuperAdmin} />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">
          {children}
        </main>
      </div>
      <SudarStudioChat orgRole={orgRole} />
    </SidebarContentProvider>
  )
}
