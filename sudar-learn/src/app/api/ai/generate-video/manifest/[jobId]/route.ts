import { createServiceRoleSupabaseClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSudarVidBaseUrl } from '@/lib/sudarvid'
import { canUserAccessSudarVidJob } from '@/lib/security/sudarVidAccess'
import { normalizeInteractionType, summarizeManifestInteractions } from '@/lib/sudarvidContracts'

const SUDARVID_URL = getSudarVidBaseUrl()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const allowed = await canUserAccessSudarVidJob(admin, user.id, jobId)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const res = await fetch(`${SUDARVID_URL}/api/jobs/${jobId}/slides`)
    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ error: detail || res.statusText }, { status: res.status })
    }

    const rows = await res.json() as unknown[]
    const normalized = Array.isArray(rows)
      ? rows.map((row) => {
        const item = (row && typeof row === 'object') ? row as Record<string, unknown> : {}
        return {
          ...item,
          interaction_type: normalizeInteractionType(item.interaction_type),
        }
      })
      : []

    return NextResponse.json({
      slides: normalized,
      summary: summarizeManifestInteractions(normalized),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch manifest' },
      { status: 502 },
    )
  }
}
