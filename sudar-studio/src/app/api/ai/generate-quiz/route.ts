/**
 * Generates adaptive quiz questions for a module.
 * Each question includes: text, 4 options, correct index, explanation, and topic tag.
 * Topic tags flow into learner struggles when a learner answers incorrectly.
 */

import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrgIdAndRole } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import type { Json } from '@/types/database'
import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext } from '@/lib/ai/studioOrgAiChat'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const { orgId } = await getOrgIdAndRole(user.id)
  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, orgId)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })
  const chatAiCtx = { privateOpenAi: privateRuntime }
  const { module_id, course_title, module_title, content, difficulty = 'intermediate', num_questions = 4 } = await request.json()

  if (!module_id || !content) return NextResponse.json({ error: 'module_id and content required' }, { status: 400 })

  const prompt = `You are an expert instructional designer creating a quiz for an e-learning module.

Course: "${course_title}"
Module: "${module_title}"
Difficulty: ${difficulty}
Module content:
---
${content.slice(0, 2500)}
---

Create exactly ${num_questions} multiple-choice questions that test genuine comprehension (not just recall).

Rules:
- Each question must be answerable from the module content
- Options must be plausible (no obviously wrong answers)
- Include a 1-sentence explanation for the correct answer
- Tag each question with a short topic name (2-4 words, e.g. "variable assignment", "HTTP methods")
- Vary question types: understanding, application, comparison

Return ONLY valid JSON in this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this is correct.",
      "topic": "short topic tag"
    }
  ]
}`

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
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    quiz = JSON.parse(match[0])
    if (!Array.isArray(quiz.questions)) throw new Error('Invalid structure')
  } catch {
    return NextResponse.json({ error: 'Failed to parse quiz from AI response' }, { status: 500 })
  }

  // Save to module
  const { error: updateError } = await admin
    .from('modules')
    .update({ quiz: quiz as Json })
    .eq('id', module_id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ quiz })
}
