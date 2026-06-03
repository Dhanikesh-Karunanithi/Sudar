import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { requireOrgContentEditor } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import {
  KB_ALLOWED_MIMES,
  KB_MAX_BYTES,
  mimeToKbFileType,
} from '../../../../../../shared/knowledge-base/fileTypes'

const BUCKET = 'course-media'

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

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const kbId = (formData.get('kb_id') as string)?.trim()
  if (!file || !(file instanceof File)) return NextResponse.json({ error: 'file required' }, { status: 400 })
  if (!kbId) return NextResponse.json({ error: 'kb_id required' }, { status: 400 })
  if (file.size > KB_MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { fileTypeFromBuffer } = await import('file-type')
  const detected = await fileTypeFromBuffer(buffer)
  const mime = detected?.mime?.toLowerCase() ?? null
  if (!mime || !(KB_ALLOWED_MIMES as readonly string[]).includes(mime)) {
    return NextResponse.json({ error: 'Unsupported file type for knowledge base upload' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: kb } = await admin
    .from('knowledge_bases')
    .select('id, org_id')
    .eq('id', kbId)
    .maybeSingle()
  if (!kb || kb.org_id !== orgId) {
    return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 })
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, '_').slice(0, 120) || 'document'
  const ext = safeName.includes('.') ? safeName.split('.').pop() : mime.split('/')[1] ?? 'bin'
  const storageName = `${crypto.randomUUID()}.${ext}`
  const path = `${orgId}/kb/${kbId}/${storageName}`

  const { error: uploadErr } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  })
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const fileType = mimeToKbFileType(mime, safeName)
  const { data: queueRow, error: queueErr } = await admin
    .from('kb_ingest_queue')
    .insert({
      kb_id: kbId,
      org_id: orgId,
      uploaded_by: user.id,
      original_filename: safeName,
      file_storage_path: path,
      file_size_bytes: file.size,
      file_type: fileType,
      status: 'pending',
      progress_pct: 0,
    })
    .select('id, status, created_at')
    .single()

  if (queueErr) return NextResponse.json({ error: queueErr.message }, { status: 500 })

  return NextResponse.json({
    queueId: queueRow.id,
    status: queueRow.status,
    message: 'Queued for processing',
  })
}
