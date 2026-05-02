import { createServiceRoleSupabaseClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSudarVidBaseUrl } from '@/lib/sudarvid'
import { canUserAccessSudarVidJob } from '@/lib/security/sudarVidAccess'
import { normalizeEngineMode, parseGenerateMeta, summarizeManifestInteractions } from '@/lib/sudarvidContracts'

const SUDARVID_URL = getSudarVidBaseUrl()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const allowed = await canUserAccessSudarVidJob(admin, user.id, jobId)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const res = await fetch(`${SUDARVID_URL}/status/${jobId}`)
    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ error: detail || res.statusText }, { status: res.status })
    }
    const data = await res.json() as {
      status?: string
      error?: string | null
      output_files?: string[]
      meta?: Record<string, unknown>
    }
    const meta = parseGenerateMeta(data.meta)
    const engineMode = normalizeEngineMode(meta.engine_mode)

    if (data.status === 'done' || data.status === 'error') {
      let interactionSummary:
        | { total_slides: number; interaction_counts: Record<'none' | 'reflect' | 'decision' | 'checkpoint', number> }
        | undefined
      if (data.status === 'done') {
        try {
          const manifestRes = await fetch(`${SUDARVID_URL}/api/jobs/${jobId}/slides`)
          if (manifestRes.ok) {
            const manifestRows = await manifestRes.json()
            interactionSummary = summarizeManifestInteractions(manifestRows)
          }
        } catch {
          // Non-blocking: manifest endpoint can be absent for older jobs.
        }
      }

      const { count } = await admin
        .from('learning_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_type', 'video_generate_complete')
        .contains('payload', { job_id: jobId })

      if ((count ?? 0) === 0) {
        const { data: startEvent } = await admin
          .from('learning_events')
          .select('course_id, module_id')
          .eq('user_id', user.id)
          .eq('event_type', 'video_generate_start')
          .contains('payload', { job_id: jobId })
          .maybeSingle()

        await admin.from('learning_events').insert({
          user_id: user.id,
          course_id: startEvent?.course_id ?? null,
          module_id: startEvent?.module_id ?? null,
          event_type: 'video_generate_complete',
          modality: 'video',
          payload: {
            job_id: jobId,
            status: data.status,
            engine_mode: engineMode,
            error: data.error ?? null,
            output_files: data.output_files ?? [],
            meta,
            interaction_summary: interactionSummary ?? null,
          },
        })
      }
    }

    return NextResponse.json({
      ...data,
      engine_mode: engineMode,
      meta,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to reach video service' },
      { status: 502 }
    )
  }
}
