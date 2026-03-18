/**
 * ALP — Tutor query for external LMS (SudarChat).
 * Auth: x-alp-api-key or Authorization: Bearer (env ALP_API_KEY or org key from integration_api_keys).
 * Body: { user_id, message, context_text, course_id?, module_id? }.
 * When using an org-scoped key, user_id must be a member of that org.
 * Forwards to Intelligence /api/tutor/query; logs to ai_interactions; returns response.
 * See docs/ALP_API.md.
 */
import { createAdminClient } from '@/lib/supabase/server'
import { validateAlpKey, getAlpKeyFromRequest, validateEmbedToken, isUserInOrg } from '@/lib/alp-auth'
import { NextRequest, NextResponse } from 'next/server'

const INTELLIGENCE_URL = process.env.BYTEOS_INTELLIGENCE_URL?.replace(/\/$/, '')

export async function POST(request: NextRequest) {
  const authHeader = getAlpKeyFromRequest(request)
  let user_id: string | null = null
  let course_id: string | undefined
  let module_id: string | undefined
  let orgId: string | undefined

  if (authHeader?.includes('.')) {
    const payload = validateEmbedToken(authHeader)
    if (payload) {
      user_id = payload.sub
      course_id = payload.course_id ?? undefined
      module_id = payload.module_id ?? undefined
    }
  }
  if (!user_id) {
    const auth = await validateAlpKey(authHeader)
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.valid && auth.orgId) orgId = auth.orgId
  }

  let body: { user_id?: string; message: string; context_text?: string; course_id?: string; module_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!user_id) user_id = body.user_id ?? null
  if (!course_id) course_id = body.course_id
  if (!module_id) module_id = body.module_id
  const message = body.message ?? ''
  const context_text = body.context_text ?? ''
  if (!user_id || !message?.trim()) {
    return NextResponse.json({ error: 'user_id and message required' }, { status: 400 })
  }

  const admin = createAdminClient()
  if (orgId) {
    const inOrg = await isUserInOrg(admin, user_id, orgId)
    if (!inOrg) return NextResponse.json({ error: 'Forbidden: user not in key organisation' }, { status: 403 })
  }

  let responseText = "I'm still being set up — check back soon!"
  let sourcesUsed: string[] = []

  const intelligenceHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
  const serviceSecret = process.env.INTELLIGENCE_SERVICE_SECRET
  if (serviceSecret) intelligenceHeaders['X-Intelligence-Service-Secret'] = serviceSecret

  if (INTELLIGENCE_URL) {
    try {
      const res = await fetch(`${INTELLIGENCE_URL}/api/tutor/query`, {
        method: 'POST',
        headers: intelligenceHeaders,
        body: JSON.stringify({
          user_id,
          module_id: module_id ?? '',
          course_id: course_id ?? '',
          message: message.trim(),
          context_text: context_text.slice(0, 12000),
          session_history: [],
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as { response?: string; sources_used?: string[] }
        responseText = data.response ?? responseText
        sourcesUsed = data.sources_used ?? []
      }
    } catch {
      // keep default response
    }
  }

  try {
    await admin.from('ai_interactions').insert({
      user_id,
      course_id: course_id ?? null,
      module_id: module_id ?? null,
      interaction_type: 'question',
      user_message: message.trim(),
      ai_response: responseText,
      context_used: { alp: true, sources_used: sourcesUsed },
    })
  } catch {
    // non-fatal
  }

  return NextResponse.json({
    response: responseText,
    confidence: 1.0,
    sources_used: sourcesUsed,
  })
}
