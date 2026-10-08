import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  password: z.string().min(8).max(128),
})

/**
 * POST /api/auth/complete-password-change — Set a new password and clear require_password_change.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('require_password_change')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.require_password_change) {
    return NextResponse.json({ error: 'Password change not required' }, { status: 400 })
  }

  const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
    password: parsed.data.password,
  })
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ require_password_change: false })
    .eq('id', user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
