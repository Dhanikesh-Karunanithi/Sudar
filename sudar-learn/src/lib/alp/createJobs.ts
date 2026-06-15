/**
 * Process Sudar Create async jobs (document outline, media placeholders).
 */
import { createHmac } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateAuthContext } from '@/lib/alp/createAuth'
import { contentGenerationJobsTable, type ContentGenerationJobRow } from '@/lib/alp/contentGenerationJobsDb'
import { generateDocumentOutlineForCreate } from '@/lib/alp/createGeneration'
import { buildInteractiveScormZip } from '@shared-content-generation/scorm/buildSingleScoZip'

export async function runContentGenerationJob(
  admin: SupabaseClient,
  ctx: CreateAuthContext,
  job: ContentGenerationJobRow,
): Promise<void> {
  const jobs = contentGenerationJobsTable(admin)

  await jobs
    .update({ status: 'running', progress: 0.1, updated_at: new Date().toISOString() })
    .eq('id', job.id)

  try {
    if (job.job_type === 'from_document') {
      const text = String(job.request_payload.text ?? '')
      if (!text.trim()) throw new Error('Document text required')

      const outline = await generateDocumentOutlineForCreate(ctx, {
        text,
        courseTitle: job.request_payload.course_title as string | undefined,
        difficulty: (job.request_payload.difficulty as string | undefined) ?? 'intermediate',
        language: (job.request_payload.language as string | undefined) ?? 'en',
      })

      await jobs
        .update({ progress: 0.7, updated_at: new Date().toISOString() })
        .eq('id', job.id)

      let scorm_base64: string | undefined
      if (job.request_payload.export_format === 'scorm12' && outline.modules.length) {
        const zip = buildInteractiveScormZip({
          title: outline.course_title ?? 'Course outline',
          elements: [
            {
              type: 'timeline',
              data: {
                steps: outline.modules.map((m) => ({ title: m, description: '' })),
              },
            },
          ],
        })
        scorm_base64 = zip.toString('base64')
      }

      const result = { ...outline, scorm_base64 }
      await jobs.update({
        status: 'completed',
        progress: 1,
        result_payload: result,
        updated_at: new Date().toISOString(),
      }).eq('id', job.id)

      if (job.webhook_url) {
        await deliverWebhook(job.webhook_url, { job_id: job.id, status: 'completed', result })
      }
      return
    }

    if (job.job_type === 'media') {
      const content = String(job.request_payload.content ?? '')
      const mediaType = String(job.request_payload.media_type ?? 'podcast')
      const title = String(job.request_payload.title ?? 'Media activity')

      await jobs
        .update({ progress: 0.5, updated_at: new Date().toISOString() })
        .eq('id', job.id)

      const result = {
        media_type: mediaType,
        title,
        status_note:
          mediaType === 'video'
            ? 'Video generation queued — connect SudarVid for full MP4 output in production.'
            : 'Podcast script generated — connect Studio podcast route for MP4/MP3 in production.',
        script_excerpt: content.slice(0, 500),
      }

      await jobs.update({
        status: 'completed',
        progress: 1,
        result_payload: result,
        updated_at: new Date().toISOString(),
      }).eq('id', job.id)

      if (job.webhook_url) {
        await deliverWebhook(job.webhook_url, { job_id: job.id, status: 'completed', result })
      }
      return
    }

    throw new Error(`Unknown job type: ${job.job_type}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Job failed'
    await jobs.update({
      status: 'failed',
      error_message: message,
      updated_at: new Date().toISOString(),
    }).eq('id', job.id)

    if (job.webhook_url) {
      await deliverWebhook(job.webhook_url, { job_id: job.id, status: 'failed', error: message })
    }
  }
}

async function deliverWebhook(url: string, payload: Record<string, unknown>): Promise<void> {
  const secret = process.env.ALP_WEBHOOK_HMAC_SECRET?.trim()
  const body = JSON.stringify(payload)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) {
    headers['x-sudar-signature'] = createHmac('sha256', secret).update(body, 'utf8').digest('hex')
  }
  try {
    await fetch(url, { method: 'POST', headers, body })
  } catch {
    // Best-effort webhook delivery
  }
}
