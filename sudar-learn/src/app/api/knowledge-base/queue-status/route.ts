import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const queueId = request.nextUrl.searchParams.get('queueId')?.trim()
  if (!queueId) return NextResponse.json({ error: 'queueId required' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).maybeSingle()
  const orgId = profile?.org_id as string | undefined

  const admin = createServiceRoleSupabaseClient()
  const { data, error } = await admin
    .from('kb_ingest_queue')
    .select('id, org_id, uploaded_by, status, progress_pct, chunk_count, error_message, converted_markdown_preview, original_filename')
    .eq('id', queueId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const canRead =
    data.uploaded_by === user.id ||
    (orgId && data.org_id === orgId)
  if (!canRead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    status: data.status,
    progress_pct: data.progress_pct,
    chunk_count: data.chunk_count,
    error_message: data.error_message,
    preview: data.converted_markdown_preview,
    original_filename: data.original_filename,
  })
}
