import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { validateInviteCode } from '@shared-access/inviteCodes'
import { VERIFIED_INVITE_COOKIE, VERIFIED_INVITE_MAX_AGE_SECONDS } from '@shared-access/constants'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  code: z.string().min(4),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invite code is required.' }, { status: 400 })
    }

    const supabase = createServiceRoleSupabaseClient()
    const validation = await validateInviteCode(supabase, parsed.data.code)
    if (!validation.valid) {
      return NextResponse.json(validation, { status: 400 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(VERIFIED_INVITE_COOKIE, parsed.data.code.trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: VERIFIED_INVITE_MAX_AGE_SECONDS,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to prepare OAuth signup.' }, { status: 500 })
  }
}
