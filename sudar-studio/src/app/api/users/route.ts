import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const MAX_USERS = 200

function randomPassword(length = 14): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%'
  let s = ''
  const bytes = randomBytes(length)
  for (let i = 0; i < length; i++) s += chars[bytes[i]! % chars.length]
  return s
}

/**
 * GET /api/users — List users in the current org (Admin/Manager only).
 * Returns id, full_name, email, org_role, status (active/disabled).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: members } = await admin
    .from('org_members')
    .select('user_id, role')
    .eq('org_id', orgId)
    .limit(MAX_USERS)

  if (!members?.length) {
    return NextResponse.json([])
  }

  const userIds = members.map((m) => m.user_id)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? null]))

  const authUsers = await Promise.all(
    userIds.map((id) => admin.auth.admin.getUserById(id))
  )

  const memberRoleMap = new Map(members.map((m) => [m.user_id, m.role]))

  const list = userIds.map((id, i) => {
    const auth = authUsers[i]
    const u = auth.data?.user
    return {
      id,
      full_name: profileMap.get(id) ?? u?.user_metadata?.full_name ?? null,
      email: u?.email ?? null,
      org_role: memberRoleMap.get(id) ?? 'LEARNER',
      status: u?.banned_until ? 'disabled' : 'active',
    }
  })

  return NextResponse.json(list)
}

/**
 * POST /api/users — Create a new user in the org (Admin/Manager only).
 * Body: { email, full_name?, password?, org_role? }. If no password, a random one is set and require_password_change is true.
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

  const body = await request.json() as { email: string; full_name?: string; password?: string; org_role?: string }
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const password = body.password && body.password.length >= 8 ? body.password : randomPassword(14)
  const requirePasswordChange = !body.password || body.password.length < 8

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: body.full_name ?? null },
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const userId = authUser.user.id

  await admin.from('profiles').upsert({
    id: userId,
    full_name: body.full_name ?? null,
    org_id: orgId,
    require_password_change: requirePasswordChange,
  }, { onConflict: 'id' })

  const orgRole: 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER' =
    ['ADMIN', 'MANAGER', 'CREATOR', 'LEARNER'].includes(body.org_role ?? '') ? (body.org_role as 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER') : 'LEARNER'
  await admin.from('org_members').insert({
    org_id: orgId,
    user_id: userId,
    role: orgRole,
  })

  const { data: _lp } = await admin.from('learner_profiles').select('id').eq('user_id', userId).single()
  if (!_lp) {
    await admin.from('learner_profiles').insert({ user_id: userId })
  }

  return NextResponse.json({
    id: userId,
    email: authUser.user.email,
    full_name: body.full_name ?? null,
    require_password_change: requirePasswordChange,
    ...(requirePasswordChange && { temp_password: password }),
  }, { status: 201 })
}
