import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { verifyUnsubscribeToken } from '../../../../../../shared/notifications/unsubscribeToken'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })
  const verification = verifyUnsubscribeToken(token)
  if (!verification.valid) return NextResponse.json({ error: `invalid token: ${verification.reason}` }, { status: 400 })

  const admin = createServiceRoleSupabaseClient()
  await admin.from('user_notification_settings').upsert({
    user_id: verification.userId,
    daily_digest_email: false,
    frequency_mode: 'minimal',
    never_prompt_push: true,
  })

  return NextResponse.redirect(new URL('/settings/notifications?unsubscribed=1', request.url))
}
