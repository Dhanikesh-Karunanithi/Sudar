import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrgIdAndRole } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext, studioMeteringChatCtx } from '@/lib/ai/studioOrgAiChat'
import { checkAndIncrementStudioUsage } from '@/lib/usage-limits'
import { z } from 'zod'
import { gateModuleMarkdown } from '@/lib/ai/courseGeneration/qualityGate'
import { buildCritiqueRefinePrompt } from '@/lib/ai/courseGeneration/prompts'

const requestSchema = z.object({
  topic: z.string().trim().min(1).max(500),
  course_title: z.string().max(300).optional(),
  module_title: z.string().max(300).optional(),
  difficulty: z.string().max(40).default('intermediate'),
  context: z.string().max(20_000).optional(),
  prior_modules_context: z
    .array(z.object({ title: z.string().max(300), summary: z.string().max(2000) }))
    .max(40)
    .default([]),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orgId } = await getOrgIdAndRole(user.id)
  const admin = createServiceRoleSupabaseClient()
  const usage = await checkAndIncrementStudioUsage(admin, user.id)
  if (!usage.allowed) {
    if (usage.reason === 'metering_unavailable') {
      return NextResponse.json(
        { error: 'Usage metering temporarily unavailable. Please try again shortly.' },
        { status: 503 },
      )
    }
    return NextResponse.json(
      { error: `Daily module generation limit (${usage.limit}) reached. Try again tomorrow.` },
      { status: 429 },
    )
  }
  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, orgId)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })
  const chatAiCtx = studioMeteringChatCtx(
    admin,
    orgId,
    user.id,
    orgSettings,
    privateRuntime,
    'course_generation',
    '/api/ai/generate-module'
  )

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, error: 'topic required' }, { status: 400 })
  const { topic, course_title, module_title, difficulty, context, prior_modules_context } = parsed.data

  const priorContext = prior_modules_context.length > 0
    ? `\n\nPREVIOUSLY COVERED MODULES (reference and build on; do NOT repeat):\n${
        prior_modules_context.map((p) => `- "${p.title}": ${p.summary}`).join('\n')
      }`
    : ''

  const systemPrompt = `You are an expert instructional designer and educator at Sudar. Your job is to write clear, engaging learning module content that follows adult learning principles (andragogy).
${priorContext}

Adult learning principles (Knowles' Andragogy):
- Relevance: Tie every concept to the learner's work or real-world decisions; avoid abstract-only theory.
- Self-direction: Use clear objectives and takeaways so learners can scan and choose what to focus on.
- Experience: Address the reader as "you"; use practical scenarios; assume they have some experience; do not talk down.
- Application: Include concrete examples and "how to apply" rather than only theory.
- Chunking: Short paragraphs (3–5 sentences max), bullet lists, and clear headings for scannability.

Personalization markers (for the adaptive engine):
- Wrap each learning objective line in [objective]...[/objective]
- Wrap key concept definitions in [concept:ConceptName]...[/concept]
- Wrap application exercises in [apply]...[/apply]

Learning-science requirements (the module is automatically reviewed against these):
- Include a "### Worked example" that walks through a concrete case step by step before practice.
- Include one [apply] "Your turn" task where the learner must produce or decide something.
- End with a "### Check yourself" subsection of 2–3 recall questions (no answers inline).
- Never invent statistics, studies, quotes, or numbered citations.

Rules:
- Write in plain text with markdown-style headings (## for main sections, ### for subsections).
- Difficulty level: ${difficulty}
- Do NOT include a quiz — just the learning content.
- Do NOT include meta-commentary like "Here is the module..." — start directly with content.
- Target length: 500–800 words.
- If prior modules are listed above, reference them by name and build on their concepts naturally.`

  const userPrompt = `Write a learning module for the following:

Course: "${course_title || 'General Course'}"
Module title: "${module_title || topic}"
Topic: ${topic}
${context ? `Additional context: ${context}` : ''}

Write the full module content now.`

  try {
    const { content } = await chatCompletion(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
      },
      chatAiCtx
    )

    if (!content) return NextResponse.json({ success: false, error: 'No content generated' }, { status: 502 })

    const moduleTitle = module_title || topic
    const gate = await gateModuleMarkdown({
      courseTitle: course_title || 'General Course',
      moduleTitle,
      draft: content,
      chatCtx: chatAiCtx,
      regenerate: async (previous, critique) => {
        const { content: refined } = await chatCompletion(
          {
            messages: buildCritiqueRefinePrompt(course_title || 'General Course', moduleTitle, undefined, previous, {
              critique,
            }) as { role: 'system' | 'user'; content: string }[],
            max_tokens: 2400,
            temperature: 0.5,
          },
          chatAiCtx
        )
        return refined
      },
    })

    return NextResponse.json({
      content: gate.content,
      quality: {
        overall: gate.assessment.overall,
        review_status: gate.review_status,
        blocked: gate.blocked,
        issues: gate.issues,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: `Generation failed: ${err instanceof Error ? err.message : err}` }, { status: 500 })
  }
}
