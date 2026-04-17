import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextResponse } from 'next/server'

/**
 * Returns learners in the current user's org (org_members + profiles)
 * for use in path assignment and other admin flows.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user.id)

  const { data: membersData } = await admin
    .from('org_members')
    .select('user_id')
    .eq('org_id', orgId)

  const members = (membersData ?? []) as Array<{ user_id: string }>
  if (!members.length) return NextResponse.json([])

  const userIds = members.map((m) => m.user_id)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const learners = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name ?? 'Learner',
  }))

  return NextResponse.json(learners)
}
