import type { SupabaseClient } from '@supabase/supabase-js'

interface AwardOptInBonusInput {
  userId: string
  endpointHash: string
  coinAmount?: number
}

export async function awardNotificationOptInBonus(
  admin: SupabaseClient<unknown>,
  input: AwardOptInBonusInput
): Promise<{ awarded: boolean; reason?: string }> {
  const { data: settings } = await admin
    .from('user_notification_settings')
    .select('coin_opt_in_awarded_at, last_revoke_at')
    .eq('user_id', input.userId)
    .maybeSingle()

  if (settings?.coin_opt_in_awarded_at) return { awarded: false, reason: 'already_awarded' }

  if (settings?.last_revoke_at) {
    const elapsed = Date.now() - new Date(settings.last_revoke_at).getTime()
    if (elapsed < 30 * 24 * 60 * 60 * 1000) return { awarded: false, reason: 'cooldown_30d' }
  }

  const { count: endpointCount } = await admin
    .from('notification_channels')
    .select('id', { count: 'exact', head: true })
    .eq('endpoint_hash', input.endpointHash)
    .neq('user_id', input.userId)

  if ((endpointCount ?? 0) > 0) return { awarded: false, reason: 'endpoint_reused' }

  const { data: profile } = await admin
    .from('learner_profiles')
    .select('coin_balance')
    .eq('user_id', input.userId)
    .maybeSingle()

  const coinAmount = input.coinAmount ?? 10
  const nextBalance = (profile?.coin_balance ?? 0) + coinAmount

  const { error: ledgerError } = await admin.from('coin_ledger').insert({
    user_id: input.userId,
    amount: coinAmount,
    event_type: 'notifications_opt_in_bonus',
    reference_id: input.userId,
    balance_after: nextBalance,
    metadata: { endpoint_hash: input.endpointHash },
  })

  if (ledgerError) return { awarded: false, reason: 'ledger_insert_failed' }

  await admin.from('learner_profiles').update({ coin_balance: nextBalance }).eq('user_id', input.userId)
  await admin
    .from('user_notification_settings')
    .upsert({ user_id: input.userId, coin_opt_in_awarded_at: new Date().toISOString() })

  return { awarded: true }
}

export async function runMonthlyNotificationBonuses(admin: SupabaseClient<unknown>, monthStartIso?: string) {
  const now = new Date()
  const monthStart = monthStartIso ? new Date(monthStartIso) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const lookback = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const { data: users } = await admin
    .from('user_notification_settings')
    .select('user_id, frequency_mode, last_monthly_bonus_at')

  for (const row of users ?? []) {
    if (row.last_monthly_bonus_at && new Date(row.last_monthly_bonus_at) >= monthStart) continue

    const { data: stats } = await admin
      .from('notification_delivery_log')
      .select('status, channel, created_at')
      .eq('user_id', row.user_id)
      .gte('created_at', lookback.toISOString())
      .in('channel', ['web_push', 'email'])

    const sent = (stats ?? []).filter((s: { status: string }) => ['sent', 'delivered', 'queued'].includes(s.status)).length
    const engaged = (stats ?? []).filter((s: { status: string }) => ['opened', 'clicked'].includes(s.status)).length
    const openRate = sent > 0 ? engaged / sent : 0

    if (sent >= 10 && openRate >= 0.3) {
      const { data: profile } = await admin
        .from('learner_profiles')
        .select('coin_balance')
        .eq('user_id', row.user_id)
        .maybeSingle()
      const nextBalance = (profile?.coin_balance ?? 0) + 25
      await admin.from('coin_ledger').insert({
        user_id: row.user_id,
        amount: 25,
        event_type: 'notifications_monthly_engagement_bonus',
        reference_id: monthStart.toISOString(),
        balance_after: nextBalance,
        metadata: { open_rate: openRate },
      })
      await admin.from('learner_profiles').update({ coin_balance: nextBalance }).eq('user_id', row.user_id)
      await admin
        .from('user_notification_settings')
        .update({ last_monthly_bonus_at: new Date().toISOString() })
        .eq('user_id', row.user_id)
      continue
    }

    if (row.frequency_mode === 'minimal') {
      const { count } = await admin
        .from('learning_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', row.user_id)
        .eq('event_type', 'quest_completed')
        .gte('created_at', monthStart.toISOString())
      if ((count ?? 0) >= 4) {
        const { data: profile } = await admin
          .from('learner_profiles')
          .select('coin_balance')
          .eq('user_id', row.user_id)
          .maybeSingle()
        const nextBalance = (profile?.coin_balance ?? 0) + 10
        await admin.from('coin_ledger').insert({
          user_id: row.user_id,
          amount: 10,
          event_type: 'notifications_offline_focus_bonus',
          reference_id: monthStart.toISOString(),
          balance_after: nextBalance,
          metadata: { quest_count: count ?? 0 },
        })
        await admin.from('learner_profiles').update({ coin_balance: nextBalance }).eq('user_id', row.user_id)
        await admin
          .from('user_notification_settings')
          .update({ last_monthly_bonus_at: new Date().toISOString() })
          .eq('user_id', row.user_id)
      }
    }
  }
}
