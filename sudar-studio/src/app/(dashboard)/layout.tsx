import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, orgId] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url, role, onboarding_complete, require_password_change').eq('id', user.id).single(),
    getOrCreateOrg(user.id),
  ])

  if (profile?.require_password_change) {
    redirect('/change-password')
  }

  const { data: membership } = await supabase.from('org_members').select('role').eq('org_id', orgId).eq('user_id', user.id).single()

  const role = (membership as { role?: string } | null)?.role ?? 'LEARNER'
  const orgRole = ['ADMIN', 'MANAGER', 'CREATOR', 'LEARNER'].includes(role) ? role as 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER' : 'LEARNER'
  const isSuperAdmin = (profile as { role?: string } | null)?.role === 'super_admin'

  return (
    <DashboardShell
      user={{
        email: user.email ?? '',
        full_name: profile?.full_name,
        avatar_url: profile?.avatar_url,
      }}
      orgRole={orgRole}
      isSuperAdmin={isSuperAdmin}
    >
      {children}
    </DashboardShell>
  )
}
