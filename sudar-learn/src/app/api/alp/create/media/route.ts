/**
 * ALP Create — Async media generation job (SudarMedia).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createMediaRequestSchema } from '@shared-content-generation/schemas'
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

  const parsed = createMediaRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const auth = await resolveCreateAuth(request, parsed.data.creator_user_id)
  if (!auth.ok) return auth.response

  const { data: job, error } = await contentGenerationJobsTable(auth.ctx.admin)
    .insert({
      org_id: auth.ctx.orgId,
      creator_user_id: auth.ctx.creatorUserId,
      job_type: 'media',
      status: 'queued',
      request_payload: {
        content: parsed.data.content,
        title: parsed.data.title ?? null,
        media_type: parsed.data.media_type,
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
    job_type: 'media',
    status: job.status,
    progress: 0,
    request_payload: {
      content: parsed.data.content,
      title: parsed.data.title,
      media_type: parsed.data.media_type,
    },
    result_payload: null,
    error_message: null,
    webhook_url: parsed.data.webhook_url ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } satisfies ContentGenerationJobRow)

  return NextResponse.json({ success: true, job_id: job.id, status: 'queued' })
}
