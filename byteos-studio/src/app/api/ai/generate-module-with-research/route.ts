import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { searchWeb } from '@/lib/search/webSearch'

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions'
const MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'

export interface GenerateModuleWithResearchBody {
  topic: string
  course_title?: string
  module_title?: string
  difficulty?: string
  context?: string
  prior_modules_context?: { title: string; summary: string }[]
  search_query?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.TOGETHER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'TOGETHER_API_KEY not configured' }, { status: 500 })

  let body: GenerateModuleWithResearchBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    topic,
    course_title,
    module_title,
    difficulty = 'intermediate',
    context,
    prior_modules_context,
    search_query: searchQueryOverride,
  } = body

  if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 })

  const searchQuery = (searchQueryOverride ?? `${module_title ?? topic} ${topic}`).trim().slice(0, 200)
  const webResults = await searchWeb(searchQuery, 8)

  const priorContext =
    Array.isArray(prior_modules_context) && prior_modules_context.length > 0
      ? `\n\nPREVIOUSLY COVERED MODULES (reference and build on; do NOT repeat):\n${
          prior_modules_context.map((p) => `- "${p.title}": ${p.summary}`).join('\n')
        }`
      : ''

  const webContext =
    webResults.length > 0
      ? `\n\nWEB SEARCH RESULTS (use as context only; cite sources with [1], [2], etc.):\n${webResults
          .map(
            (r, i) =>
              `[${i + 1}] ${r.title}\nURL: ${r.link}\n${r.snippet}`
          )
          .join('\n\n')}`
      : ''

  const systemPrompt = `You are an expert instructional designer and educator at ByteOS. Your job is to write clear, engaging learning module content that follows adult learning principles (andragogy).
${priorContext}
${webContext}

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

CITATION RULES (critical when web results are provided):
- Use the web search results above only as context. Cite sources in the body using [1], [2], [3], etc. matching the numbered results.
- At the end of the content, add a "## References" section listing each cited source on its own line as: [N] Title (URL). Use the exact title and link from the web results.
- Do NOT invent or hallucinate references; only cite from the numbered list provided.
- If no web results were provided, write from your knowledge without a References section.

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

Write the full module content now.${webResults.length > 0 ? ' Use the web search results above and cite them with [1], [2], etc. End with a ## References section.' : ''}`

  try {
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1400,
        temperature: 0.7,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `AI provider error: ${err}` }, { status: 502 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) return NextResponse.json({ error: 'No content generated' }, { status: 502 })

    const references = webResults.map((r, i) => ({
      index: i + 1,
      title: r.title,
      link: r.link,
    }))

    return NextResponse.json({ content, references })
  } catch (err) {
    return NextResponse.json({ error: `Generation failed: ${err}` }, { status: 500 })
  }
}
