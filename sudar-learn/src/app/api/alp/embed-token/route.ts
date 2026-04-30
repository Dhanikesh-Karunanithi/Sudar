/**
 * ALP — Get a short-lived embed token for iframe /alp/embed.
 * Auth: x-alp-api-key or Authorization: Bearer (env or org key).
 * Body: { user_id: string, course_id?: string, module_id?: string }.
 * Returns { token, embed_url, expires_in }.
 */
import { createAdminClient } from '@/lib/supabase/server'
import { ALP_EMBED_EXPIRY_SEC, createAlpEmbedToken } from '@/lib/alp/embedToken'
import { validateAlpKey, getAlpKeyFromRequest, getEmbedSigningSecretConfigured, rejectAlpUserOutsideOrg } from '@/lib/alp-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const key = getAlpKeyFromRequest(request)
  const auth = await validateAlpKey(key)
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!getEmbedSigningSecretConfigured()) {
    return NextResponse.json({ error: 'Embed signing not configured (ALP_EMBED_SIGNING_SECRET or ALP_EMBED_SECRET)' }, { status: 503 })
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

  const admin = createAdminClient()
  const orgError = await rejectAlpUserOutsideOrg(admin, auth, user_id)
  if (orgError) return orgError

  const token = createAlpEmbedToken(user_id, course_id, module_id)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl?.origin || ''
  const embedUrl = `${baseUrl.replace(/\/$/, '')}/alp/embed?token=${encodeURIComponent(token)}`

  return NextResponse.json({
    token,
    embed_url: embedUrl,
    expires_in: ALP_EMBED_EXPIRY_SEC,
  })
}
