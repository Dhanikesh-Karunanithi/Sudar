import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const BULK_MAX = 100

function randomPassword(length = 14): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%'
  let s = ''
  const bytes = randomBytes(length)
  for (let i = 0; i < length; i++) s += chars[bytes[i]! % chars.length]
  return s
}

/**
 * POST /api/users/bulk — Create multiple users (Admin/Manager only).
 * Body: { users: [{ email, full_name?, org_role? }] }. Max BULK_MAX. Each gets a random password and require_password_change.
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

  const body = await request.json() as { users: Array<{ email: string; full_name?: string; org_role?: string }> }
  const input = Array.isArray(body.users) ? body.users : []
  if (input.length === 0) return NextResponse.json({ error: 'users array required' }, { status: 400 })
  if (input.length > BULK_MAX) return NextResponse.json({ error: `Max ${BULK_MAX} users per request` }, { status: 400 })

  const admin = createAdminClient()
  const results: { email: string; ok: boolean; id?: string; error?: string; temp_password?: string }[] = []

  for (const row of input) {
    const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : ''
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      results.push({ email: row.email || '', ok: false, error: 'Invalid email' })
      continue
    }

    const password = randomPassword(14)
    const roleRaw = ['ADMIN', 'MANAGER', 'CREATOR', 'LEARNER'].includes(row.org_role ?? '') ? row.org_role : 'LEARNER'
    const role = roleRaw as 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER'

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: row.full_name ?? null },
    })

    if (authError) {
      results.push({ email, ok: false, error: authError.message })
      continue
    }

    const userId = authUser.user.id
    await admin.from('profiles').upsert({
      id: userId,
      full_name: row.full_name ?? null,
      org_id: orgId,
      require_password_change: true,
    }, { onConflict: 'id' })

    await admin.from('org_members').insert({
      org_id: orgId,
      user_id: userId,
      role,
    })

    const { data: _lp } = await admin.from('learner_profiles').select('id').eq('user_id', userId).single()
    if (!_lp) await admin.from('learner_profiles').insert({ user_id: userId })

    results.push({ email, ok: true, id: userId, temp_password: password })
  }

  return NextResponse.json({ results })
}

const ROLES = ['ADMIN', 'MANAGER', 'CREATOR', 'LEARNER'] as const

/**
 * PATCH /api/users/bulk — Update multiple users (role and/or banned). Admin/Manager only.
 * Body: { user_ids: string[], org_role?: string, banned?: boolean }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as { user_ids?: string[]; org_role?: string; banned?: boolean }
  const userIds = Array.isArray(body.user_ids) ? body.user_ids : []
  if (userIds.length === 0) return NextResponse.json({ error: 'user_ids array required' }, { status: 400 })
  if (userIds.length > BULK_MAX) return NextResponse.json({ error: `Max ${BULK_MAX} users per request` }, { status: 400 })

  const orgRole: 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER' | undefined =
    body.org_role != null && ROLES.includes(body.org_role as (typeof ROLES)[number])
      ? (body.org_role as 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER')
      : undefined
  const banned = typeof body.banned === 'boolean' ? body.banned : undefined
  if (orgRole === undefined && banned === undefined) {
    return NextResponse.json({ error: 'At least one of org_role or banned is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  let updated = 0
  const errors: { user_id: string; error: string }[] = []

  for (const targetId of userIds) {
    const { data: membership } = await admin
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', targetId)
      .single()

    if (!membership) {
      errors.push({ user_id: targetId, error: 'User not in this organization' })
      continue
    }

    try {
      if (orgRole !== undefined) {
        await admin.from('org_members').update({ role: orgRole }).eq('org_id', orgId).eq('user_id', targetId)
      }
      if (banned !== undefined) {
        await admin.auth.admin.updateUserById(targetId, {
          ban_duration: banned ? '876000h' : 'none',
        })
      }
      updated++
    } catch (e) {
      errors.push({ user_id: targetId, error: e instanceof Error ? e.message : 'Update failed' })
    }
  }

  return NextResponse.json({ updated, errors: errors.length ? errors : undefined })
}

/**
 * DELETE /api/users/bulk — Remove users from the organization (soft: delete org_members only). Admin/Manager only.
 * Body: { user_ids: string[] }
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as { user_ids?: string[] }
  const userIds = Array.isArray(body.user_ids) ? body.user_ids : []
  if (userIds.length === 0) return NextResponse.json({ error: 'user_ids array required' }, { status: 400 })
  if (userIds.length > BULK_MAX) return NextResponse.json({ error: `Max ${BULK_MAX} users per request` }, { status: 400 })

  const admin = createAdminClient()
  let removed = 0
  const errors: { user_id: string; error: string }[] = []

  for (const targetId of userIds) {
    if (targetId === user.id) {
      errors.push({ user_id: targetId, error: 'Cannot remove yourself' })
      continue
    }
    const { error } = await admin
      .from('org_members')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', targetId)

    if (error) {
      errors.push({ user_id: targetId, error: error.message })
    } else {
      removed++
    }
  }

  return NextResponse.json({ removed, errors: errors.length ? errors : undefined })
}
