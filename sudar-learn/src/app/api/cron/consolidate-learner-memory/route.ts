import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, getDefaultMemoryModel, resolveChatConfigError } from '@/lib/ai/chat'
import { loadOrgAiChatContext } from '@/lib/org/orgAiChatContext'
import { fetchResolvedLearnerPreferences } from '@/lib/learner/learnerPreferences'
import { rejectInvalidCronRequest } from '@/lib/security/cronAuth'
import { parseOrgAiCompliance } from '@/types/personalization'
import {
  clampOrgMemoryDigestMinDays,
  clampTutorLlmMemoryExtractionPolicy,
  digestEligibleAfterConsolidation,
  effectiveMemoryDigestMinDays,
} from '@/lib/learner/tutorMemoryCadence'

const MAX_INTERACTIONS = 40

async function orgMemoryPolicyForUser(
  admin: ReturnType<typeof createServiceRoleSupabaseClient>,
  userId: string,
): Promise<{
  extractionPolicy: ReturnType<typeof clampTutorLlmMemoryExtractionPolicy>
  digestMinDaysOrg: number | null
}> {
  const { data: prof } = await admin.from('profiles').select('org_id').eq('id', userId).maybeSingle()
  if (!prof?.org_id) {
    return { extractionPolicy: 'learner_controlled', digestMinDaysOrg: null }
  }
  const { data: org } = await admin.from('organisations').select('settings').eq('id', prof.org_id).maybeSingle()
  const ac = parseOrgAiCompliance(org?.settings)
  return {
    extractionPolicy: clampTutorLlmMemoryExtractionPolicy(ac.tutor_llm_memory_extraction_policy),
    digestMinDaysOrg: clampOrgMemoryDigestMinDays(ac.memory_digest_min_interval_days_org),
  }
}

async function consolidateOneUser(
  admin: ReturnType<typeof createServiceRoleSupabaseClient>,
  userId: string,
): Promise<{ ok: boolean; skipped?: string }> {
  const orgMem = await orgMemoryPolicyForUser(admin, userId)
  if (orgMem.extractionPolicy === 'disabled_org_wide') {
    return { ok: true, skipped: 'org_disabled' }
  }

  const prefs = await fetchResolvedLearnerPreferences(admin, userId)
  if (!prefs.memory_digest_enabled) {
    return { ok: true, skipped: 'prefs' }
  }

  const effectiveDigestDays = effectiveMemoryDigestMinDays({
    learnerDays: prefs.memory_digest_cadence_days,
    orgMinDays: orgMem.digestMinDaysOrg,
    orgPolicy: orgMem.extractionPolicy,
  })
  if (!Number.isFinite(effectiveDigestDays)) {
    return { ok: true, skipped: 'org_disabled' }
  }

  const { data: profile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context')
    .eq('user_id', userId)
    .maybeSingle()
  const ctx = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const lastAt = ctx.consolidated_interaction_at as string | undefined

  if (
    lastAt
    && !digestEligibleAfterConsolidation({ consolidatedAt: lastAt, minDays: effectiveDigestDays })
  ) {
    return { ok: true, skipped: 'digest_cadence' }
  }

  const { data: rows } = await admin
    .from('ai_interactions')
    .select('user_message, ai_response, created_at')
    .eq('user_id', userId)
    .eq('interaction_type', 'question')
    .order('created_at', { ascending: false })
    .limit(MAX_INTERACTIONS)

  if (!rows?.length || rows.length < 3) {
    return { ok: true, skipped: 'too_few' }
  }

  const lines = [...rows]
    .reverse()
    .map((r) => `Q: ${String(r.user_message).slice(0, 400)}\nA: ${String(r.ai_response).slice(0, 400)}`)
    .join('\n---\n')

  if (
    lastAt &&
    rows[0]?.created_at &&
    new Date(rows[0].created_at).getTime() <= new Date(lastAt).getTime()
  ) {
    return { ok: true, skipped: 'fresh' }
  }

  const { orgSettings, privateRuntime: rt } = await loadOrgAiChatContext(admin, { userId })
  const chatCfg = resolveChatConfigError(orgSettings, rt)
  if (chatCfg) {
    return { ok: true, skipped: 'no_ai' }
  }

  const { content } = await chatCompletion(
    {
      model: getDefaultMemoryModel(rt),
      messages: [
        {
          role: 'user',
          content: `Summarize this learner's recent tutor conversations into a compact learner profile for personalization (max 120 words). Use bullet-style sentences. Themes: topics mastered, recurring struggles, question style, stated goals.\n\n${lines}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.25,
    },
    { privateOpenAi: rt },
  )

  const digest = (content ?? '').trim()
  if (!digest) return { ok: true, skipped: 'empty' }

  const nextCtx = {
    ...ctx,
    consolidated_interaction_digest: digest,
    consolidated_interaction_at: new Date().toISOString(),
  }

  const { error: updateErr } = await admin
    .from('learner_profiles')
    .update({ ai_tutor_context: nextCtx })
    .eq('user_id', userId)
  if (updateErr) {
    return { ok: false, skipped: `update_failed:${updateErr.message}` }
  }
  return { ok: true }
}

/**
 * Vercel Cron invokes **GET**; manual / CI may use **POST** with optional JSON `{ "user_id": "..." }`.
 * Auth: `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>` (same as other Learn crons).
 */
async function handleCron(request: NextRequest): Promise<NextResponse> {
  const invalid = rejectInvalidCronRequest(request)
  if (invalid) return invalid

  const admin = createServiceRoleSupabaseClient()
  let singleUserId: string | undefined
  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    singleUserId = typeof body.user_id === 'string' ? body.user_id : undefined
  }

  if (singleUserId) {
    const r = await consolidateOneUser(admin, singleUserId)
    return NextResponse.json(r, { status: r.ok ? 200 : 500 })
  }

  const { data: recent } = await admin
    .from('ai_interactions')
    .select('user_id')
    .eq('interaction_type', 'question')
    .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
    .limit(500)

  const ids = [...new Set((recent ?? []).map((r) => r.user_id))]
  const results: Record<string, string> = {}
  let anyFailed = false

  for (const uid of ids.slice(0, 50)) {
    const r = await consolidateOneUser(admin, uid)
    results[uid] = r.ok ? (r.skipped ?? 'done') : (r.skipped ?? 'error')
    if (!r.ok) anyFailed = true
  }

  return NextResponse.json(
    { ok: !anyFailed, processed: results },
    { status: anyFailed ? 500 : 200 },
  )
}

export async function GET(request: NextRequest) {
  return handleCron(request)
}

export async function POST(request: NextRequest) {
  return handleCron(request)
}
