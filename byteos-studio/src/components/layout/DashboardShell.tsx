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
      <div className="flex h-screen bg-slate-950 overflow-hidden">
        <Sidebar user={user} orgRole={orgRole} isSuperAdmin={isSuperAdmin} />
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
      <SudarStudioChat orgRole={orgRole} />
    </SidebarContentProvider>
  )
}
