import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getSudarVidBaseUrl } from '@/lib/sudarvid'
import { canUserAccessSudarVidJob } from '@/lib/security/sudarVidAccess'

const SUDARVID_URL = getSudarVidBaseUrl()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(
      `data: ${JSON.stringify({ event: 'error', data: { error: 'Unauthorized' } })}\n\n`,
      { status: 401, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  const admin = createAdminClient()
  const allowed = await canUserAccessSudarVidJob(admin, user.id, jobId)
  if (!allowed) {
    return new Response(
      `data: ${JSON.stringify({ event: 'error', data: { error: 'Forbidden' } })}\n\n`,
      { status: 403, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  try {
    const upstream = await fetch(`${SUDARVID_URL}/stream/${jobId}`, {
      headers: { Accept: 'text/event-stream' },
    })

    if (!upstream.ok || !upstream.body) {
      return new Response(
        `data: ${JSON.stringify({ event: 'error', data: { error: 'Stream unavailable' } })}\n\n`,
        { status: 502, headers: { 'Content-Type': 'text/event-stream' } }
      )
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    return new Response(
      `data: ${JSON.stringify({ event: 'error', data: { error: err instanceof Error ? err.message : 'Unknown error' } })}\n\n`,
      { status: 502, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }
}
