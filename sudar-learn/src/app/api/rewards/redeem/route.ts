/**
 * POST /api/rewards/redeem
 * Delegates to /api/coins/spend — exists as a named semantic endpoint.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({ rewardSlug: z.string().min(1) })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { rewardSlug } = parsed.data
  const admin = createAdminClient()

  const { data: reward } = await admin
    .from('reward_catalog')
    .select('id, cost_coins, title, category, metadata, is_active')
    .eq('slug', rewardSlug)
    .single()

  if (!reward || !reward.is_active) {
    return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
  }

  const { data: profile } = await admin
    .from('learner_profiles')
    .select('coin_balance')
    .eq('user_id', user.id)
    .single()

  const currentBalance = profile?.coin_balance ?? 0
  if (currentBalance < reward.cost_coins) {
    return NextResponse.json({
      error: 'Insufficient coins',
      data: { balance: currentBalance, required: reward.cost_coins },
    }, { status: 402 })
  }

  const newBalance = currentBalance - reward.cost_coins

  await admin.from('coin_ledger').insert({
    user_id: user.id,
    amount: -reward.cost_coins,
    event_type: 'reward_redeemed',
    balance_after: newBalance,
    metadata: { reward_slug: rewardSlug, reward_title: reward.title },
  })

  await admin.from('reward_redemptions').insert({
    user_id: user.id,
    reward_id: reward.id,
    cost_coins: reward.cost_coins,
    applied: false,
  })

  await admin.from('learner_profiles').update({ coin_balance: newBalance }).eq('user_id', user.id)

  await admin.from('learning_events').insert({
    user_id: user.id,
    event_type: 'reward_redeemed',
    payload: { reward_slug: rewardSlug, cost: reward.cost_coins },
  })

  return NextResponse.json({
    success: true,
    data: {
      newBalance,
      reward: { slug: rewardSlug, title: reward.title, category: reward.category, metadata: reward.metadata },
    },
  })
}
