/**
 * POST /api/org/provisioning/lti-deployments — Register an LTI 1.3 platform deployment for this org.
 * Auth: org-scoped integration API key.
 * Body: { issuer, client_id, deployment_id, platform_jwks_uri }
 */
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

function hashKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

function getKeyFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  return request.headers.get('x-alp-api-key')?.trim() ?? null
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
    .select('org_id')
    .eq('key_hash', keyHash)
    .limit(1)
    .maybeSingle()

  if (keyError || !keyRow?.org_id) {
    return NextResponse.json({ error: 'Invalid or unknown API key.' }, { status: 403 })
  }

  const orgId = keyRow.org_id
  const body = (await request.json().catch(() => null)) as {
    issuer?: string
    client_id?: string
    deployment_id?: string
    platform_jwks_uri?: string
  } | null

  const issuer = typeof body?.issuer === 'string' ? body.issuer.trim() : ''
  const clientId = typeof body?.client_id === 'string' ? body.client_id.trim() : ''
  const deploymentId = typeof body?.deployment_id === 'string' ? body.deployment_id.trim() : ''
  const jwksUri = typeof body?.platform_jwks_uri === 'string' ? body.platform_jwks_uri.trim() : ''

  if (!issuer || !clientId || !deploymentId || !jwksUri) {
    return NextResponse.json(
      { error: 'issuer, client_id, deployment_id, and platform_jwks_uri are required' },
      { status: 400 },
    )
  }

  const { data: existing, error: selErr } = await admin
    .from('lti_platform_deployments')
    .select('id, org_id')
    .eq('issuer', issuer)
    .eq('client_id', clientId)
    .eq('deployment_id', deploymentId)
    .maybeSingle()

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 })
  }

  if (existing?.id) {
    if (existing.org_id !== orgId) {
      return NextResponse.json({ error: 'Deployment registered to another organisation' }, { status: 403 })
    }
    const { error } = await admin
      .from('lti_platform_deployments')
      .update({ platform_jwks_uri: jwksUri })
      .eq('id', existing.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true, id: existing.id })
  }

  const { data: inserted, error } = await admin
    .from('lti_platform_deployments')
    .insert({
      org_id: orgId,
      issuer,
      client_id: clientId,
      deployment_id: deploymentId,
      platform_jwks_uri: jwksUri,
    })
    .select('id')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, id: inserted?.id })
}
