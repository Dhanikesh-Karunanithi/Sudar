import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient, createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null
  if (!body?.endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 })

  const endpointHash = createHash('sha256').update(body.endpoint).digest('hex')
  const admin = createServiceRoleSupabaseClient()
  const { error } = await admin
    .from('notification_channels')
    .update({ revoked_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('channel', 'web_push')
    .eq('endpoint_hash', endpointHash)

  await admin.from('user_notification_settings').upsert({ user_id: user.id, last_revoke_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
