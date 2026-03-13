import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, getChatConfigError } from '@/lib/ai/chat'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configError = getChatConfigError()
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })

  const {
    topic,
    course_title,
    module_title,
    difficulty = 'intermediate',
    context,
    prior_modules_context,
  } = await request.json()
  if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 })

  const priorContext = Array.isArray(prior_modules_context) && prior_modules_context.length > 0
    ? `\n\nPREVIOUSLY COVERED MODULES (reference and build on; do NOT repeat):\n${
        prior_modules_context.map((p: { title: string; summary: string }) => `- "${p.title}": ${p.summary}`).join('\n')
      }`
    : ''

  const systemPrompt = `You are an expert instructional designer and educator at ByteOS. Your job is to write clear, engaging learning module content that follows adult learning principles (andragogy).
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
    const { content } = await chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1200,
      temperature: 0.7,
      top_p: 0.9,
    })

    if (!content) return NextResponse.json({ error: 'No content generated' }, { status: 502 })

    return NextResponse.json({ content })
  } catch (err) {
    return NextResponse.json({ error: `Generation failed: ${err instanceof Error ? err.message : err}` }, { status: 500 })
  }
}
