import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient, createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { awardNotificationOptInBonus } from '../../../../../../../shared/notifications/guardrails'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { subscription?: Record<string, unknown> } | null
  if (!body?.subscription) return NextResponse.json({ error: 'subscription is required' }, { status: 400 })

  const endpoint = String(body.subscription.endpoint ?? '')
  if (!endpoint) return NextResponse.json({ error: 'Invalid subscription endpoint' }, { status: 400 })

  const endpointHash = createHash('sha256').update(endpoint).digest('hex')
  const admin = createServiceRoleSupabaseClient()

  const { error } = await admin.from('notification_channels').upsert({
    user_id: user.id,
    channel: 'web_push',
    endpoint_hash: endpointHash,
    endpoint_payload: body.subscription,
    user_agent: request.headers.get('user-agent') ?? null,
    revoked_at: null,
    last_seen_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const guardrail = await awardNotificationOptInBonus(admin, { userId: user.id, endpointHash })
  return NextResponse.json({ ok: true, bonus: guardrail })
}
