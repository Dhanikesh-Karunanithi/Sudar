import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from './OnboardingFlow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Load existing profile to pre-populate
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: learnerProfile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context')
    .eq('user_id', user.id)
    .single()

  const memory = (learnerProfile?.ai_tutor_context as Record<string, unknown>) ?? {}

  // Load a sample of published course module titles for the knowledge check
  const { data: courses } = await admin
    .from('courses')
    .select('title, modules(title)')
    .eq('status', 'published')
    .limit(5)

  const moduleTitles: string[] = (courses ?? [])
    .flatMap((c) => (c.modules as Array<{ title: string }>).map((m) => m.title))
    .slice(0, 20)

  return (
    <OnboardingFlow
      firstName={profile?.full_name?.split(' ')[0] ?? 'there'}
      existingMemory={memory}
      moduleTitles={moduleTitles}
    />
  )
}
