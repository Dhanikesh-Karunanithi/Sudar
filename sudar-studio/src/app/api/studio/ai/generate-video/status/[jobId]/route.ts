import { createServiceRoleSupabaseClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Json } from '@/types/database'

const SUDARVID_URL = process.env.SUDARVID_URL ?? 'http://localhost:8000'
const JOB_ID_SAFE_RE = /^[a-zA-Z0-9_-]{8,128}$/

function normalizeEngineMode(value: unknown): 'classic' | 'premium' {
  return value === 'premium' ? 'premium' : 'classic'
}

function parseGenerateMeta(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== 'object') return {}
  return meta as Record<string, unknown>
}

async function canUserAccessSudarVidJob(adminClient: unknown, userId: string, jobId: string): Promise<boolean> {
  if (!JOB_ID_SAFE_RE.test(jobId)) return false
  const admin = adminClient as {
    from: (table: string) => {
      select: (columns: string, options?: { count?: 'exact'; head?: boolean }) => {
        eq: (column: string, value: string) => any
        contains: (column: string, value: Record<string, unknown>) => any
        maybeSingle: () => Promise<{ data: unknown }>
      }
    }
  }

  const { data } = await admin
    .from('learning_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', 'video_generate_start')
    .contains('payload', { job_id: jobId })
    .maybeSingle()

  return !!data
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const allowed = await canUserAccessSudarVidJob(admin, user.id, jobId)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const res = await fetch(`${SUDARVID_URL.replace(/\/$/, '')}/status/${jobId}`)
    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ error: detail || res.statusText }, { status: res.status })
    }

    const data = (await res.json()) as {
      status?: string
      error?: string | null
      output_files?: string[]
      meta?: unknown
    }

    const meta = parseGenerateMeta(data.meta)
    const engineMode = normalizeEngineMode(meta.engine_mode)

    if (data.status === 'done' || data.status === 'error') {
      const { count } = await admin
        .from('learning_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_type', 'video_generate_complete')
        .contains('payload', { job_id: jobId })

      if ((count ?? 0) === 0) {
        await admin.from('learning_events').insert({
          user_id: user.id,
          course_id: null,
          module_id: null,
          event_type: 'video_generate_complete',
          modality: 'video',
          payload: {
            job_id: jobId,
            status: data.status,
            engine_mode: engineMode,
            error: data.error ?? null,
            output_files: data.output_files ?? [],
            meta,
          } as Json,
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
      { status: 502 },
    )
  }
}

