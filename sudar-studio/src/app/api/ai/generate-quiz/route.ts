/**
 * Generates adaptive quiz questions for a module.
 * Each question includes: text, 4 options, correct index, explanation, and topic tag.
 * Topic tags flow into learner struggles when a learner answers incorrectly.
 */

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { getOrgIdAndRole } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import type { Json } from '@/types/database'
import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext, studioMeteringChatCtx } from '@/lib/ai/studioOrgAiChat'
import { buildQuizPrompt, parseQuizFromAi } from '../../../../shared/content-generation'

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user } = session

  const admin = createServiceRoleSupabaseClient()
  const { orgId } = await getOrgIdAndRole(user.id)
  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, orgId)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })
  const chatAiCtx = studioMeteringChatCtx(
    admin,
    orgId,
    user.id,
    orgSettings,
    privateRuntime,
    'studio_assist',
    '/api/ai/generate-quiz'
  )
  const { module_id, course_title, module_title, content, difficulty = 'intermediate', num_questions = 4 } = await request.json()

  if (!module_id || !content) return NextResponse.json({ error: 'module_id and content required' }, { status: 400 })

  const prompt = buildQuizPrompt({
    content,
    courseTitle: course_title,
    moduleTitle: module_title,
    difficulty,
    numQuestions: num_questions,
    language: 'en',
  })

  const { content: raw } = await chatCompletion(
    {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.5,
    },
    chatAiCtx
  ).catch(() => ({ content: '' }))
  if (!raw) return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })

  let quiz: { questions: unknown[] }
  try {
    quiz = parseQuizFromAi(raw)
  } catch {
    return NextResponse.json({ error: 'Failed to parse quiz from AI response' }, { status: 500 })
  }

  const { error: updateError } = await admin
    .from('modules')
    .update({ quiz: quiz as Json })
    .eq('id', module_id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ quiz })
}
