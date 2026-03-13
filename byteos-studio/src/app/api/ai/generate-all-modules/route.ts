import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getOneImage } from '@/lib/media/imageSearch'
import { selectComponentsForModule, toInteractiveElements, type ModuleRole } from '@/lib/ai/componentSelector'
import { LESSON_ARCHETYPES, type LessonArchetype, selectArchetype, getArchetypeStructuralRule } from '@/lib/ai/archetypeSelector'
import { chatCompletion, getChatConfigError } from '@/lib/ai/chat'

async function callAI(messages: { role: string; content: string }[], maxTokens = 1500) {
  const { content } = await chatCompletion({
    messages: messages as { role: 'system' | 'user' | 'assistant'; content: string }[],
    max_tokens: maxTokens,
    temperature: 0.7,
    top_p: 0.9,
  })
  if (!content) throw new Error('AI returned empty response')
  return content
}

interface CurriculumEntry {
  title: string
  bloomLevel: string
  pedagogicalRole: string
  sectionStructure: string[]
  brief: string
  buildOn: string
  archetype?: string
}

// ─── Phase 1: Generate curriculum plan ──────────────────────────────────────

function buildCurriculumPlanPrompt(
  courseTitle: string,
  description: string | null,
  difficulty: string,
  moduleTitles: string[]
) {
  const system = `You are a senior instructional designer at Harvard's Bok Center for Teaching and Learning. Your speciality is designing curriculum that scaffolds from foundational knowledge to higher-order thinking using Bloom's Revised Taxonomy and Gagné's Nine Events of Instruction.

Design a curriculum plan for a corporate training course. The module titles are already defined — your job is to assign each module a UNIQUE pedagogical role, Bloom's taxonomy level, section structure, brief, and a structural archetype.

Rules:
- Bloom's levels should PROGRESS across modules (early modules: Remember/Understand, middle: Apply/Analyze, later: Evaluate/Create).
- Each module MUST have a DIFFERENT sectionStructure array. Do NOT give every module the same headings. Tailor sections to the module's role.
- Assign exactly one "archetype" per module from this list: ${LESSON_ARCHETYPES.join(', ')}. Do NOT use the same archetype for two consecutive modules.
- "buildOn" for the first module should be "None — this is the foundation".
- Return ONLY a valid JSON array. No markdown, no explanation, no preamble.

JSON schema for each entry:
{
  "title": "exact module title",
  "bloomLevel": "Remember | Understand | Apply | Analyze | Evaluate | Create",
  "pedagogicalRole": "e.g. Foundation / orientation, Concept deep-dive, Practical application, Analysis and critical thinking, Synthesis / capstone",
  "sectionStructure": ["Section heading 1", "Section heading 2", ...],
  "brief": "One sentence: what this module accomplishes in the curriculum",
  "buildOn": "Which prior module concepts this module references",
  "archetype": "cold-open | socratic | misconception-trap | case-file | comparison-engine"
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
- Structural archetype: ${(entry.archetype ?? 'cold-open') as string}

STRUCTURAL ARCHETYPE (follow this pattern for this module only):
${getArchetypeStructuralRule((entry.archetype ?? 'cold-open') as LessonArchetype)}

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

OPENING RULE (critical — follow for the first paragraph only):
- cold-open: First paragraph MUST be a concrete scenario, problem, or situation. No explanation or context. The learner should feel dropped into a moment. Then use your first ## section to unpack it.
- socratic: First section MUST open with a question that the rest of the section answers. Use questions to drive the narrative.
- misconception-trap: First section MUST state a commonly believed wrong idea as if it were true (1–2 sentences). Second section dismantles it.
- case-file: First paragraph MUST introduce one specific real-world case, scenario, or example. Every section then refers back to that same case.
- comparison-engine: First section MUST frame the concept as a contrast (X vs Y, before vs after). The concept only exists in comparison.

RULES:
- Markdown headings (## for main sections, ### for subsections). Plain text.
- Difficulty: ${difficulty}
- Do NOT include a quiz.
- Do NOT start with "In this module" or "Let's explore" — start with the opening rule above.
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

/** Split markdown by ## headings into sections so the curriculum structure is visible. */
function parseMarkdownSections(markdown: string): { heading: string; content: string }[] {
  const trimmed = markdown.trim()
  if (!trimmed) return [{ heading: '', content: '' }]
  const parts = trimmed.split(/\n(?=##\s+)/)
  return parts.map((block) => {
    const firstLine = block.indexOf('\n')
    const head = firstLine === -1 ? block : block.slice(0, firstLine)
    const body = firstLine === -1 ? '' : block.slice(firstLine + 1).trim()
    const isHeading = /^##\s+/.test(head)
    const heading = isHeading ? head.replace(/^##\s*/, '').trim() : ''
    const content = isHeading ? body : block.trim()
    return { heading, content }
  })
}

/** Entry/exit/sideCard envelope types matching content.ts. */
const ENTRY_TYPES = ['provocation', 'data-drop', 'scenario-fragment', 'contrarian-claim'] as const
const EXIT_TYPES = ['reflection', 'apply-24h', 'next-conflict-teaser', 'what-changed'] as const
const SIDE_NOTE_TYPES = ['wait-but-why', 'real-world', 'brain-moment', 'expert-voice', 'rabbit-hole'] as const

function buildEnvelopePrompt(
  moduleTitle: string,
  contentPreview: string,
  archetype: string
): { role: string; content: string }[] {
  const system = `You are an instructional designer. Given a learning module's title, its structural archetype, and a short preview of its content, produce a JSON object with optional entryState, exitState, and sideCard to make the lesson feel engaging and varied.

Return ONLY valid JSON (no markdown, no \`\`\`). Schema:
{
  "entryState": { "type": "provocation" | "data-drop" | "scenario-fragment" | "contrarian-claim", "content": "1-3 sentences that open the lesson" },
  "exitState": { "type": "reflection" | "apply-24h" | "next-conflict-teaser" | "what-changed", "content": "1-3 sentences that close the lesson" },
  "sideCard": { "title": "short label", "content": "2-4 sentences", "noteType": "wait-but-why" | "real-world" | "brain-moment" | "expert-voice" | "rabbit-hole" }
}

Rules:
- entryState: grab attention; no generic "In this module...". Match the archetype (e.g. cold-open → scenario-fragment or data-drop).
- exitState: leave the learner with a clear next step or reflection; avoid generic "You've learned...".
- sideCard: pick ONE noteType that fits the content. "wait-but-why" = anticipate objection; "real-world" = live example; "brain-moment" = metacognitive; "expert-voice" = attributed quote; "rabbit-hole" = go deeper.
- All content must be concise and engaging.`

  const user = `Module: "${moduleTitle}"
Archetype: ${archetype}
Content preview: ${contentPreview.slice(0, 600)}

Return JSON with entryState, exitState, and sideCard.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

function parseEnvelope(raw: string): {
  entryState?: { type: string; content: string }
  exitState?: { type: string; content: string }
  sideCard?: { title: string; content: string; tips?: string[]; noteType?: string }
} | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0]) as Record<string, unknown>
    const out: {
      entryState?: { type: string; content: string }
      exitState?: { type: string; content: string }
      sideCard?: { title: string; content: string; tips?: string[]; noteType?: string }
    } = {}
    const entry = parsed.entryState as { type?: string; content?: string } | undefined
    if (entry?.type && ENTRY_TYPES.includes(entry.type as (typeof ENTRY_TYPES)[number]) && typeof entry.content === 'string') {
      out.entryState = { type: entry.type, content: entry.content }
    }
    const exit = parsed.exitState as { type?: string; content?: string } | undefined
    if (exit?.type && EXIT_TYPES.includes(exit.type as (typeof EXIT_TYPES)[number]) && typeof exit.content === 'string') {
      out.exitState = { type: exit.type, content: exit.content }
    }
    const side = parsed.sideCard as { title?: string; content?: string; noteType?: string } | undefined
    if (side?.title && typeof side.content === 'string') {
      const noteType = side.noteType && SIDE_NOTE_TYPES.includes(side.noteType as (typeof SIDE_NOTE_TYPES)[number]) ? side.noteType : undefined
      out.sideCard = { title: side.title, content: side.content, noteType }
    }
    return out
  } catch {
    return null
  }
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configError = getChatConfigError()
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })

  const { course_id } = await request.json()
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const admin = createAdminClient()

  const { data: course, error: courseErr } = await admin
    .from('courses')
    .select('id, title, description, difficulty, created_by')
    .eq('id', course_id)
    .single()

  if (courseErr || !course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  if (course.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
    const raw = await callAI(planMessages, 2000)
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Curriculum plan response did not contain a JSON array')
    curriculum = JSON.parse(match[0]) as CurriculumEntry[]
    if (!Array.isArray(curriculum) || curriculum.length === 0) {
      throw new Error('Curriculum plan must be a non-empty array')
    }
    // Normalize archetype per module; ensure no two consecutive are the same
    let prevArchetype: LessonArchetype | null = null
    for (let i = 0; i < curriculum.length; i++) {
      const e = curriculum[i]
      const raw = e.archetype?.trim().toLowerCase()
      const valid = LESSON_ARCHETYPES.includes(raw as LessonArchetype)
        ? (raw as LessonArchetype)
        : selectArchetype(e.bloomLevel, e.pedagogicalRole ?? '', i, prevArchetype)
      e.archetype = valid
      prevArchetype = valid
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
      const content = await callAI(contentMessages, 1800)

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
      const selected = await selectComponentsForModule(mod.title, contentSummary, role)
      if (selected.length > 0) {
        interactiveElements = toInteractiveElements(selected, resolvedEntry.bloomLevel)
      }

      const parsedSections = parseMarkdownSections(content)
      const sections = parsedSections.map((sec, i) => ({
        heading: sec.heading,
        content: sec.content,
        type: 'text' as const,
        ...(i === 0 && imageResult ? { image: imageResult } : {}),
      }))

      let entryState: { type: string; content: string } | undefined
      let exitState: { type: string; content: string } | undefined
      let sideCard: { title: string; content: string; tips?: string[]; noteType?: string } | undefined
      try {
        const envelopeMessages = buildEnvelopePrompt(
          mod.title,
          content,
          (resolvedEntry.archetype ?? 'cold-open') as string
        )
        const envelopeRaw = await callAI(envelopeMessages, 800)
        const envelope = parseEnvelope(envelopeRaw)
        if (envelope) {
          entryState = envelope.entryState
          exitState = envelope.exitState
          sideCard = envelope.sideCard
        }
      } catch {
        // Envelope is optional; continue without entry/exit/sideCard
      }

      const richContent = {
        type: 'rich',
        archetype: (resolvedEntry.archetype ?? 'cold-open') as LessonArchetype,
        ...(entryState ? { entryState } : {}),
        ...(exitState ? { exitState } : {}),
        sections,
        ...(interactiveElements.length > 0 ? { interactiveElements } : {}),
        ...(sideCard ? { sideCard } : {}),
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
