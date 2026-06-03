import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { requireOrgContentEditor } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({ queue_id: z.string().uuid() })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgContentEditor(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'queue_id required' }, { status: 400 })

  const admin = createServiceRoleSupabaseClient()
  const { data: row } = await admin
    .from('kb_ingest_queue')
    .select('id, org_id, status')
    .eq('id', parsed.data.queue_id)
    .maybeSingle()

  if (!row || row.org_id !== orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (row.status !== 'failed') {
    return NextResponse.json({ error: 'Only failed jobs can be retried' }, { status: 400 })
  }

  const { error } = await admin
    .from('kb_ingest_queue')
    .update({
      status: 'pending',
      progress_pct: 0,
      error_message: null,
      processing_started_at: null,
      processing_completed_at: null,
    })
    .eq('id', parsed.data.queue_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, queueId: parsed.data.queue_id, status: 'pending' })
}
