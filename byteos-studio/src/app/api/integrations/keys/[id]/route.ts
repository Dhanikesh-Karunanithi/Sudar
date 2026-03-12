/**
 * DELETE /api/integrations/keys/[id] — Revoke an integration key. Admin/Manager only.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('integration_api_keys')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
