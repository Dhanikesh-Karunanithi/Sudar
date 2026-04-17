import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/complete-password-change — Clear require_password_change after user sets new password.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  await admin
    .from('profiles')
    .update({ require_password_change: false })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
