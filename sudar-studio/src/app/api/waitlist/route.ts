import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  useCase: z.string().optional(),
  role: z.string().optional(),
  teamSize: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const { email, name, useCase, role, teamSize } = parsed.data
    const supabase = createServiceRoleSupabaseClient()
    const { error } = await supabase.from('waitlist_entries').upsert(
      {
        email: email.trim().toLowerCase(),
        name: name?.trim() || null,
        use_case: useCase?.trim() || null,
        role: role?.trim() || null,
        team_size: teamSize?.trim() || null,
        status: 'pending',
      },
      { onConflict: 'email' }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'You are on the waitlist. We will send an invite soon.',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to join waitlist.' }, { status: 500 })
  }
}
