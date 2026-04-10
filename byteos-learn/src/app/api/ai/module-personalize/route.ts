/**
 * Opt-in per-module AI overlays (does not modify canonical module content).
 * Modes: role_explain | brief_3min — stored on enrollments.personalization_overlays[moduleId].
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import { loadOrgAiChatContext } from '@/lib/org/orgAiChatContext'
import { checkPersonalizationEligibility } from '@/lib/personalization/eligibility'
import { checkAndIncrementUsage } from '@/lib/usage-limits'
import { moduleContentToPlainText } from '@/lib/learn/modulePlainText'
import { rejectSensitiveLearnerAiInput } from '@/lib/security/learnerAiInputGuard'
import type { Json } from '@/types/database'

const MODES = ['role_explain', 'brief_3min'] as const
type Mode = (typeof MODES)[number]

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const usage = await checkAndIncrementUsage(admin, user.id, 'module_personalize')
  if (!usage.allowed) {
    return NextResponse.json(
      { ok: false, error: `Daily limit (${usage.limit}) for module personalization reached.` },
      { status: 429 }
    )
  }

  let body: { enrollment_id?: string; course_id?: string; module_id?: string; mode?: string; force?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { enrollment_id, course_id, module_id, mode: modeRaw, force } = body
  if (!enrollment_id || !course_id || !module_id || !modeRaw) {
    return NextResponse.json(
      { error: 'enrollment_id, course_id, module_id, and mode required' },
      { status: 400 }
    )
  }
  if (!MODES.includes(modeRaw as Mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }
  const mode = modeRaw as Mode

  const feature = mode === 'role_explain' ? 'module_role_explain' : 'module_brief'
  const gate = await checkPersonalizationEligibility(admin, {
    userId: user.id,
    courseId: course_id,
    feature,
  })
  if (!gate.allowed) {
    return NextResponse.json({ ok: false, error: gate.reason }, { status: 403 })
  }

  const { data: enc } = await admin
    .from('enrollments')
    .select('id, user_id, course_id, personalization_overlays')
    .eq('id', enrollment_id)
    .single()

  if (!enc || enc.user_id !== user.id || enc.course_id !== course_id) {
    return NextResponse.json({ error: 'Invalid enrollment' }, { status: 403 })
  }

  const overlays = (enc.personalization_overlays as Record<string, unknown>) ?? {}
  const existingMod = overlays[module_id] as Record<string, unknown> | undefined
  const cacheKey = mode === 'role_explain' ? 'role_explanation' : 'brief_3min'
  if (!force && existingMod?.[cacheKey] && typeof existingMod[cacheKey] === 'string') {
    return NextResponse.json({
      ok: true,
      cached: true,
      overlay: existingMod,
      module_id: module_id,
    })
  }

  const { data: modRow, error: modErr } = await admin
    .from('modules')
    .select('id, title, content, course_id')
    .eq('id', module_id)
    .eq('course_id', course_id)
    .single()

  if (modErr || !modRow) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  const [{ data: profile }, { data: learnerProfile }] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', user.id).single(),
    admin.from('learner_profiles').select('ai_tutor_context').eq('user_id', user.id).single(),
  ])

  const memory = (learnerProfile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const background = (memory.self_reported_background as string) ?? ''
  const goals = (memory.learning_goals as string) ?? ''
  const known = ((memory.known_concepts as string[]) ?? []).join(', ') || 'none yet'
  const struggles = ((memory.struggles_with as string[]) ?? []).join(', ') || 'none identified'

  const plain = moduleContentToPlainText(modRow.content as never)

  const blockedPers = await rejectSensitiveLearnerAiInput(admin, user.id, [modRow.title, plain, background, goals])
  if (blockedPers) return blockedPers

  const { orgSettings, privateRuntime } = await loadOrgAiChatContext(admin, {
    courseId: course_id,
    userId: user.id,
  })
  const aiCfg = resolveChatConfigError(orgSettings, privateRuntime)
  if (aiCfg) {
    return NextResponse.json(
      { ok: false, error: `Personalization is not available: ${aiCfg}` },
      { status: 503 }
    )
  }
  const chatCtx = { privateOpenAi: privateRuntime }

  const rolePrompt = `You are Sudar. The learner "${firstName}" is studying this module.

Module title: ${modRow.title}
Their background (self-reported): ${background || 'not provided'}
Learning goals: ${goals || 'not stated'}
Known concepts: ${known}
Areas they find harder: ${struggles}

Module content (source of truth — do not invent facts beyond it):
---
${plain}
---

Write 2–4 short paragraphs explaining how this module applies to THEIR role and goals. Use "you". Plain text only, no markdown, no bullet lists. If background is thin, give a warm generic workplace angle. Max ~350 words.`

  const briefPrompt = `You are Sudar. Create a ~3-minute read summary for "${firstName}".

Module title: ${modRow.title}
Their goals: ${goals || 'general learning'}

Module content:
---
${plain}
---

Produce a dense but readable summary: key ideas only, plain text, no markdown, no bullets. Target 450–600 words so a quick reader finishes in about 3 minutes. Do not add facts not supported by the module.`

  const userPrompt = mode === 'role_explain' ? rolePrompt : briefPrompt

  let text = ''
  try {
    const { content } = await chatCompletion(
      {
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: mode === 'brief_3min' ? 900 : 650,
        temperature: 0.65,
      },
      chatCtx
    )
    text = (content ?? '').trim()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Could not generate personalization. Try again shortly.' },
      { status: 502 }
    )
  }

  if (!text) {
    return NextResponse.json(
      { ok: false, error: 'Personalization returned empty content.' },
      { status: 502 }
    )
  }

  const updatedAt = new Date().toISOString()
  const prevEntry = (overlays[module_id] as Record<string, string>) ?? {}
  const nextEntry = {
    ...prevEntry,
    [cacheKey]: text,
    updated_at: updatedAt,
  }
  const nextOverlays = { ...overlays, [module_id]: nextEntry }

  await admin
    .from('enrollments')
    .update({ personalization_overlays: nextOverlays as Json })
    .eq('id', enrollment_id)
    .eq('user_id', user.id)

  await admin.from('learning_events').insert({
    user_id: user.id,
    course_id,
    module_id,
    event_type: 'module_personalize',
    payload: { mode },
  })

  return NextResponse.json({
    ok: true,
    cached: false,
    overlay: nextEntry,
    module_id,
  })
}
