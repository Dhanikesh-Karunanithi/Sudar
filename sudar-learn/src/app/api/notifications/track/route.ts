import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { verifyNotificationTrackingToken } from '../../../../../../shared/notifications/trackingToken'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const verification = verifyNotificationTrackingToken(token)
  if (!verification.valid) {
    return NextResponse.json({ error: `invalid token: ${verification.reason}` }, { status: 400 })
  }

  const { notificationId, event } = verification

  const admin = createServiceRoleSupabaseClient()
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
