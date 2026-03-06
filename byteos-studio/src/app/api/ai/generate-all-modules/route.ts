import { authorizeCourseAccess } from '@/lib/courseAccess'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getOneImage } from '@/lib/media/imageSearch'
import { selectComponentsForModule, toInteractiveElements, type ModuleRole } from '@/lib/ai/componentSelector'

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions'
const MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'

async function callAI(
  apiKey: string,
  messages: { role: string; content: string }[],
  maxTokens = 1500
) {
  const res = await fetch(TOGETHER_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature: 0.7, top_p: 0.9 }),
  })
  if (!res.ok) throw new Error(`AI provider error: ${await res.text()}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim() ?? ''
  if (!text) throw new Error('AI returned empty response')
  return text
}

interface CurriculumEntry {
  title: string
  bloomLevel: string
  pedagogicalRole: string
  sectionStructure: string[]
  brief: string
  buildOn: string
}

// ─── Phase 1: Generate curriculum plan ──────────────────────────────────────

function buildCurriculumPlanPrompt(
  courseTitle: string,
  description: string | null,
  difficulty: string,
  moduleTitles: string[]
) {
  const system = `You are a senior instructional designer at Harvard's Bok Center for Teaching and Learning. Your speciality is designing curriculum that scaffolds from foundational knowledge to higher-order thinking using Bloom's Revised Taxonomy and Gagné's Nine Events of Instruction.

Design a curriculum plan for a corporate training course. The module titles are already defined — your job is to assign each module a UNIQUE pedagogical role, Bloom's taxonomy level, section structure, and brief.

Rules:
- Bloom's levels should PROGRESS across modules (early modules: Remember/Understand, middle: Apply/Analyze, later: Evaluate/Create).
- Each module MUST have a DIFFERENT sectionStructure array. Do NOT give every module the same headings. Tailor sections to the module's role.
- "buildOn" for the first module should be "None — this is the foundation".
- Return ONLY a valid JSON array. No markdown, no explanation, no preamble.

JSON schema for each entry:
{
  "title": "exact module title",
  "bloomLevel": "Remember | Understand | Apply | Analyze | Evaluate | Create",
  "pedagogicalRole": "e.g. Foundation / orientation, Concept deep-dive, Practical application, Analysis and critical thinking, Synthesis / capstone",
  "sectionStructure": ["Section heading 1", "Section heading 2", ...],
  "brief": "One sentence: what this module accomplishes in the curriculum",
  "buildOn": "Which prior module concepts this module references"
}`

  const user = `Course: "${courseTitle}"
${description ? `Description: ${description}` : ''}
Difficulty: ${difficulty}
Modules (in order): ${JSON.stringify(moduleTitles)}

Return the JSON array now.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

// ─── Phase 2: Generate module content ───────────────────────────────────────

function buildModuleContentPrompt(
  courseTitle: string,
  description: string | null,
  difficulty: string,
  entry: CurriculumEntry,
  moduleIndex: number,
  totalModules: number,
  fullSyllabus: CurriculumEntry[],
  priorSummaries: { title: string; summary: string }[]
) {
  const syllabusOverview = fullSyllabus
    .map((e, i) => `${i + 1}. "${e.title}" — ${e.pedagogicalRole} (${e.bloomLevel})`)
    .join('\n')

  const priorContext = priorSummaries.length > 0
    ? priorSummaries.map((p) => `- "${p.title}": ${p.summary}`).join('\n')
    : 'None — this is the first module.'

  const sections = entry.sectionStructure.map((s) => `"## ${s}"`).join(', ')

  const system = `You are an expert instructional designer writing module ${moduleIndex + 1} of ${totalModules} for the course "${courseTitle}".

CURRICULUM CONTEXT:
${syllabusOverview}

THIS MODULE:
- Title: "${entry.title}"
- Pedagogical role: ${entry.pedagogicalRole}
- Bloom's taxonomy level: ${entry.bloomLevel}
- Brief: ${entry.brief}
- Builds on: ${entry.buildOn}

PREVIOUSLY COVERED (reference and build on these; do NOT repeat them):
${priorContext}

STRUCTURE:
Use EXACTLY these section headings (as ## markdown headings): ${sections}
Do NOT add extra top-level sections. You may add ### subsections within them.

ADULT LEARNING PRINCIPLES (Knowles' Andragogy):
- Relevance: Every concept must connect to the learner's work or real-world decisions. No abstract-only theory.
- Self-direction: State clear objectives at the start so learners can scan and prioritize.
- Experience: Address the reader as "you." Use practical scenarios. Assume they have some professional experience.
- Readiness: Show why this module matters NOW in their learning journey.
- Motivation: Start each module with a compelling "why" tied to job outcomes.

BLOOM'S LEVEL GUIDANCE:
- Write at the "${entry.bloomLevel}" cognitive level. If Remember: define and identify. If Understand: explain and compare. If Apply: demonstrate with worked examples. If Analyze: break down scenarios and compare approaches. If Evaluate: judge trade-offs and recommend. If Create: synthesize and design solutions.

PERSONALIZATION MARKERS (for the adaptive engine):
- Wrap each learning objective line in [objective]...[/objective]
- Wrap key concept definitions in [concept:ConceptName]...[/concept]
- Wrap application exercises or "try this" prompts in [apply]...[/apply]

RULES:
- Markdown headings (## for main sections, ### for subsections). Plain text.
- Difficulty: ${difficulty}
- Do NOT include a quiz.
- Do NOT start with meta-commentary like "In this module..." — start directly with the first section heading.
- Target length: 500–800 words.
- Reference prior modules by name when building on their concepts.
- Make this module feel like a NATURAL continuation, not a standalone document.`

  const user = `Course: "${courseTitle}"
${description ? `Description: ${description}` : ''}

Write the full content for module "${entry.title}" now, following the structure and guidelines above.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

function extractSummary(content: string, title: string): string {
  const lines = content.split('\n').filter((l) => l.trim().length > 0 && !l.startsWith('#'))
  const meaningful = lines.slice(0, 6).join(' ').replace(/\[.*?\]/g, '').trim()
  const truncated = meaningful.length > 300 ? meaningful.slice(0, 300) + '…' : meaningful
  return truncated || `Covers the topic "${title}".`
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const apiKey = process.env.TOGETHER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'TOGETHER_API_KEY not configured' }, { status: 500 })

  const { course_id } = await request.json()
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const access = await authorizeCourseAccess(course_id, 'edit')
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

  const admin = createAdminClient()

  const { data: course, error: courseErr } = await admin
    .from('courses')
    .select('id, title, description, difficulty')
    .eq('id', course_id)
    .single()

  if (courseErr || !course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const { data: modules } = await admin
    .from('modules')
    .select('id, title, content, order_index')
    .eq('course_id', course_id)
    .order('order_index', { ascending: true })

  if (!modules || modules.length === 0) {
    return NextResponse.json({ completed: true, modules_generated: 0 })
  }

  const emptyModules = modules.filter(
    (m: { content: { body?: string } | null }) => !m.content || !(m.content as { body?: string })?.body?.trim()
  )
  if (emptyModules.length === 0) {
    return NextResponse.json({ completed: true, modules_generated: 0 })
  }

  const allTitles = modules.map((m: { title: string }) => m.title)
  const difficulty = course.difficulty ?? 'intermediate'

  // ─── Phase 1: Curriculum plan ───────────────────────────────────────────

  let curriculum: CurriculumEntry[]
  try {
    const planMessages = buildCurriculumPlanPrompt(
      course.title, course.description, difficulty, allTitles
    )
    const raw = await callAI(apiKey, planMessages, 2000)
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Curriculum plan response did not contain a JSON array')
    curriculum = JSON.parse(match[0]) as CurriculumEntry[]
    if (!Array.isArray(curriculum) || curriculum.length === 0) {
      throw new Error('Curriculum plan must be a non-empty array')
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Curriculum plan generation failed: ${msg}` }, { status: 502 })
  }

  // Build a lookup from title to curriculum entry (fuzzy: lowercase + trim)
  const curriculumByTitle = new Map<string, CurriculumEntry>()
  for (const entry of curriculum) {
    curriculumByTitle.set(entry.title.toLowerCase().trim(), entry)
  }

  // ─── Phase 2: Generate each empty module sequentially ───────────────────

  const priorSummaries: { title: string; summary: string }[] = []

  // Seed priorSummaries with non-empty modules that precede empty ones
  for (const mod of modules) {
    const body = (mod.content as { body?: string })?.body?.trim()
    if (body) {
      priorSummaries.push({ title: mod.title, summary: extractSummary(body, mod.title) })
    }
  }

  let generated = 0
  for (const mod of emptyModules) {
    const entry = curriculumByTitle.get(mod.title.toLowerCase().trim())
    if (!entry) {
      // Fallback entry if title matching failed
      const idx = modules.findIndex((m: { id: string }) => m.id === mod.id)
      const fallback: CurriculumEntry = {
        title: mod.title,
        bloomLevel: idx <= 1 ? 'Understand' : idx <= 3 ? 'Apply' : 'Analyze',
        pedagogicalRole: idx === 0 ? 'Foundation / orientation' : 'Concept exploration',
        sectionStructure: ['Why this matters', 'Core ideas', 'Practical application', 'Key takeaways'],
        brief: `Covers ${mod.title} within the course curriculum.`,
        buildOn: priorSummaries.length > 0 ? `Builds on ${priorSummaries[priorSummaries.length - 1].title}` : 'None — this is the foundation',
      }
      curriculumByTitle.set(mod.title.toLowerCase().trim(), fallback)
    }

    const resolvedEntry = curriculumByTitle.get(mod.title.toLowerCase().trim())!
    const modIndex = modules.findIndex((m: { id: string }) => m.id === mod.id)

    const contentMessages = buildModuleContentPrompt(
      course.title,
      course.description,
      difficulty,
      resolvedEntry,
      modIndex,
      modules.length,
      curriculum,
      priorSummaries
    )

    try {
      const content = await callAI(apiKey, contentMessages, 1800)

      const imageResult = await getOneImage(mod.title, course.title)

      const contentSummary = content.slice(0, 500)
      const role: ModuleRole =
        modIndex === 0
          ? 'intro'
          : modIndex >= modules.length - 1
            ? 'capstone'
            : resolvedEntry.pedagogicalRole?.toLowerCase().includes('assessment')
              ? 'assessment'
              : resolvedEntry.pedagogicalRole?.toLowerCase().includes('deep')
                ? 'deep-dive'
                : 'core'
      let interactiveElements: { type: string; data: Record<string, unknown> }[] = []
      if (apiKey) {
        const selected = await selectComponentsForModule(
          mod.title,
          contentSummary,
          role,
          apiKey
        )
        if (selected.length > 0) {
          interactiveElements = toInteractiveElements(selected)
        }
      }

      const richContent = {
        type: 'rich',
        sections: [
          {
            heading: '',
            content,
            type: 'text' as const,
            ...(imageResult ? { image: imageResult } : {}),
          },
        ],
        ...(interactiveElements.length > 0 ? { interactiveElements } : {}),
      }

      await admin
        .from('modules')
        .update({ content: richContent })
        .eq('id', mod.id)

      priorSummaries.push({ title: mod.title, summary: extractSummary(content, mod.title) })
      generated++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json({
        error: `Content generation failed for "${mod.title}": ${msg}`,
        modules_generated: generated,
      }, { status: 502 })
    }
  }

  return NextResponse.json({ completed: true, modules_generated: generated })
}
