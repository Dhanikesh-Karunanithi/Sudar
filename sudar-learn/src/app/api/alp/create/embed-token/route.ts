/**
 * ALP Create — Embed token for /alp/create teacher UI.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAlpKeyFromRequest, getEmbedSigningSecretConfigured, rejectAlpUserOutsideOrg, validateAlpKey } from '@/lib/alp-auth'
import { createAlpCreateEmbedToken, ALP_CREATE_EMBED_EXPIRY_SEC } from '@/lib/alp/createEmbedToken'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  creator_user_id: z.string().uuid(),
  tool: z.enum(['quiz', 'interact', 'cards', 'draft', 'media', 'outline']).optional(),
})

export async function POST(request: NextRequest) {
  const key = getAlpKeyFromRequest(request)
  const auth = await validateAlpKey(key)
  if (!auth.valid || !auth.orgId) {
    return NextResponse.json(
      { error: 'Unauthorized — org-scoped ALP API key required' },
      { status: auth.valid ? 403 : 401 },
    )
  }

  if (!getEmbedSigningSecretConfigured()) {
    return NextResponse.json({ error: 'Embed signing not configured' }, { status: 503 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const orgError = await rejectAlpUserOutsideOrg(admin, auth, body.creator_user_id)
  if (orgError) return orgError

  const token = createAlpCreateEmbedToken(body.creator_user_id, auth.orgId, body.tool ?? null)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const embedUrl = `${baseUrl.replace(/\/$/, '')}/alp/create?token=${encodeURIComponent(token)}${body.tool ? `&tool=${body.tool}` : ''}`

  return NextResponse.json({
    token,
    embed_url: embedUrl,
    expires_in: ALP_CREATE_EMBED_EXPIRY_SEC,
  })
}
