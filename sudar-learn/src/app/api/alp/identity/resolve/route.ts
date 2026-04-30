/**
 * ALP — Resolve LMS external_user_id to Sudar profiles.id (UUID).
 * Auth: org-scoped integration key only (prevents cross-tenant enumeration with env master key).
 * Body: { provider?: string, external_user_id: string }
 */
import { createAdminClient } from '@/lib/supabase/server'
import { validateAlpKey, getAlpKeyFromRequest } from '@/lib/alp-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  provider: z.string().min(1).max(64).optional(),
  external_user_id: z.string().min(1).max(512),
})

export async function POST(request: NextRequest) {
  const key = getAlpKeyFromRequest(request)
  const auth = await validateAlpKey(key)
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!auth.orgId) {
    return NextResponse.json(
      { error: 'Org-scoped integration key required for identity resolve' },
      { status: 403 },
    )
  }

  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON or body' }, { status: 400 })
  }

  const provider = parsed.provider?.trim() || 'moodle'
  const admin = createAdminClient()

  const { data: row, error } = await admin
    .from('lms_identity_links')
    .select('sudar_user_id')
    .eq('org_id', auth.orgId)
    .eq('provider', provider)
    .eq('external_user_id', parsed.external_user_id.trim())
    .is('revoked_at', null)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!row?.sudar_user_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: member } = await admin
    .from('org_members')
    .select('user_id')
    .eq('org_id', auth.orgId)
    .eq('user_id', row.sudar_user_id)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ sudar_user_id: row.sudar_user_id, provider })
}
