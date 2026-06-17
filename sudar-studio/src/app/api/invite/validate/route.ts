import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { validateInviteCode } from '@shared-access/inviteCodes'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  code: z.string().min(4),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ valid: false, error: 'Invite code is required.' }, { status: 400 })
    }

    const supabase = createServiceRoleSupabaseClient()
    const result = await validateInviteCode(supabase, parsed.data.code)
    if (!result.valid) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ valid: false, error: 'Validation failed.' }, { status: 500 })
  }
}
