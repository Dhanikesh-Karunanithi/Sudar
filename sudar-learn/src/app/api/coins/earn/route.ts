/**
 * POST /api/coins/earn
 * Internal route called by the gamification engine.
 * Awards coins + XP, handles level-up, writes ledger entries.
 */

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { verifyInternalServiceRequest } from '@/lib/security/internalServiceAuth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getLevelForXp, SCHOLAR_RANKS } from '@/lib/gamification/types'

const bodySchema = z.object({
  user_id: z.string().uuid(),
  coins: z.number().int().min(0),
  xp: z.number().int().min(0),
  eventType: z.string().min(1),
  referenceId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
})

export async function POST(request: NextRequest) {
  if (!verifyInternalServiceRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { user_id: userId, coins, xp, eventType, referenceId, metadata } = parsed.data

  const admin = createServiceRoleSupabaseClient()

  const { data: profile } = await admin
    .from('learner_profiles')
    .select('coin_balance, xp_total, scholar_level, scholar_title')
    .eq('user_id', userId)
    .single()

  const currentCoins = profile?.coin_balance ?? 0
  const currentXp = profile?.xp_total ?? 0
  const currentLevel = profile?.scholar_level ?? 1

  const newBalance = currentCoins + coins
  const newXp = currentXp + xp

  const { level: newLevel, title: newTitle } = getLevelForXp(newXp)
  let levelUpCoins = 0
  let levelUp: { from: number; to: number; newTitle: string } | null = null

  if (newLevel > currentLevel) {
    levelUp = { from: currentLevel, to: newLevel, newTitle }
    const rank = SCHOLAR_RANKS.find((r) => r.level === newLevel)
    levelUpCoins = rank?.levelUpCoins ?? 0
  }

  const finalBalance = newBalance + levelUpCoins

  if (coins > 0) {
    await admin.from('coin_ledger').insert({
      user_id: userId,
      amount: coins,
      event_type: eventType,
      reference_id: referenceId ?? null,
      balance_after: finalBalance,
      metadata: metadata ?? null,
    })
  }
  if (xp > 0) {
    await admin.from('xp_ledger').insert({
      user_id: userId,
      amount: xp,
      source_type: eventType,
      reference_id: referenceId ?? null,
    })
  }
  if (levelUpCoins > 0) {
    await admin.from('coin_ledger').insert({
      user_id: userId,
      amount: levelUpCoins,
      event_type: 'level_up',
      balance_after: finalBalance,
      metadata: { levelUp },
    })
  }

  await admin.from('learner_profiles').update({
    coin_balance: finalBalance,
    xp_total: newXp,
    ...(levelUp ? { scholar_level: newLevel, scholar_title: newTitle } : {}),
  }).eq('user_id', userId)

  return NextResponse.json({ success: true, data: { newBalance: finalBalance, newXp, levelUp } })
}
