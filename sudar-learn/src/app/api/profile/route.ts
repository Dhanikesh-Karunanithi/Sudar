import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/profile — Current user's profile fields for settings and client UI.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    success: true,
    data: {
      email: user.email ?? '',
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
  })
}
