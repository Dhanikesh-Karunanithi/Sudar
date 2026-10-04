/**
 * Generates adaptive quiz questions for a module.
 * Each question includes: text, 4 options, correct index, explanation, and topic tag.
 * Topic tags flow into learner struggles when a learner answers incorrectly.
 */

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { getOrgIdAndRole } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Json } from '@/types/database'
import type { ModuleContent } from '@/types/content'
import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext, studioMeteringChatCtx } from '@/lib/ai/studioOrgAiChat'
import { getEditableCourse } from '@/lib/courses/courseAccess'
import { getModuleBodyText } from '@/lib/contentBlocks'
import { buildQuizPrompt } from '@shared-content-generation/prompts'
import { parseQuizFromAi } from '@shared-content-generation/parsers'
import { formatCritique, validateQuizQuality, type QualityIssue } from '@shared-content-generation/quality'
import type { QuizResult } from '@shared-content-generation/schemas'

const requestSchema = z.object({
  module_id: z.string().uuid(),
  content: z.string().max(400_000).optional(),
  course_title: z.string().max(300).optional(),
  module_title: z.string().max(300).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).catch('intermediate'),
  num_questions: z.number().int().min(1).max(15).default(4),
})

function objectivesFrom(content: unknown, body: string): string[] {
  if (content && typeof content === 'object' && Array.isArray((content as { learning_objectives?: unknown }).learning_objectives)) {
    return ((content as { learning_objectives: unknown[] }).learning_objectives).map(String).filter(Boolean)
  }
  return [...body.matchAll(/\[objective\]([\s\S]*?)\[\/objective\]/gi)].map((m) => m[1]!.trim()).filter(Boolean)
}

/** Drop questions with broken answer keys so learners never see an unanswerable item. */
function dropBrokenQuestions(quiz: QuizResult): QuizResult {
  return {
    questions: quiz.questions.filter((q) => {
      const opts = q.options.map((o) => o.trim().toLowerCase())
      return q.correct >= 0 && q.correct < opts.length && new Set(opts).size === opts.length
    }),
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { user } = session

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'module_id (uuid) required; invalid quiz options' }, { status: 400 })
  }
  const { module_id, course_title, module_title, difficulty, num_questions } = parsed.data

  const admin = createServiceRoleSupabaseClient()
  const { data: mod } = await admin.from('modules').select('id, course_id, title, content').eq('id', module_id).maybeSingle()
  if (!mod) return NextResponse.json({ success: false, error: 'Module not found' }, { status: 404 })
  const course = await getEditableCourse(admin, mod.course_id, user.id)
  if (!course) return NextResponse.json({ success: false, error: 'Module not found' }, { status: 404 })

  const body = parsed.data.content?.trim() || getModuleBodyText(mod.content as unknown as ModuleContent)?.trim() || ''
  if (!body) return NextResponse.json({ success: false, error: 'Module has no content to build a quiz from' }, { status: 400 })
  const objectives = objectivesFrom(mod.content, body)

  const orgId = course.org_id ?? (await getOrgIdAndRole(user.id)).orgId
  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, orgId)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  if (configError) return NextResponse.json({ success: false, error: configError }, { status: 500 })
  const chatAiCtx = studioMeteringChatCtx(
    admin,
    orgId,
    user.id,
    orgSettings,
    privateRuntime,
    'studio_assist',
    '/api/ai/generate-quiz'
  )

  let quiz: QuizResult | null = null
  let issues: QualityIssue[] = []
  let critique: string | undefined
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = buildQuizPrompt({
      content: body,
      courseTitle: course_title ?? course.title,
      moduleTitle: module_title ?? mod.title,
      difficulty,
      numQuestions: num_questions,
      language: 'en',
      objectives,
      critique,
    })
    const { content: raw } = await chatCompletion(
      { messages: [{ role: 'user', content: prompt }], max_tokens: 2000, temperature: 0.4 },
      chatAiCtx
    ).catch(() => ({ content: '' }))
    if (!raw) continue
    try {
      const candidate = parseQuizFromAi(raw)
      const candidateIssues = validateQuizQuality(candidate.questions, { objectives })
      if (!quiz || candidateIssues.length < issues.length) {
        quiz = candidate
        issues = candidateIssues
      }
      if (!candidateIssues.some((i) => i.severity !== 'info')) break
      critique = formatCritique(candidateIssues)
    } catch {
      critique = 'Return valid JSON matching the schema exactly.'
    }
  }

  if (!quiz) return NextResponse.json({ success: false, error: 'AI generation failed' }, { status: 500 })
  quiz = dropBrokenQuestions(quiz)
  if (quiz.questions.length === 0) {
    return NextResponse.json({ success: false, error: 'Generated quiz failed validation; try again' }, { status: 502 })
  }

  const { error: updateError } = await admin.from('modules').update({ quiz: quiz as unknown as Json }).eq('id', module_id)
  if (updateError) return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true, quiz, quality_issues: issues })
}
