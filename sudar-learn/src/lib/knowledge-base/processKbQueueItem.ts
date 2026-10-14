import type { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { convertFileToMarkdown } from '@/lib/intelligence/kb-convert'
import { chunkText } from '@/lib/rag/chunk'
import { embedTexts, EMBED_DIMENSIONS } from '@/lib/embed'
import { rejectSensitiveLearnerAiInput } from '@/lib/security/learnerAiInputGuard'

type Admin = ReturnType<typeof createServiceRoleSupabaseClient>

const BUCKET = 'course-media'
const PREVIEW_LEN = 2000

export async function processKbQueueItem(
  admin: Admin,
  queueId: string,
): Promise<{ ok: boolean; error?: string; chunkCount?: number }> {
  const { data: row, error: fetchErr } = await admin
    .from('kb_ingest_queue')
    .select('*')
    .eq('id', queueId)
    .maybeSingle()

  if (fetchErr || !row) return { ok: false, error: 'queue row not found' }
  if (row.status !== 'pending') return { ok: false, error: `skip status ${row.status}` }

  const now = new Date().toISOString()
  await admin
    .from('kb_ingest_queue')
    .update({ status: 'processing', progress_pct: 5, processing_started_at: now, error_message: null })
    .eq('id', queueId)

  try {
    const { data: fileData, error: dlErr } = await admin.storage
      .from(BUCKET)
      .download(row.file_storage_path as string)
    if (dlErr || !fileData) throw new Error(dlErr?.message ?? 'download failed')

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const filename = row.original_filename as string
    const mime =
      fileData.type ||
      (filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream')

    await admin.from('kb_ingest_queue').update({ progress_pct: 20 }).eq('id', queueId)

    const converted = await convertFileToMarkdown(buffer, filename, mime)
    const preview = converted.markdown.slice(0, PREVIEW_LEN)

    await admin
      .from('kb_ingest_queue')
      .update({ progress_pct: 40, converted_markdown_preview: preview })
      .eq('id', queueId)

    const textChunks = chunkText(converted.markdown.slice(0, 200_000), 80)
    if (textChunks.length === 0) throw new Error('no chunks produced from document')

    const contents = textChunks.map((c) => c.content)
    const blocked = await rejectSensitiveLearnerAiInput(admin, row.uploaded_by as string, contents)
    if (blocked) {
      throw new Error('document contains blocked sensitive content')
    }

    await admin.from('kb_ingest_queue').update({ progress_pct: 60 }).eq('id', queueId)

    const embeddings = await embedTexts(contents)
    if (embeddings.some((e) => e.length !== EMBED_DIMENSIONS)) {
      throw new Error('embedding failed — check EMBED_PROVIDER / API keys')
    }

    const kbId = row.kb_id as string
    const sourceDoc = filename

    const insertRows = textChunks.map((tc, i) => ({
      course_id: null,
      module_id: null,
      kb_id: kbId,
      chunk_index: tc.chunk_index,
      chunk_type: 'kb',
      content: tc.content,
      embedding: embeddings[i] ?? [],
      metadata: {
        kb_id: kbId,
        source_doc: sourceDoc,
        queue_id: queueId,
        pages: converted.pages ?? undefined,
      },
    }))

    const { error: insertErr } = await admin.from('content_chunks').insert(insertRows)
    if (insertErr) throw new Error(insertErr.message)

    // Prune prior KB chunks only after the new batch is stored — avoids data loss on embed/insert failure.
    const { error: pruneErr } = await admin
      .from('content_chunks')
      .delete()
      .eq('kb_id', kbId)
      .eq('chunk_type', 'kb')
      .filter('metadata->>queue_id', 'neq', queueId)
    if (pruneErr) throw new Error(pruneErr.message)

    await admin
      .from('kb_ingest_queue')
      .update({
        status: 'completed',
        progress_pct: 100,
        chunk_count: insertRows.length,
        processing_completed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', queueId)

    return { ok: true, chunkCount: insertRows.length }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await admin
      .from('kb_ingest_queue')
      .update({
        status: 'failed',
        progress_pct: 0,
        error_message: msg.slice(0, 2000),
        processing_completed_at: new Date().toISOString(),
      })
      .eq('id', queueId)
    return { ok: false, error: msg }
  }
}
