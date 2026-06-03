import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchResolvedLearnerPreferences } from '@/lib/learner/learnerPreferences'
import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import { learnMeteringChatCtx, loadOrgAiChatContext } from '@/lib/org/orgAiChatContext'
import type { PrivateOpenAiRuntime } from '@/types/orgAiInference'
import { idleNudgeFallbackChoices } from '@/lib/tutor/proactiveTemplates'
import { parseProactiveNudgeJson } from '@/lib/tutor/proactivePromptSchema'
import { createTranslator } from 'next-intl/server'
import { loadMessagesSync } from '@/i18n/loadMessages'
import { findExternalCourseForTopic } from '@/lib/external/externalCourseContext'
import { buildTutorContentLanguageBlock } from '@/lib/i18n/contentLanguagePrompt'

const bodySchema = z.object({
  course_id: z.string().uuid(),
  module_id: z.string().uuid(),
  reason: z.enum(['idle_90s', 'quiz_low_score', 'replay_pattern']).optional(),
})

const IDLE_FALLBACK_MESSAGE =
  'Want a quick hint on this section, or should we try another format?'

const JSON_INSTRUCTION = `Return ONLY valid JSON (no markdown) with this shape:
{"message":"<one friendly sentence, max 28 words, offering help, end with a question>","choices":[
  {"id":"short_slug","label":"<3-6 words button>","follow_up_message":"<full sentence learner sends to tutor>"},
  ... 2 to 4 choices including one low-friction dismiss like {"id":"dismiss","label":"I'm good","follow_up_message":""}
]}
Rules: no guilt, do not mention timers. Labels must be short. follow_up_message empty string means dismiss only.`

async function buildNudgeFromLlm(
  reason: string | undefined,
  languageBlock: string,
  tr: (key: string) => string,
  chatCtx: { privateOpenAi?: PrivateOpenAiRuntime | null },
): Promise<{ message: string; choices: ReturnType<typeof idleNudgeFallbackChoices> }> {
  const prompt = `${languageBlock}

The learner has been quiet on their lesson (${reason ?? 'idle'}). ${JSON_INSTRUCTION}`
  const { content } = await chatCompletion(
    {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 320,
      temperature: 0.55,
    },
    chatCtx
  )
  const parsed = parseProactiveNudgeJson(content ?? '')
  if (parsed) {
    return { message: parsed.message, choices: parsed.choices }
  }
  return { message: IDLE_FALLBACK_MESSAGE, choices: idleNudgeFallbackChoices(tr) }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user } = session

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const { course_id, module_id, reason } = parsed.data

  const admin = createServiceRoleSupabaseClient()
  const prefs = await fetchResolvedLearnerPreferences(admin, user.id)
  const messages = loadMessagesSync(prefs.ui_language)
  const tr = createTranslator({ locale: prefs.ui_language, messages })
  const t = (key: string) => tr(key)
  const languageBlock = buildTutorContentLanguageBlock(prefs)
  if (!prefs.proactive_nudges_enabled || !prefs.idle_nudges) {
    return NextResponse.json({ ok: true, message: '', choices: [], skipped: 'preferences' })
  }
  if (!prefs.stuck_detection_nudges && (reason === 'idle_90s' || reason === 'replay_pattern')) {
    return NextResponse.json({ ok: true, message: '', choices: [], skipped: 'preferences' })
  }

  const { data: courseRow } = await admin
    .from('courses')
    .select('title, org_id, tags')
    .eq('id', course_id)
    .maybeSingle()

  if (reason === 'quiz_low_score' && courseRow?.tags?.length) {
    const topic = courseRow.tags[0]
    const externalMatch = await findExternalCourseForTopic(
      admin,
      courseRow.org_id ?? null,
      topic,
      course_id,
    )
    if (externalMatch) {
      const providerLabel = externalMatch.external_provider ?? 'external'
      const msg = `Struggling with ${topic}? "${externalMatch.title}" on ${providerLabel} might help — want to explore it?`
      const choices = [
        {
          id: 'open_external',
          label: 'Show course',
          follow_up_message: `Recommend the external course ${externalMatch.title}`,
        },
        {
          id: 'dismiss',
          label: "I'm good",
          follow_up_message: '',
        },
      ]
      await admin.from('ai_interactions').insert({
        user_id: user.id,
        course_id,
        module_id,
        interaction_type: 'proactive_nudge',
        user_message: `[${reason ?? 'proactive'}]`,
        ai_response: msg,
        context_used: { reason, external_course_id: externalMatch.id, source: 'external_course_match' },
      })
      return NextResponse.json({
        ok: true,
        message: msg,
        choices,
        external_course: {
          id: externalMatch.id,
          title: externalMatch.title,
          href: `/courses/${externalMatch.id}`,
        },
      })
    }
  }

  const { orgId, orgSettings, privateRuntime } = await loadOrgAiChatContext(admin, {
    userId: user.id,
    courseId: course_id,
  })
  const chatCfgErr = resolveChatConfigError(orgSettings, privateRuntime as PrivateOpenAiRuntime | null)

  let message = IDLE_FALLBACK_MESSAGE
  let choices = idleNudgeFallbackChoices(t)
  let skipped: 'chat_config' | undefined

  if (chatCfgErr) {
    skipped = 'chat_config'
  } else {
    try {
      const chatCtx =
        orgId != null
          ? learnMeteringChatCtx(
              admin,
              orgId,
              user.id,
              orgSettings,
              privateRuntime as PrivateOpenAiRuntime | null,
              'tutor_proactive',
              '/api/tutor/proactive-nudge',
              { course_id, module_id }
            )
          : { privateOpenAi: privateRuntime as PrivateOpenAiRuntime | null }
      const out = await buildNudgeFromLlm(reason, languageBlock, t, chatCtx)
      message = out.message
      choices = out.choices
    } catch {
      message = IDLE_FALLBACK_MESSAGE
      choices = idleNudgeFallbackChoices(t)
    }
  }

  await admin.from('ai_interactions').insert({
    user_id: user.id,
    course_id,
    module_id,
    interaction_type: 'proactive_nudge',
    user_message: `[${reason ?? 'proactive'}]`,
    ai_response: message,
    context_used: { reason: reason ?? 'proactive', choices, skipped: skipped ?? null },
  })

  await admin.from('learning_events').insert({
    user_id: user.id,
    course_id,
    module_id,
    event_type: 'ai_tutor_open',
    modality: 'text',
    payload: { proactive: true, reason: reason ?? 'idle', skipped: skipped ?? null },
  })

  return NextResponse.json({ ok: true, message, choices, ...(skipped ? { skipped } : {}) })
}
