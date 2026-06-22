import type { SupabaseClient } from '@supabase/supabase-js'
import { EARLY_ACCESS_FEEDBACK_TIERS } from './schemas'
import type { AccessTier } from '../access/types'

type DbClient = SupabaseClient<Record<string, unknown>>

export async function canSubmitEarlyAccessFeedback(
  supabase: DbClient,
  userId: string,
): Promise<{ allowed: boolean; orgId: string | null; accessTier: AccessTier }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, access_tier')
    .eq('id', userId)
    .maybeSingle()

  const accessTier = (profile?.access_tier ?? 'default') as AccessTier
  const allowed = EARLY_ACCESS_FEEDBACK_TIERS.has(accessTier)
  return {
    allowed,
    orgId: (profile?.org_id as string | null) ?? null,
    accessTier,
  }
}
