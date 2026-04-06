import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const SUDARVID_URL = process.env.SUDARVID_URL?.replace(/\/$/, '')

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!SUDARVID_URL) {
    return NextResponse.json({ error: 'Video service not configured' }, { status: 503 })
  }

  try {
    const res = await fetch(`${SUDARVID_URL}/status/${params.jobId}`)
    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ error: detail || res.statusText }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to reach video service' },
      { status: 502 }
    )
  }
}
