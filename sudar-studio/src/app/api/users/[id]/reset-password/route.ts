import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

function generateOtp(length = 12): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  const bytes = randomBytes(length)
  for (let i = 0; i < length; i++) s += chars[bytes[i]! % chars.length]
  return s
}

/**
 * POST /api/users/[id]/reset-password — Set a one-time password and require change on first login. Admin/Manager only.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: targetId } = await params
  const admin = createAdminClient()

  const { data: membership } = await admin
    .from('org_members')
    .select('org_id')
    .eq('org_id', orgId)
    .eq('user_id', targetId)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'User not in this organization' }, { status: 404 })
  }

  const otp = generateOtp(12)

  const { error: authError } = await admin.auth.admin.updateUserById(targetId, {
    password: otp,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  await admin
    .from('profiles')
    .update({ require_password_change: true })
    .eq('id', targetId)

  return NextResponse.json({ otp })
}
