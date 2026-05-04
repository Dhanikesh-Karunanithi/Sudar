import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'

type ServiceRoleClient = SupabaseClient<Database>

/**
 * Write a row to `audit_events` via the service-role client.
 * Never put emails, tokens, passwords, prompts, or PII into `payload`; use opaque ids and counts.
 */
export async function logAuditEvent(
  admin: ServiceRoleClient,
  args: {
    actorUserId: string
    /** Null for purely global super-admin actions */
    orgId?: string | null
    action: string
    payload?: Json | Record<string, unknown>
  }
): Promise<{ ok: boolean; error?: string }> {
  const { actorUserId, orgId = null, action, payload = {} } = args
  const { error } = await admin.from('audit_events').insert({
    actor_user_id: actorUserId,
    org_id: orgId,
    action,
    payload: payload as Json,
  })
  if (error) {
    console.error('[audit_events] insert failed', action, error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
