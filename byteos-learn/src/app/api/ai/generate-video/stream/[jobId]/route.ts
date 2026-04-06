import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const SUDARVID_URL = process.env.SUDARVID_URL?.replace(/\/$/, '')

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(
      `data: ${JSON.stringify({ event: 'error', data: { error: 'Unauthorized' } })}\n\n`,
      { status: 401, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  if (!SUDARVID_URL) {
    return new Response(
      `data: ${JSON.stringify({ event: 'error', data: { error: 'Video service not configured' } })}\n\n`,
      { status: 503, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  try {
    const upstream = await fetch(`${SUDARVID_URL}/stream/${params.jobId}`, {
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
