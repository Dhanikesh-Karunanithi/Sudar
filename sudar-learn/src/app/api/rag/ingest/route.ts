/**
 * RAG ingest: chunk and embed course content, upsert into content_chunks.
 * Call POST with { course_id?: string } — if course_id, index that course only; else index all published courses.
 * Requires TOGETHER_API_KEY (default) or OPENAI_API_KEY and content_chunks table (pgvector). Set EMBED_PROVIDER=together|openai.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { embedTexts, EMBED_DIMENSIONS } from '@/lib/embed'
import { rejectSensitiveLearnerAiInput } from '@/lib/security/learnerAiInputGuard'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    let body: { course_id?: string } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    const { course_id: singleCourseId } = body

    let query = admin.from('courses').select('id, title, description, difficulty, tags').eq('status', 'published')
    if (singleCourseId) query = query.eq('id', singleCourseId) as typeof query
    const { data: courses, error: coursesError } = await query
    if (coursesError || !courses?.length) {
      return NextResponse.json({ ok: true, indexed: 0, message: 'No courses to index' })
    }

    const chunks: { course_id: string; content: string; chunk_index: number; chunk_type: string }[] = []
    for (const c of courses) {
      const parts = [c.title, c.description ?? '', (c.tags as string[])?.join(' ') ?? '']
      const content = parts.filter(Boolean).join('\n\n').trim().slice(0, 8000)
      if (content) chunks.push({ course_id: c.id, content, chunk_index: 0, chunk_type: 'course' })
    }
    if (chunks.length === 0) return NextResponse.json({ ok: true, indexed: 0 })

    const blockedRag = await rejectSensitiveLearnerAiInput(
      admin,
      user.id,
      chunks.map((ch) => ch.content)
    )
    if (blockedRag) return blockedRag

    const embeddings = await embedTexts(chunks.map((ch) => ch.content))
    if (embeddings.some((e) => e.length !== EMBED_DIMENSIONS)) {
      return NextResponse.json({ error: 'Embedding failed (set TOGETHER_API_KEY or OPENAI_API_KEY and EMBED_PROVIDER)' }, { status: 500 })
    }

    const courseIds = [...new Set(chunks.map((c) => c.course_id))]
    const { error: deleteError } = await admin.from('content_chunks').delete().in('course_id', courseIds)
    if (deleteError) {
      return NextResponse.json({ error: 'Failed to clear existing chunks' }, { status: 500 })
    }

    const rows = chunks.map((ch, i) => ({
      course_id: ch.course_id,
      module_id: null,
      chunk_index: ch.chunk_index,
      chunk_type: ch.chunk_type,
      content: ch.content,
      embedding: embeddings[i] ?? [],
      metadata: {},
    }))

    const { error: insertError } = await admin.from('content_chunks').insert(rows)
    if (insertError) {
      return NextResponse.json({ error: 'Failed to insert chunks' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, indexed: rows.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
