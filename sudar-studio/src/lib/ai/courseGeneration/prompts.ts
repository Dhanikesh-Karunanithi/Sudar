import { LESSON_ARCHETYPES, type LessonArchetype, getArchetypeStructuralRule } from '@/lib/ai/archetypeSelector'
import type { AiGenerationCourseSettings, CurriculumEntry } from './types'
import { getSMEConfig, buildSMEContextPrompt } from './smeContexts'
import {
  getIntroductionStrategy,
  getIntroductionStrategyPromptBlock,
  inferCourseTypeFromSettings,
} from './introductionStrategies'

function formatGenSettingsBlock(s: AiGenerationCourseSettings | undefined): string {
  if (!s) return ''
  const parts: string[] = []
  if (s.target_audience?.trim()) parts.push(`Target audience: ${s.target_audience.trim()}`)
  if (s.industry?.trim()) parts.push(`Industry / context: ${s.industry.trim()}`)
  if (s.tone?.trim()) parts.push(`Tone: ${s.tone.trim()}`)
  if (Array.isArray(s.learning_outcomes) && s.learning_outcomes.length > 0) {
    parts.push(`Learning outcomes (align modules and assessments to these):\n${s.learning_outcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}`)
  }
  if (s.primary_pedagogy) {
    parts.push(
      `Primary pedagogy: ${s.primary_pedagogy} — declarative = facts/concepts; procedural = how-to and steps; scenario = cases and decisions; mixed = balance as appropriate.`
    )
  }
  if (s.assessment_density) {
    parts.push(
      `Assessment density: ${s.assessment_density} — light = fewer checks; moderate = regular knowledge checks; heavy = frequent practice and checks.`
    )
  }
  if (s.interactivity_level) {
    parts.push(
      `Interactivity level: ${s.interactivity_level} — low = mostly reading; balanced = mix of interactives; high = rich practice (tabs, matching, scenarios, etc.).`
    )
  }
  if (Array.isArray(s.forbidden_component_types) && s.forbidden_component_types.length > 0) {
    parts.push(`Avoid these interactive formats unless impossible: ${s.forbidden_component_types.join(', ')}.`)
  }
  if (parts.length === 0) return ''
  return `\n\nCREATOR CONTEXT:\n${parts.join('\n')}\n`
}

