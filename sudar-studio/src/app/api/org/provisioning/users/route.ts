/**
 * POST /api/org/provisioning/users — Batch create users and org membership (key-based).
 * Auth: x-alp-api-key or Authorization: Bearer <key> (org-scoped Integration API key from Studio → Integrations).
 * Body: { users: [{ email, full_name?, role?, external_id? }] }. role = org_role (ADMIN | MANAGER | CREATOR | LEARNER).
 * Creates auth user + profile + org_member for each. If email already exists in Auth, that row returns ok: false with error.
 */
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

const PROVISIONING_MAX = 200

function hashKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

function getKeyFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  return request.headers.get('x-alp-api-key')?.trim() ?? null
}

function randomPassword(length = 14): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%'
  let s = ''
  const bytes = randomBytes(length)
  for (let i = 0; i < length; i++) s += chars[bytes[i]! % chars.length]
  return s
}

const ORG_ROLES = ['ADMIN', 'MANAGER', 'CREATOR', 'LEARNER'] as const

export async function POST(request: NextRequest) {
  const key = getKeyFromRequest(request)
  if (!key) {
    return NextResponse.json(
      { error: 'Missing API key. Use x-alp-api-key or Authorization: Bearer <key>.' },
      { status: 401 }
    )
  }

  const admin = createAdminClient()
  const keyHash = hashKey(key)

  const { data: keyRow, error: keyError } = await admin
    .from('integration_api_keys')
    .select('id, org_id')
    .eq('key_hash', keyHash)
    .limit(1)
    .maybeSingle()

  if (keyError || !keyRow?.org_id) {
    return NextResponse.json({ error: 'Invalid or unknown API key.' }, { status: 403 })
  }

  const orgId = keyRow.org_id

  const body = (await request.json().catch(() => null)) as {
    users?: Array<{ email: string; full_name?: string; role?: string; external_id?: string }>
  } | null
  const input = Array.isArray(body?.users) ? body.users : []
  if (input.length === 0) {
    return NextResponse.json({ error: 'Body must include users array.' }, { status: 400 })
  }
  if (input.length > PROVISIONING_MAX) {
    return NextResponse.json(
      { error: `Maximum ${PROVISIONING_MAX} users per request.` },
      { status: 400 }
    )
  }

  const results: { email: string; ok: boolean; id?: string; error?: string }[] = []

  for (const row of input) {
    const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : ''
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      results.push({ email: row.email ?? '', ok: false, error: 'Invalid email' })
      continue
    }

    const orgRole = ORG_ROLES.includes((row.role ?? 'LEARNER') as (typeof ORG_ROLES)[number])
      ? (row.role as (typeof ORG_ROLES)[number])
      : 'LEARNER'
    const fullName = typeof row.full_name === 'string' ? row.full_name.trim() || null : null

    const password = randomPassword(14)
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError) {
      results.push({ email, ok: false, error: authError.message })
      continue
    }

    const userId = authUser.user.id
    await admin.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName ?? undefined,
        org_id: orgId,
        require_password_change: true,
      },
      { onConflict: 'id' }
    )
    await admin.from('org_members').insert({ org_id: orgId, user_id: userId, role: orgRole })
    const { data: _lp } = await admin.from('learner_profiles').select('id').eq('user_id', userId).single()
    if (!_lp) await admin.from('learner_profiles').insert({ user_id: userId })

    results.push({ email, ok: true, id: userId })
  }

  return NextResponse.json({
    results,
    summary: {
      total: results.length,
      ok: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    },
  })
}
