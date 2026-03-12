import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { TopNav } from '@/components/layout/TopNav'
import { PageTransition } from '@/components/ui/PageTransition'
import { FloatingSudarChatClient } from '@/components/tutor/FloatingSudarChatClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const admin = createAdminClient()

  const [{ data: profile }, { data: learnerProfile }] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url, require_password_change').eq('id', user.id).single(),
    admin.from('learner_profiles').select('ai_tutor_context').eq('user_id', user.id).single(),
  ])

  if (profile?.require_password_change) {
    redirect('/change-password')
  }

  // Redirect new learners to onboarding if they haven't completed it yet.
  // Skip this redirect if they're already on the onboarding page.
  const memory = (learnerProfile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const onboardingDone = memory.onboarding_complete === 'true'

  const userProps = {
    email: user.email ?? '',
    full_name: profile?.full_name,
    avatar_url: profile?.avatar_url,
  }

  return (
    <div className="min-h-screen bg-shell">
      <div className="max-w-[1600px] mx-auto min-h-screen flex flex-col rounded-shell overflow-hidden shadow-xl bg-background border border-border md:my-4 md:min-h-[calc(100vh-2rem)]">
        <TopNav
          user={userProps}
          showOnboardingNudge={!onboardingDone}
        />
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <FloatingSudarChatClient />
      </div>
    </div>
  )
}
