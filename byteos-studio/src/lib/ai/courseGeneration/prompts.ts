import { LESSON_ARCHETYPES, type LessonArchetype, getArchetypeStructuralRule } from '@/lib/ai/archetypeSelector'
import type { AiGenerationCourseSettings, CurriculumEntry } from './types'

function formatGenSettingsBlock(s: AiGenerationCourseSettings | undefined): string {
  if (!s) return ''
  const parts: string[] = []
  if (s.target_audience?.trim()) parts.push(`Target audience: ${s.target_audience.trim()}`)
  if (s.industry?.trim()) parts.push(`Industry / context: ${s.industry.trim()}`)
  if (s.tone?.trim()) parts.push(`Tone: ${s.tone.trim()}`)
  if (Array.isArray(s.learning_outcomes) && s.learning_outcomes.length > 0) {
    parts.push(`Learning outcomes (align modules and assessments to these):\n${s.learning_outcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}`)
  }
  if (parts.length === 0) return ''
  return `\n\nCREATOR CONTEXT:\n${parts.join('\n')}\n`
}

export function buildCurriculumPlanPrompt(
  courseTitle: string,
  description: string | null,
  difficulty: string,
  moduleTitles: string[],
  gen?: AiGenerationCourseSettings
) {
  const ctx = formatGenSettingsBlock(gen)
  const system = `You are a senior instructional designer at Harvard's Bok Center for Teaching and Learning. Your speciality is designing curriculum that scaffolds from foundational knowledge to higher-order thinking using Bloom's Revised Taxonomy and Gagné's Nine Events of Instruction.

Design a curriculum plan for a corporate training course. The module titles are already defined — your job is to assign each module a UNIQUE pedagogical role, Bloom's taxonomy level, section structure, brief, and a structural archetype.
${ctx}
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

export function buildModuleContentPrompt(
  courseTitle: string,
  description: string | null,
  difficulty: string,
  entry: CurriculumEntry,
  moduleIndex: number,
  totalModules: number,
  fullSyllabus: CurriculumEntry[],
  priorSummaries: { title: string; summary: string }[],
  options?: { documentGrounding?: string; gen?: AiGenerationCourseSettings }
) {
  const syllabusOverview = fullSyllabus
    .map((e, i) => `${i + 1}. "${e.title}" — ${e.pedagogicalRole} (${e.bloomLevel})`)
    .join('\n')

  const priorContext = priorSummaries.length > 0
    ? priorSummaries.map((p) => `- "${p.title}": ${p.summary}`).join('\n')
    : 'None — this is the first module.'

  const sections = entry.sectionStructure.map((s) => `"## ${s}"`).join(', ')
  const grounding = options?.documentGrounding?.trim()
  const groundingBlock = grounding
    ? `

DOCUMENT GROUNDING (mandatory — this course was built from a source document):
Use ONLY the following excerpt as your factual source. Do not invent facts, statistics, names, or claims that are not supported by this text. Paraphrase and teach from this material. If something is not in the excerpt, omit it or say it was not covered in the source.

--- BEGIN EXCERPT ---
${grounding}
--- END EXCERPT ---
`
    : ''

  const creatorCtx = formatGenSettingsBlock(options?.gen)

  const system = `You are an expert instructional designer writing module ${moduleIndex + 1} of ${totalModules} for the course "${courseTitle}".
${creatorCtx}
CURRICULUM CONTEXT:
${syllabusOverview}

THIS MODULE:
- Title: "${entry.title}"
- Pedagogical role: ${entry.pedagogicalRole}
- Bloom's taxonomy level: ${entry.bloomLevel}
- Brief: ${entry.brief}
- Builds on: ${entry.buildOn}
- Structural archetype: ${(entry.archetype ?? 'cold-open') as string}
${groundingBlock}
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

const ENTRY_TYPES = ['provocation', 'data-drop', 'scenario-fragment', 'contrarian-claim'] as const
const EXIT_TYPES = ['reflection', 'apply-24h', 'next-conflict-teaser', 'what-changed'] as const
const SIDE_NOTE_TYPES = ['wait-but-why', 'real-world', 'brain-moment', 'expert-voice', 'rabbit-hole'] as const

export function buildEnvelopePrompt(
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

export { ENTRY_TYPES, EXIT_TYPES, SIDE_NOTE_TYPES }
