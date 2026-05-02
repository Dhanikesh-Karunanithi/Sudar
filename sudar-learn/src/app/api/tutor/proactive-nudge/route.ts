import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import { loadOrgAiChatContext } from '@/lib/org/orgAiChatContext'
import type { PrivateOpenAiRuntime } from '@/types/orgAiInference'
import { idleNudgeFallbackChoices } from '@/lib/tutor/proactiveTemplates'
import { parseProactiveNudgeJson } from '@/lib/tutor/proactivePromptSchema'

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
  privateRuntime: PrivateOpenAiRuntime | null
): Promise<{ message: string; choices: ReturnType<typeof idleNudgeFallbackChoices> }> {
  const prompt = `The learner has been quiet on their lesson (${reason ?? 'idle'}). ${JSON_INSTRUCTION}`
  const { content } = await chatCompletion(
    {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 320,
      temperature: 0.55,
    },
    { privateOpenAi: privateRuntime }
  )
  const parsed = parseProactiveNudgeJson(content ?? '')
  if (parsed) {
    return { message: parsed.message, choices: parsed.choices }
  }
  return { message: IDLE_FALLBACK_MESSAGE, choices: idleNudgeFallbackChoices() }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const { course_id, module_id, reason } = parsed.data

  const admin = createServiceRoleSupabaseClient()
  const { orgSettings, privateRuntime } = await loadOrgAiChatContext(admin, {
    userId: user.id,
    courseId: course_id,
  })
  const chatCfgErr = resolveChatConfigError(orgSettings, privateRuntime as PrivateOpenAiRuntime | null)

  let message = IDLE_FALLBACK_MESSAGE
  let choices = idleNudgeFallbackChoices()
  let skipped: 'chat_config' | undefined

  if (chatCfgErr) {
    skipped = 'chat_config'
  } else {
    try {
      const out = await buildNudgeFromLlm(reason, privateRuntime as PrivateOpenAiRuntime | null)
      message = out.message
      choices = out.choices
    } catch {
      message = IDLE_FALLBACK_MESSAGE
      choices = idleNudgeFallbackChoices()
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
