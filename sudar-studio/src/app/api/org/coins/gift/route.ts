/**
 * POST /api/org/coins/gift
 * Manager/admin gifts Sudar Coins to a learner.
 * Requires MANAGER or ORG_ADMIN role.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  recipientUserId: z.string().uuid(),
  amount: z.number().int().min(1).max(5000),
  message: z.string().max(200).optional().nullable(),
})

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

  const { recipientUserId, amount, message } = parsed.data
  const admin = createAdminClient()

  // Verify sender role
  const { data: senderProfile } = await admin
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!senderProfile?.org_id || !['ORG_ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(senderProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify recipient is in the same org
  const { data: recipientProfile } = await admin
    .from('profiles')
    .select('org_id, full_name')
    .eq('id', recipientUserId)
    .single()

  if (recipientProfile?.org_id !== senderProfile.org_id) {
    return NextResponse.json({ error: 'Recipient not in your org' }, { status: 403 })
  }

  // Load recipient balance
  const { data: recipientLp } = await admin
    .from('learner_profiles')
    .select('coin_balance')
    .eq('user_id', recipientUserId)
    .single()

  const currentBalance = recipientLp?.coin_balance ?? 0
  const newBalance = currentBalance + amount

  // Apply gift
  await admin.from('coin_ledger').insert({
    user_id: recipientUserId,
    amount,
    event_type: 'manager_gift',
    balance_after: newBalance,
    metadata: {
      sender_id: user.id,
      message: message ?? null,
      org_id: senderProfile.org_id,
    },
  })

  await admin.from('learner_profiles').update({ coin_balance: newBalance }).eq('user_id', recipientUserId)

  // Write a learning event for the gamification engine
  await admin.from('learning_events').insert({
    user_id: recipientUserId,
    event_type: 'manager_gift_received',
    payload: { amount, sender_id: user.id, message: message ?? null },
  })

  return NextResponse.json({
    success: true,
    data: {
      recipientName: recipientProfile.full_name,
      amount,
      newBalance,
    },
  })
}
