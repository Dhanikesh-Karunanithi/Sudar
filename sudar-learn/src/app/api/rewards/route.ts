/**
 * GET /api/rewards
 * Returns the full reward catalog with learner's redemption history.
 */

import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()

  const [catalogRes, redemptionsRes, profileRes] = await Promise.all([
    admin
      .from('reward_catalog')
      .select('id, slug, title, description, category, cost_coins, metadata, is_active')
      .eq('is_active', true)
      .order('category')
      .order('cost_coins'),
    admin
      .from('reward_redemptions')
      .select('reward_id, redeemed_at, applied')
      .eq('user_id', user.id),
    admin
      .from('learner_profiles')
      .select('coin_balance')
      .eq('user_id', user.id)
      .single(),
  ])

  const redeemedIds = new Set((redemptionsRes.data ?? []).map((r) => r.reward_id))
  const redemptionMap = new Map(
    (redemptionsRes.data ?? []).map((r) => [r.reward_id, { redeemedAt: r.redeemed_at, applied: r.applied }])
  )

  const catalog = (catalogRes.data ?? []).map((item) => ({
    ...item,
    owned: redeemedIds.has(item.id),
    redemptionInfo: redemptionMap.get(item.id) ?? null,
    canAfford: (profileRes.data?.coin_balance ?? 0) >= item.cost_coins,
  }))

  return NextResponse.json({
    success: true,
    data: {
      catalog,
      balance: profileRes.data?.coin_balance ?? 0,
    },
  })
}
