/**
 * ALP — Get a short-lived embed token for iframe /alp/embed.
 * Auth: x-alp-api-key or Authorization: Bearer (env or org key).
 * Body: { user_id: string, course_id?: string, module_id?: string }.
 * Returns { token, embed_url, expires_in }.
 */
import { validateAlpKey, getAlpKeyFromRequest } from '@/lib/alp-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const EMBED_EXPIRY_SEC = 3600 // 1 hour
const SIGNING_SECRET = process.env.ALP_EMBED_SECRET || process.env.ALP_API_KEY || ''

function sign(payload: string): string {
  return createHmac('sha256', SIGNING_SECRET).update(payload, 'utf8').digest('base64url')
}

function createEmbedToken(userId: string, courseId?: string, moduleId?: string): string {
  const exp = Math.floor(Date.now() / 1000) + EMBED_EXPIRY_SEC
  const payload = JSON.stringify({
    sub: userId,
    course_id: courseId ?? null,
    module_id: moduleId ?? null,
    exp,
    iat: Math.floor(Date.now() / 1000),
  })
  const b64 = Buffer.from(payload, 'utf8').toString('base64url')
  const sig = sign(b64)
  return `${b64}.${sig}`
}

export async function POST(request: NextRequest) {
  const key = getAlpKeyFromRequest(request)
  const auth = await validateAlpKey(key)
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!SIGNING_SECRET) {
    return NextResponse.json({ error: 'Embed signing not configured (ALP_EMBED_SECRET or ALP_API_KEY)' }, { status: 503 })
  }

  let body: { user_id: string; course_id?: string; module_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { user_id, course_id, module_id } = body
  if (!user_id?.trim()) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const token = createEmbedToken(user_id, course_id, module_id)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl?.origin || ''
  const embedUrl = `${baseUrl.replace(/\/$/, '')}/alp/embed?token=${encodeURIComponent(token)}`

  return NextResponse.json({
    token,
    embed_url: embedUrl,
    expires_in: EMBED_EXPIRY_SEC,
  })
}
