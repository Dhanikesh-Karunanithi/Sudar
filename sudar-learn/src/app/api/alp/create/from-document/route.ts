/**
 * ALP Create — Async document-to-course job (SudarDraft).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createFromDocumentRequestSchema } from '../../../../../../../shared/content-generation/schemas'
import { contentGenerationJobsTable, type ContentGenerationJobRow } from '@/lib/alp/contentGenerationJobsDb'
import { resolveCreateAuth } from '@/lib/alp/createAuth'
import { runContentGenerationJob } from '@/lib/alp/createJobs'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createFromDocumentRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  if (!parsed.data.text?.trim() && !parsed.data.url) {
    return NextResponse.json({ error: 'text or url required' }, { status: 400 })
  }

  const auth = await resolveCreateAuth(request, parsed.data.creator_user_id)
  if (!auth.ok) return auth.response

  const text = parsed.data.text?.trim() ?? `[Fetch from URL planned: ${parsed.data.url}]`

  const { data: job, error } = await contentGenerationJobsTable(auth.ctx.admin)
    .insert({
      org_id: auth.ctx.orgId,
      creator_user_id: auth.ctx.creatorUserId,
      job_type: 'from_document',
      status: 'queued',
      request_payload: {
        text,
        url: parsed.data.url ?? null,
        course_title: parsed.data.course_title ?? null,
        difficulty: parsed.data.difficulty ?? 'intermediate',
        export_format: parsed.data.export_format ?? 'json',
        language: parsed.data.language ?? 'en',
      },
      webhook_url: parsed.data.webhook_url ?? null,
    })
    .select('id, status')
    .single()

  if (error || !job) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create job' }, { status: 500 })
  }

  void runContentGenerationJob(auth.ctx.admin, auth.ctx, {
    id: job.id,
    org_id: auth.ctx.orgId,
    creator_user_id: auth.ctx.creatorUserId,
    job_type: 'from_document',
    status: job.status,
    progress: 0,
    request_payload: {
      text,
      course_title: parsed.data.course_title,
      difficulty: parsed.data.difficulty,
      export_format: parsed.data.export_format,
      language: parsed.data.language,
    },
    result_payload: null,
    error_message: null,
    webhook_url: parsed.data.webhook_url ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } satisfies ContentGenerationJobRow)

  return NextResponse.json({ success: true, job_id: job.id, status: 'queued' })
}
