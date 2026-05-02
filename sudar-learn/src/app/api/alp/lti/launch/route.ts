/**
 * LTI 1.3 resource launch (POST). Verifies id_token against registered platform JWKS,
 * resolves Sudar user via custom claim `sudar_user_id` and/or lms_identity_links (provider `lti`),
 * then redirects browser to /alp/embed with a fresh signed embed token.
 */
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { createAlpEmbedToken } from '@/lib/alp/embedToken'
import { getEmbedSigningSecretConfigured, isUserInOrg } from '@/lib/alp-auth'
import { NextRequest, NextResponse } from 'next/server'
import * as jose from 'jose'
import { z } from 'zod'

const DEPLOYMENT_CLAIM = 'https://purl.imsglobal.org/spec/lti/claim/deployment_id'
const CUSTOM_CLAIM = 'https://purl.imsglobal.org/spec/lti/claim/custom'

function decodeJwtPayloadUnsafe(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    return JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

function audiencesFromPayload(payload: Record<string, unknown>): string[] {
  const aud = payload.aud
  if (Array.isArray(aud)) return aud.map((a) => String(a))
  if (aud != null && aud !== '') return [String(aud)]
  return []
}

const uuid = z.string().uuid()

async function parseIdToken(request: NextRequest): Promise<string | null> {
  const ct = request.headers.get('content-type') ?? ''
  if (ct.includes('application/x-www-form-urlencoded')) {
    const text = await request.text()
    const params = new URLSearchParams(text)
    return params.get('id_token')
  }
  try {
    const j = (await request.json()) as { id_token?: string }
    return typeof j.id_token === 'string' ? j.id_token : null
  } catch {
    return null
  }
}

function htmlRedirect(url: string, message: string): NextResponse {
  const safe = url.replace(/"/g, '%22')
  const body = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sudar</title>
<meta http-equiv="refresh" content="0;url=${safe}">
</head><body><p>${message}</p><p><a href="${safe}">Continue</a></p></body></html>`
  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function htmlError(message: string, status = 400): NextResponse {
  const body = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sudar LTI</title></head>
<body><p>${message}</p></body></html>`
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function POST(request: NextRequest) {
  if (!getEmbedSigningSecretConfigured()) {
    return htmlError('Embed signing not configured on this Learn deployment.', 503)
  }

  const idToken = await parseIdToken(request)
  if (!idToken) {
    return htmlError('Missing id_token', 400)
  }

  const unsafe = decodeJwtPayloadUnsafe(idToken)
  if (!unsafe) {
    return htmlError('Invalid id_token', 400)
  }

  const iss = typeof unsafe.iss === 'string' ? unsafe.iss : ''
  const deploymentId = typeof unsafe[DEPLOYMENT_CLAIM] === 'string' ? unsafe[DEPLOYMENT_CLAIM] : ''
  const audiences = audiencesFromPayload(unsafe)
  const sub = typeof unsafe.sub === 'string' ? unsafe.sub : ''

  if (!iss || !deploymentId || audiences.length === 0 || !sub) {
    return htmlError('id_token missing iss, aud, deployment_id, or sub', 400)
  }

  const admin = createServiceRoleSupabaseClient()

  const { data: deployments, error: depErr } = await admin
    .from('lti_platform_deployments')
    .select('id, org_id, issuer, client_id, deployment_id, platform_jwks_uri')
    .eq('issuer', iss)
    .eq('deployment_id', deploymentId)
    .in('client_id', audiences)

  if (depErr || !deployments?.length) {
    return htmlError('Unknown LTI deployment — register via Studio provisioning API.', 403)
  }

  const dep = deployments[0]!
  const jwks = jose.createRemoteJWKSet(new URL(dep.platform_jwks_uri))

  let payload: jose.JWTPayload
  try {
    const verified = await jose.jwtVerify(idToken, jwks, {
      issuer: dep.issuer,
      audience: dep.client_id,
    })
    payload = verified.payload
  } catch {
    return htmlError('id_token verification failed', 401)
  }

  const customRaw = payload[CUSTOM_CLAIM]
  const custom =
    customRaw && typeof customRaw === 'object' && !Array.isArray(customRaw)
      ? (customRaw as Record<string, unknown>)
      : {}
  const sudarFromCustom =
    typeof custom.sudar_user_id === 'string' ? custom.sudar_user_id.trim() : ''

  if (sudarFromCustom) {
    const parsed = uuid.safeParse(sudarFromCustom)
    if (parsed.success) {
      const inOrg = await isUserInOrg(admin, parsed.data, dep.org_id)
      if (inOrg) {
        const { data: existing } = await admin
          .from('lms_identity_links')
          .select('id')
          .eq('org_id', dep.org_id)
          .eq('provider', 'lti')
          .eq('external_user_id', sub)
          .is('revoked_at', null)
          .maybeSingle()
        if (existing?.id) {
          await admin
            .from('lms_identity_links')
            .update({ sudar_user_id: parsed.data })
            .eq('id', existing.id)
        } else {
          await admin.from('lms_identity_links').insert({
            org_id: dep.org_id,
            provider: 'lti',
            external_user_id: sub,
            sudar_user_id: parsed.data,
          })
        }
      }
    }
  }

  const { data: link } = await admin
    .from('lms_identity_links')
    .select('sudar_user_id')
    .eq('org_id', dep.org_id)
    .eq('provider', 'lti')
    .eq('external_user_id', sub)
    .is('revoked_at', null)
    .maybeSingle()

  const sudarUserId = link?.sudar_user_id ?? null
  if (!sudarUserId) {
    return htmlError(
      'No Sudar user linked for this LTI subject. Provision lms_identity_links (provider lti) or pass custom claim sudar_user_id.',
      403,
    )
  }

  const inOrg = await isUserInOrg(admin, sudarUserId, dep.org_id)
  if (!inOrg) {
    return htmlError('Linked Sudar user is not in this organisation.', 403)
  }

  const token = createAlpEmbedToken(sudarUserId, null, null)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const embedUrl = `${baseUrl.replace(/\/$/, '')}/alp/embed?token=${encodeURIComponent(token)}`

  return htmlRedirect(embedUrl, 'Opening Sudar…')
}
