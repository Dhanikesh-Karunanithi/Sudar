import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireOrgAdmin } from '@/lib/org'
import { resolveSudarAgentsFromOrgSettings } from '../../../../../shared/sudarAgentsOrgSettings'
import { SudarAgentsPageClient } from './SudarAgentsPageClient'

export default async function SudarAgentsObservabilityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    redirect('/')
  }

  const admin = createAdminClient()
  const [{ data: runs }, { data: orgRow }] = await Promise.all([
    admin
      .from('agent_runs')
      .select('id, team, goal_kind, status, created_at, error, artifact')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50),
    admin.from('organisations').select('settings').eq('id', orgId).maybeSingle(),
  ])

  const agentsResolved = resolveSudarAgentsFromOrgSettings(
    (orgRow?.settings as Record<string, unknown>) ?? {},
  )
  const initialAdvanced = agentsResolved.admin_explanation_level === 'advanced'

  return (
    <SudarAgentsPageClient
      runs={runs ?? []}
      initialAdvanced={initialAdvanced}
      cohortPulseEnabled={agentsResolved.enabled && agentsResolved.features.cohort_pulse}
    />
  )
}
