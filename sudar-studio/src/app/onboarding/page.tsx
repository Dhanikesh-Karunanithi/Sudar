import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOrCreateOrg } from '@/lib/org'
import { StudioOnboardingFlow } from './StudioOnboardingFlow'

export const metadata = { title: 'Welcome to Sudar Studio' }

export default async function StudioOnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)

  const [{ data: profile }, { data: org }] = await Promise.all([
    admin.from('profiles').select('full_name, onboarding_complete').eq('id', user.id).single(),
    admin.from('organisations').select('name').eq('id', orgId).single(),
  ])

  if (profile?.onboarding_complete) {
    redirect('/')
  }

  const defaultName =
    org?.name && !org.name.endsWith("'s Workspace") && org.name !== 'My Workspace'
      ? org.name
      : profile?.full_name
        ? `${profile.full_name}'s Team`
        : 'My Team'

  return <StudioOnboardingFlow defaultWorkspaceName={defaultName} />
}
