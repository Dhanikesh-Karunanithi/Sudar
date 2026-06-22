import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isEarlyAccessAdmin } from '@shared-access'
import type { AccessSupabaseClient } from '@shared-access/types'
import { feedbackStatusPatchSchema } from '@shared-feedback/schemas'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createServiceRoleSupabaseClient() as AccessSupabaseClient
  const admin = await isEarlyAccessAdmin(adminClient, user.id, user.email)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: rows, error } = await adminClient
    .from('early_access_feedback')
    .select(
      'id, user_id, org_id, surface, category, message, page_route, urls, attachment_urls, context, status, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userIds = [...new Set((rows ?? []).map((r) => r.user_id as string))]
  const { data: profiles } = userIds.length
    ? await adminClient.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] }

  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id as string, p.full_name as string | null]))

  const feedback = (rows ?? []).map((row) => ({
    ...row,
    user_name: nameById[row.user_id as string] ?? null,
  }))

  return NextResponse.json({ feedback })
}

const patchBodySchema = feedbackStatusPatchSchema.extend({
  action: z.literal('update_status'),
})

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createServiceRoleSupabaseClient() as AccessSupabaseClient
  const admin = await isEarlyAccessAdmin(adminClient, user.id, user.email)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = patchBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { error } = await adminClient
    .from('early_access_feedback')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
