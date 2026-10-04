import type { SupabaseClient } from '@supabase/supabase-js'
import type { LearnerDomainSummary } from '@/types/teaching'

export async function learnerOrgId(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await admin
    .from('profiles')
    .select('active_org_id, org_id')
    .eq('id', userId)
    .maybeSingle()
  const row = data as { active_org_id: string | null; org_id: string | null } | null
  return row?.active_org_id ?? row?.org_id ?? null
}

/** Client-supplied domain ids must belong to the learner's org before claims are loaded. */
export async function domainVisibleToLearner(
  admin: SupabaseClient,
  userId: string,
  domainId: string,
): Promise<boolean> {
  const orgId = await learnerOrgId(admin, userId)
  if (!orgId) return false
  const { data } = await admin
    .from('learning_domains')
    .select('id')
    .eq('id', domainId)
    .eq('org_id', orgId)
    .maybeSingle()
  return Boolean(data)
}

export async function listLearnerDomains(admin: SupabaseClient, userId: string): Promise<LearnerDomainSummary[]> {
  const orgId = await learnerOrgId(admin, userId)
  if (!orgId) return []
  const { data } = await admin
    .from('learning_domains')
    .select('id, title, description')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(50)
  return ((data ?? []) as Array<{ id: string; title: string; description: string | null }>).map((d) => ({
    id: String(d.id),
    title: String(d.title),
    description: d.description ?? null,
  }))
}
