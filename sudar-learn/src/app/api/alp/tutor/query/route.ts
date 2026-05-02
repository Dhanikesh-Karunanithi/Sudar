/**
 * ALP — Tutor query for external LMS (SudarChat).
 * Auth: x-alp-api-key or Authorization: Bearer (env ALP_API_KEY or org key from integration_api_keys).
 * Body: { user_id, message, context_text, course_id?, module_id? }.
 * When using an org-scoped key, user_id must be a member of that org.
 * Forwards to Intelligence /api/tutor/query; logs to ai_interactions; returns response.
 * See docs/ALP_API.md.
 */
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { validateAlpKey, getAlpKeyFromRequest, validateEmbedToken, isUserInOrg } from '@/lib/alp-auth'
import { NextRequest, NextResponse } from 'next/server'
import { scanSensitiveUserText } from '@/lib/security/sensitiveInputGuard'
import { z } from 'zod'
import { validateTutorQueryResponsePayload } from '@/lib/tutor/responseContract'

const INTELLIGENCE_URL = (process.env.SUDAR_INTELLIGENCE_URL ?? process.env.BYTEOS_INTELLIGENCE_URL)?.replace(/\/$/, '')
const alpBodySchema = z.object({
  user_id: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(2000),
  context_text: z.string().max(15000).optional(),
  course_id: z.string().uuid().optional(),
  module_id: z.string().uuid().optional(),
})

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

  let body: z.infer<typeof alpBodySchema>
  try {
    const parsed = alpBodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    body = parsed.data
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

  const sens = scanSensitiveUserText(message.trim() + (context_text ? ` ${context_text}` : ''))
  if (sens.blocked) {
    return NextResponse.json(
      {
        response:
          "I'm here to help with learning. I can't process payment card numbers, government ID numbers, bank details, or private keys. Remove sensitive details and ask again.",
        confidence: 0,
        sources_used: [],
        guardrail_code: 'sensitive_data_detected',
      },
      { status: 200 },
    )
  }

  const admin = createServiceRoleSupabaseClient()
  if (orgId) {
    const inOrg = await isUserInOrg(admin, user_id, orgId)
    if (!inOrg) return NextResponse.json({ error: 'Forbidden: user not in key organisation' }, { status: 403 })
  }

  let responseText = 'I could not complete that answer. Please try again.'
  let sourcesUsed: string[] = []
  let responseActions: unknown[] | undefined
  let responseBlocks: unknown[] | undefined

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
        const payload = await res.json()
        const data = validateTutorQueryResponsePayload(payload)
        responseText = data.response ?? responseText
        responseActions = data.actions
        responseBlocks = data.blocks
        sourcesUsed = Array.isArray((payload as { sources_used?: unknown[] }).sources_used)
          ? (payload as { sources_used: string[] }).sources_used
          : []
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
  try {
    await admin.from('learning_events').insert({
      user_id,
      course_id: course_id ?? null,
      module_id: module_id ?? null,
      event_type: 'ai_tutor_query',
      modality: 'text',
      payload: { source: 'alp_embed' },
    })
  } catch {
    // non-fatal
  }

  return NextResponse.json({
    response: responseText,
    ...(Array.isArray(responseActions) && responseActions.length > 0 ? { actions: responseActions } : {}),
    ...(Array.isArray(responseBlocks) && responseBlocks.length > 0 ? { blocks: responseBlocks } : {}),
    confidence: responseText.includes('could not complete') ? 0 : 1,
    sources_used: sourcesUsed,
  })
}
