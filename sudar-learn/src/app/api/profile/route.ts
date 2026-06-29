import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
})

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

/**
 * PATCH /api/profile — Update the signed-in user's profile fields.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = patchSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid profile data' }, { status: 400 })
  }

  const fullName = parsed.data.full_name
  const admin = createServiceRoleSupabaseClient()

  const { error } = await admin
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { full_name: fullName },
  })

  return NextResponse.json({
    success: true,
    data: { full_name: fullName },
  })
}
