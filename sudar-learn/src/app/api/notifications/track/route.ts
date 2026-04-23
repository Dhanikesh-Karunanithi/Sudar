import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const notificationId = searchParams.get('id')
  const event = searchParams.get('event')
  if (!notificationId || !event) return NextResponse.json({ error: 'id and event required' }, { status: 400 })

  const admin = createAdminClient()
  const now = new Date().toISOString()
  const patch: Record<string, string> = {}
  if (event === 'open') patch.opened_at = now
  if (event === 'click') patch.clicked_at = now
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Invalid event' }, { status: 400 })

  await admin
    .from('notification_delivery_log')
    .update({ ...patch, status: event === 'click' ? 'clicked' : 'opened' })
    .eq('notification_id', notificationId)

  return NextResponse.json({ ok: true })
}
