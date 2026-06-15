/**
 * RAG ingest: chunk and embed course + module content, upsert into content_chunks.
 * Call POST with { course_id?: string } — if course_id, index that course only; else all published.
 * Requires embedding provider (Together, OpenAI, or Hugging Face) and pgvector migration.
 */

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { verifyInternalServiceRequest } from '@/lib/security/internalServiceAuth'
import { NextRequest, NextResponse } from 'next/server'
import { embedTexts, EMBED_DIMENSIONS } from '@/lib/embed'
import { chunkText, extractModuleBody } from '@/lib/rag/chunk'
import { isAppLocale } from '../../../../../../shared/i18nLocales'

interface IngestChunk {
  course_id: string
  module_id: string | null
  content: string
  chunk_index: number
  chunk_type: 'course' | 'module'
  metadata: Record<string, unknown>
}

async function resolveOrgContentLanguage(
  admin: ReturnType<typeof createServiceRoleSupabaseClient>,
  orgId: string
): Promise<string | null> {
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).maybeSingle()
  const settings = (org?.settings as Record<string, unknown> | undefined) ?? {}
  const loc = settings.localization as Record<string, unknown> | undefined
  const raw = loc?.default_ui_locale
  return typeof raw === 'string' && isAppLocale(raw) ? raw : null
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyInternalServiceRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createServiceRoleSupabaseClient()
    let body: { course_id?: string } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    const { course_id: singleCourseId } = body

    let query = admin
      .from('courses')
      .select('id, org_id, title, description, difficulty, tags')
      .eq('status', 'published')
    if (singleCourseId) query = query.eq('id', singleCourseId) as typeof query
    const { data: courses, error: coursesError } = await query
    if (coursesError || !courses?.length) {
      return NextResponse.json({ ok: true, indexed: 0, message: 'No courses to index' })
    }

    const orgLocaleCache = new Map<string, string | null>()
    const chunks: IngestChunk[] = []

    for (const c of courses) {
      let contentLanguage = orgLocaleCache.get(c.org_id)
      if (contentLanguage === undefined) {
        contentLanguage = await resolveOrgContentLanguage(admin, c.org_id)
        orgLocaleCache.set(c.org_id, contentLanguage)
      }
      const metaBase: Record<string, unknown> = {}
      if (contentLanguage) metaBase.content_language = contentLanguage

      const { data: courseRow } = await admin
        .from('courses')
        .select('is_external')
        .eq('id', c.id)
        .maybeSingle()

      if (courseRow?.is_external) {
        try {
          const { ingestExternalCourseRag } = await import('@/lib/rag/ingestExternalCourse')
          await ingestExternalCourseRag(admin, c.id)
        } catch {
          /* external ingest optional */
        }
        continue
      }

      const courseParts = [c.title, c.description ?? '', (c.tags as string[])?.join(' ') ?? '']
      const courseContent = courseParts.filter(Boolean).join('\n\n').trim().slice(0, 8000)
      if (courseContent) {
        chunks.push({
          course_id: c.id,
          module_id: null,
          content: courseContent,
          chunk_index: 0,
          chunk_type: 'course',
          metadata: { ...metaBase },
        })
      }

      const { data: modules } = await admin
        .from('modules')
        .select('id, title, content, order_index')
        .eq('course_id', c.id)
        .order('order_index', { ascending: true })

      for (const m of modules ?? []) {
        const bodyText = extractModuleBody(
          m.content as { type?: string; body?: string; scorm_text_content?: string } | null
        )
        const header = `[Module: ${m.title}]`
        const fullText = bodyText ? `${header}\n\n${bodyText}` : header
        const moduleChunks = chunkText(fullText.slice(0, 24000))
        for (const mc of moduleChunks) {
          chunks.push({
            course_id: c.id,
            module_id: m.id,
            content: mc.content,
            chunk_index: mc.chunk_index,
            chunk_type: 'module',
            metadata: {
              ...metaBase,
              module_title: m.title,
            },
          })
        }
      }
    }

    if (chunks.length === 0) return NextResponse.json({ ok: true, indexed: 0 })

    const embeddings = await embedTexts(chunks.map((ch) => ch.content))
    if (embeddings.some((e) => e.length !== EMBED_DIMENSIONS)) {
      return NextResponse.json(
        {
          error:
            'Embedding failed. Set TOGETHER_API_KEY, OPENAI_API_KEY, or HUGGINGFACE_API_KEY and EMBED_PROVIDER.',
        },
        { status: 500 }
      )
    }

    const courseIds = [...new Set(chunks.map((c) => c.course_id))]
    const { error: deleteError } = await admin.from('content_chunks').delete().in('course_id', courseIds)
    if (deleteError) {
      return NextResponse.json({ error: 'Failed to clear existing chunks' }, { status: 500 })
    }

    const rows = chunks.map((ch, i) => ({
      course_id: ch.course_id,
      module_id: ch.module_id,
      chunk_index: ch.chunk_index,
      chunk_type: ch.chunk_type,
      content: ch.content,
      embedding: embeddings[i] ?? [],
      metadata: ch.metadata,
    }))

    const { error: insertError } = await admin.from('content_chunks').insert(rows)
    if (insertError) {
      return NextResponse.json({ error: 'Failed to insert chunks' }, { status: 500 })
    }
    return NextResponse.json({
      ok: true,
      indexed: rows.length,
      courses: courseIds.length,
      module_chunks: rows.filter((r) => r.chunk_type === 'module').length,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
