/**
 * POST /api/org/provisioning/lms-identity-links — Upsert LMS external id → Sudar profile UUID.
 * DELETE — Revoke active link (soft revoke via revoked_at).
 * Auth: x-alp-api-key or Authorization: Bearer (org-scoped integration key).
 */
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

const MAX_LINKS = 200

function hashKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

function getKeyFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  return request.headers.get('x-alp-api-key')?.trim() ?? null
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}

export async function POST(request: NextRequest) {
  const key = getKeyFromRequest(request)
  if (!key) {
    return NextResponse.json(
      { error: 'Missing API key. Use x-alp-api-key or Authorization: Bearer <key>.' },
      { status: 401 },
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
    links?: Array<{
      external_user_id: string
      sudar_user_id: string
      provider?: string
      external_email?: string | null
    }>
  } | null

  const input = Array.isArray(body?.links) ? body.links : []
  if (input.length === 0) {
    return NextResponse.json({ error: 'Body must include links array.' }, { status: 400 })
  }
  if (input.length > MAX_LINKS) {
    return NextResponse.json({ error: `Maximum ${MAX_LINKS} links per request.` }, { status: 400 })
  }

  const results: { external_user_id: string; ok: boolean; error?: string }[] = []

  for (const row of input) {
    const ext = typeof row.external_user_id === 'string' ? row.external_user_id.trim() : ''
    const sudarId = typeof row.sudar_user_id === 'string' ? row.sudar_user_id.trim() : ''
    const provider = typeof row.provider === 'string' && row.provider.trim() ? row.provider.trim() : 'moodle'

    if (!ext || ext.length > 512) {
      results.push({ external_user_id: ext, ok: false, error: 'Invalid external_user_id' })
      continue
    }
    if (!isUuid(sudarId)) {
      results.push({ external_user_id: ext, ok: false, error: 'Invalid sudar_user_id (expected UUID)' })
      continue
    }

    const { data: member } = await admin
      .from('org_members')
      .select('user_id')
      .eq('org_id', orgId)
      .eq('user_id', sudarId)
      .maybeSingle()

    if (!member) {
      results.push({ external_user_id: ext, ok: false, error: 'Sudar user is not a member of this organisation' })
      continue
    }

    const { data: profile } = await admin.from('profiles').select('id, org_id').eq('id', sudarId).maybeSingle()
    if (!profile || profile.org_id !== orgId) {
      results.push({ external_user_id: ext, ok: false, error: 'Sudar user profile org mismatch' })
      continue
    }

    const externalEmail =
      typeof row.external_email === 'string' && row.external_email.trim() ? row.external_email.trim() : null

    const { data: existing } = await admin
      .from('lms_identity_links')
      .select('id')
      .eq('org_id', orgId)
      .eq('provider', provider)
      .eq('external_user_id', ext)
      .is('revoked_at', null)
      .maybeSingle()

    if (existing?.id) {
      const { error: upErr } = await admin
        .from('lms_identity_links')
        .update({
          sudar_user_id: sudarId,
          external_email: externalEmail,
        })
        .eq('id', existing.id)
      if (upErr) {
        results.push({ external_user_id: ext, ok: false, error: upErr.message })
        continue
      }
    } else {
      const { error: insErr } = await admin.from('lms_identity_links').insert({
        org_id: orgId,
        provider,
        external_user_id: ext,
        sudar_user_id: sudarId,
        external_email: externalEmail,
      })
      if (insErr) {
        results.push({ external_user_id: ext, ok: false, error: insErr.message })
        continue
      }
    }

    results.push({ external_user_id: ext, ok: true })
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

export async function DELETE(request: NextRequest) {
  const key = getKeyFromRequest(request)
  if (!key) {
    return NextResponse.json(
      { error: 'Missing API key. Use x-alp-api-key or Authorization: Bearer <key>.' },
      { status: 401 },
    )
  }

  const admin = createAdminClient()
  const keyHash = hashKey(key)
  const { data: keyRow, error: keyError } = await admin
    .from('integration_api_keys')
    .select('org_id')
    .eq('key_hash', keyHash)
    .limit(1)
    .maybeSingle()

  if (keyError || !keyRow?.org_id) {
    return NextResponse.json({ error: 'Invalid or unknown API key.' }, { status: 403 })
  }

  const orgId = keyRow.org_id
  const body = (await request.json().catch(() => null)) as {
    external_user_id?: string
    provider?: string
  } | null

  const ext = typeof body?.external_user_id === 'string' ? body.external_user_id.trim() : ''
  if (!ext) {
    return NextResponse.json({ error: 'external_user_id required' }, { status: 400 })
  }
  const provider = typeof body?.provider === 'string' && body.provider.trim() ? body.provider.trim() : 'moodle'

  const { data: rows, error } = await admin
    .from('lms_identity_links')
    .select('id')
    .eq('org_id', orgId)
    .eq('provider', provider)
    .eq('external_user_id', ext)
    .is('revoked_at', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = new Date().toISOString()
  for (const r of rows ?? []) {
    await admin.from('lms_identity_links').update({ revoked_at: now }).eq('id', r.id)
  }

  return NextResponse.json({ ok: true, revoked: (rows ?? []).length })
}
