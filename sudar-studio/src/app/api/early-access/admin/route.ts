import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { isEarlyAccessAdmin } from '@shared-access'
import type { AccessSupabaseClient } from '@shared-access/types'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'

const postSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create_invite_code'),
    code: z.string().min(4),
    type: z.enum(['early_access', 'tester']).optional(),
    grantsTier: z.enum(['default', 'early_access', 'tester', 'unlimited']).optional(),
    bonusCredits: z.number().int().min(0).optional(),
    maxUses: z.number().int().positive().nullable().optional(),
  }),
  z.object({
    action: z.literal('invite_waitlist'),
    waitlistId: z.string().uuid(),
    code: z.string().min(4).optional(),
  }),
  z.object({
    action: z.literal('update_user_tier'),
    userId: z.string().uuid(),
    tier: z.enum(['default', 'early_access', 'tester', 'unlimited']),
    signupCodeUsed: z.string().optional(),
  }),
])

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createServiceRoleSupabaseClient() as AccessSupabaseClient
  const admin = await isEarlyAccessAdmin(adminClient, user.id, user.email)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [waitlist, codes] = await Promise.all([
    adminClient.from('waitlist_entries').select('*').order('created_at', { ascending: false }).limit(100),
    adminClient.from('invite_codes').select('*').order('created_at', { ascending: false }),
  ])

  return NextResponse.json({
    waitlist: waitlist.data ?? [],
    inviteCodes: codes.data ?? [],
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createServiceRoleSupabaseClient() as AccessSupabaseClient
  const admin = await isEarlyAccessAdmin(adminClient, user.id, user.email)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }

    const body = parsed.data

    if (body.action === 'create_invite_code') {
      const { data, error } = await adminClient
        .from('invite_codes')
        .insert({
          code: body.code.trim().toUpperCase(),
          type: body.type ?? 'early_access',
          grants_tier: body.grantsTier ?? 'early_access',
          bonus_credits: body.bonusCredits ?? 0,
          max_uses: body.maxUses ?? null,
          is_active: true,
        })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true, code: data })
    }

    if (body.action === 'invite_waitlist') {
      const { data: entry } = await adminClient
        .from('waitlist_entries')
        .select('*')
        .eq('id', body.waitlistId)
        .single()

      if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const code = body.code ?? `INVITE-${Date.now().toString(36).toUpperCase()}`
      const { data: invite, error } = await adminClient
        .from('invite_codes')
        .insert({
          code: code.trim().toUpperCase(),
          type: 'early_access',
          grants_tier: 'early_access',
          bonus_credits: 0,
          max_uses: 1,
          is_active: true,
        })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })

      await adminClient
        .from('waitlist_entries')
        .update({ status: 'invited', invited_code_id: invite?.id })
        .eq('id', body.waitlistId)

      return NextResponse.json({ ok: true, code: invite?.code })
    }

    if (body.action === 'update_user_tier') {
      await adminClient
        .from('profiles')
        .update({
          access_tier: body.tier,
          ...(body.signupCodeUsed ? { signup_code_used: body.signupCodeUsed } : {}),
        })
        .eq('id', body.userId)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Request failed.' }, { status: 500 })
  }
}
