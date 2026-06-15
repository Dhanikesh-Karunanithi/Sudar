import { NextRequest, NextResponse } from 'next/server'
import { createAlpSimEmbedToken, type SimEmbedMode } from '@/lib/alp/simEmbedToken'
import {
  getAlpKeyFromRequest,
  getEmbedSigningSecretConfigured,
  rejectAlpUserOutsideOrg,
  validateAlpKey,
} from '@/lib/alp-auth'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  user_id: z.string().uuid(),
  mode: z.enum(['author', 'play']).default('play'),
  scenario_id: z.string().uuid().optional().nullable(),
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

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const orgError = await rejectAlpUserOutsideOrg(admin, auth, parsed.data.user_id)
  if (orgError) return orgError

  const mode = parsed.data.mode as SimEmbedMode
  const token = createAlpSimEmbedToken(parsed.data.user_id, auth.orgId, mode, parsed.data.scenario_id)
  const base = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '')
  const path = mode === 'author' ? '/alp/sim' : '/alp/sim/play'
  const embedUrl = `${base}${path}?token=${encodeURIComponent(token)}`

  return NextResponse.json({ token, embed_url: embedUrl, expires_in: 3600 })
}
