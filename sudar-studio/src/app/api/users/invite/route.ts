import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/users/invite — Invite a user by email (Admin/Manager only).
 * Inserts org_invites; when they accept the invite they are added to the org via auth callback.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as { email: string; full_name?: string; org_role?: string }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const role = ['ADMIN', 'MANAGER', 'CREATOR', 'LEARNER'].includes(body.org_role ?? '') ? body.org_role : 'LEARNER'

  const { error: inviteConflict } = await admin.from('org_invites').insert({
    org_id: orgId,
    email,
    role,
  }).select().single()

  if (inviteConflict) {
    return NextResponse.json({ error: 'Invite already sent to this email for this org' }, { status: 409 })
  }

  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: body.full_name ?? null },
    redirectTo: `${redirectTo}/auth/callback`,
  })

  if (inviteError) {
    await admin.from('org_invites').delete().eq('org_id', orgId).eq('email', email)
    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  }

  return NextResponse.json({ email, role, message: 'Invite sent' }, { status: 201 })
}
