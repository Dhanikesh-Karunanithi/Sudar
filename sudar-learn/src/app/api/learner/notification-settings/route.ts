import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NOTIFICATION_CATEGORIES } from '../../../../../../shared/notifications/categories'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const [{ data: settings }, { data: preferences }, { data: channels }, { data: log }, { data: profile }] = await Promise.all([
    admin.from('user_notification_settings').select('*').eq('user_id', user.id).maybeSingle(),
    admin.from('notification_preferences').select('category_slug, channel, enabled').eq('user_id', user.id),
    admin.from('notification_channels').select('channel, revoked_at').eq('user_id', user.id),
    admin.from('notification_delivery_log').select('status, created_at').eq('user_id', user.id).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    admin.from('learner_profiles').select('coin_balance').eq('user_id', user.id).maybeSingle(),
  ])

  const sent = (log ?? []).filter((r) => ['sent', 'queued', 'delivered'].includes((r as { status: string }).status)).length
  const opened = (log ?? []).filter((r) => ['opened', 'clicked'].includes((r as { status: string }).status)).length
  const suppressed = (log ?? []).filter((r) => (r as { status: string }).status === 'suppressed').length

  return NextResponse.json({
    settings: settings ?? {
      timezone: 'UTC',
      locale: 'en',
      frequency_mode: 'balanced',
      daily_digest_email: false,
    },
    categories: NOTIFICATION_CATEGORIES,
    preferences: preferences ?? [],
    channel_status: {
      web_push_enabled: (channels ?? []).some((c: { channel: string; revoked_at: string | null }) => c.channel === 'web_push' && !c.revoked_at),
      email_enabled: (channels ?? []).some((c: { channel: string; revoked_at: string | null }) => c.channel === 'email' && !c.revoked_at),
    },
    activity: { sent, opened, suppressed },
    coin_preview: { balance: profile?.coin_balance ?? 0, opt_in_bonus_awarded_at: settings?.coin_opt_in_awarded_at ?? null, last_monthly_bonus_at: settings?.last_monthly_bonus_at ?? null },
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as {
    settings?: Record<string, unknown>
    preferences?: Array<{ category_slug: string; channel: string; enabled: boolean }>
  }
  const admin = createAdminClient()

  if (body.settings && typeof body.settings === 'object') {
    await admin.from('user_notification_settings').upsert({
      user_id: user.id,
      ...body.settings,
      updated_at: new Date().toISOString(),
    })
  }

  if (Array.isArray(body.preferences)) {
    for (const pref of body.preferences) {
      await admin.from('notification_preferences').upsert({
        user_id: user.id,
        category_slug: pref.category_slug,
        channel: pref.channel,
        enabled: !!pref.enabled,
        updated_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ ok: true })
}