export function buildCurriculumPlanPrompt(
  courseTitle: string,
  description: string | null,
  difficulty: string,
  moduleTitles: string[],
  gen?: AiGenerationCourseSettings,
  options?: { courseType?: string }
) {
  const ctx = formatGenSettingsBlock(gen)
  const courseType =
    options?.courseType ??
    inferCourseTypeFromSettings(gen?.course_type, gen?.industry, courseTitle)
  const smeContext = buildSMEContextPrompt(getSMEConfig(courseType))
  const system = `You are a senior instructional designer at Harvard's Bok Center for Teaching and Learning. Your speciality is designing curriculum that scaffolds from foundational knowledge to higher-order thinking using Bloom's Revised Taxonomy and Gagné's Nine Events of Instruction.

Design a curriculum plan for a corporate training course. The module titles are already defined — your job is to assign each module a UNIQUE pedagogical role, Bloom's taxonomy level, section structure, brief, and a structural archetype.
${ctx}
${smeContext}
Rules:
- The JSON array MUST have exactly as many entries as there are module titles, in the SAME ORDER (index 0 = first module, etc.).
- For each entry, "title" MUST be EXACTLY the corresponding string from the module list — copy it character-for-character including punctuation and spacing. Do not paraphrase titles.
- Bloom's levels should PROGRESS across modules (early modules: Remember/Understand, middle: Apply/Analyze, later: Evaluate/Create).
- Each module MUST have a DIFFERENT sectionStructure array. Do NOT give every module the same headings. Tailor sections to the module's role.
- Assign exactly one "archetype" per module from this list: ${LESSON_ARCHETYPES.join(', ')}. Do NOT use the same archetype for two consecutive modules.
- "buildOn" for the first module should be "None — this is the foundation".
- Return ONLY a valid JSON array. No markdown, no explanation, no preamble.

JSON schema for each entry:
{
  "title": "exact module title (must match the provided list entry exactly)",
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
  options?: { documentGrounding?: string; gen?: AiGenerationCourseSettings; courseType?: string }
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
  
  const courseType =
    options?.courseType ??
    inferCourseTypeFromSettings(options?.gen?.course_type, options?.gen?.industry, courseTitle)
  const smeContext = buildSMEContextPrompt(getSMEConfig(courseType))
  const introApproach =
    options?.gen?.vary_introductions !== false
      ? getIntroductionStrategy(courseType, moduleIndex)
      : getIntroductionStrategy(courseType, moduleIndex)
  const introBlock = getIntroductionStrategyPromptBlock(introApproach, entry.title, courseType)
  const density = options?.gen?.content_density ?? 'balanced'
  const wordTarget =
    density === 'concise' ? '400–550' : density === 'detailed' ? '700–950' : '500–800'

  const system = `You are an expert instructional designer writing module ${moduleIndex + 1} of ${totalModules} for the course "${courseTitle}".
${creatorCtx}
${smeContext}
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

PERSONALIZATION MARKERS (Sudar Learn renders these as callouts — use sparingly):
- Wrap each learning objective (max 2 per module) in [objective]...[/objective]
- [concept:Name]...[/concept]: MAX 2 per entire module. Only for non-obvious terms with a real definition (20+ words inside the tag). NEVER wrap a single vocabulary word with no explanation. NEVER split a sentence by inserting a concept box between clauses — write full sentences in normal prose; use bullets for lists of terms.
- Wrap application exercises in [apply]...[/apply] (max 2 per module)

MODULE OPENING (first paragraph — must differ from other modules in this course):
${introBlock}

BANNED OPENINGS (never use):
- "You're tasked with creating a simple calculator program..."
- "You've just been handed a critical project to build an e-commerce platform..."
- Generic homework assignments or "you're stuck" framing
- Repeating the same scenario device used in sibling modules

OPENING RULE (align archetype with the MODULE OPENING above; do not contradict it):
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
- Target length: ${wordTarget} words.
- Use tables (markdown | col | col |) when comparing 3+ items; use ### subheads for pacing.
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
  archetype: string,
  options?: { minimizeSideCard?: boolean; moduleOpeningPreview?: string }
): { role: string; content: string }[] {
  const minimize = options?.minimizeSideCard !== false
  const system = `You are an instructional designer. Given a learning module's title, its structural archetype, and a preview of its content, produce a JSON object with optional entryState, exitState, and sideCard.

Return ONLY valid JSON (no markdown, no \`\`\`). Schema:
{
  "entryState": { "type": "provocation" | "data-drop" | "scenario-fragment" | "contrarian-claim", "content": "1-2 sentences" } | null,
  "exitState": { "type": "reflection" | "apply-24h" | "next-conflict-teaser" | "what-changed", "content": "1-3 sentences" },
  "sideCard": { "title": "short label", "content": "2-4 sentences", "noteType": "wait-but-why" | "real-world" | "brain-moment" | "expert-voice" | "rabbit-hole", "visibility": "hidden" | "floating" | "visible" } | null
}

Rules:
- entryState: OPTIONAL. Use only if it adds a hook DIFFERENT from the module's first paragraph. If the preview already opens with a strong hook, set entryState to null. Never duplicate calculator/e-commerce/critical-project scenarios. No "In this module...".
- exitState: required — actionable reflection or next step.
- sideCard: ${minimize ? 'DEFAULT null. Only include if there is essential context NOT already in the module body (rare). When included, set visibility to "hidden" (learner taps a hotspot to reveal).' : 'Include only when it adds unique context; prefer visibility "hidden".'}
- Banned in all fields: calculator program tropes, duplicate scenario from module opening.
- All content concise.`

  const user = `Module: "${moduleTitle}"
Archetype: ${archetype}
Module opening (do not repeat in entryState): ${(options?.moduleOpeningPreview ?? contentPreview).slice(0, 350)}
Content preview: ${contentPreview.slice(0, 600)}

Return JSON. Prefer null entryState and null sideCard unless clearly justified.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

/** Optional second pass for capstone modules: tighten alignment to outcomes and remove generic phrasing. */
export function buildCritiqueRefinePrompt(
  courseTitle: string,
  moduleTitle: string,
  learningOutcomes: string[] | undefined,
  draftMarkdown: string
): { role: string; content: string }[] {
  const outcomesBlock =
    Array.isArray(learningOutcomes) && learningOutcomes.length > 0
      ? `Course learning outcomes:\n${learningOutcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}`
      : 'No explicit outcomes list — strengthen clarity and actionable takeaways anyway.'

  const system = `You are a strict instructional editor. Revise the module markdown so it clearly supports the course outcomes, removes filler and generic phrases ("In this module", "It is important to"), and keeps all ## / ### headings and personalization markers ([objective], [concept:Name], [apply]) intact or improved. Preserve markdown structure. Return ONLY the revised full module text — no preamble.`

  const user = `Course: "${courseTitle}"
Module: "${moduleTitle}"
${outcomesBlock}

--- DRAFT ---
${draftMarkdown.slice(0, 12000)}`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

export { ENTRY_TYPES, EXIT_TYPES, SIDE_NOTE_TYPES }
