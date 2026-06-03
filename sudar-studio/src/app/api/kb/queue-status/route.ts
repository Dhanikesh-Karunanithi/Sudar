import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrgIdAndRole } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const queueId = request.nextUrl.searchParams.get('queueId')?.trim()
  if (!queueId) return NextResponse.json({ error: 'queueId required' }, { status: 400 })

  const { orgId } = await getOrgIdAndRole(user.id)
  const admin = createServiceRoleSupabaseClient()
  const { data, error } = await admin
    .from('kb_ingest_queue')
    .select(
      'id, kb_id, org_id, status, progress_pct, chunk_count, error_message, converted_markdown_preview, original_filename, created_at, processing_completed_at',
    )
    .eq('id', queueId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.org_id !== orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    status: data.status,
    progress_pct: data.progress_pct,
    chunk_count: data.chunk_count,
    error_message: data.error_message,
    preview: data.converted_markdown_preview,
    original_filename: data.original_filename,
  })
}
