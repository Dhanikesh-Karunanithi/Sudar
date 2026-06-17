import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { redeemInviteCode } from '@shared-access/inviteCodes'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  code: z.string().min(4),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invite code is required.' }, { status: 400 })
    }

    const admin = createServiceRoleSupabaseClient()
    const result = await redeemInviteCode(admin, user.id, parsed.data.code)
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to redeem invite.' }, { status: 500 })
  }
}
