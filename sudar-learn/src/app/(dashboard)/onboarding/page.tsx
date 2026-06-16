import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from './OnboardingFlow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceRoleSupabaseClient()

  const [{ data: profile }, { data: learnerProfile }] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', user.id).single(),
    admin.from('learner_profiles').select('ai_tutor_context').eq('user_id', user.id).single(),
  ])

  const memory = (learnerProfile?.ai_tutor_context as Record<string, unknown>) ?? {}

  if (memory.onboarding_complete === 'true') {
    redirect('/')
  }

  return (
    <OnboardingFlow
      firstName={profile?.full_name?.split(' ')[0] ?? 'there'}
      existingMemory={memory}
      moduleTitles={[]}
    />
  )
}
