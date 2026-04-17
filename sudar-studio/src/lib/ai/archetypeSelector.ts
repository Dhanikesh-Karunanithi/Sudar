/**
 * Sudar Studio — Lesson structural archetypes for content variability.
 * Used by generate-all-modules to assign a distinct structural pattern per module
 * so lessons feel varied rather than formulaic.
 */

export const LESSON_ARCHETYPES = [
  'cold-open',
  'socratic',
  'misconception-trap',
  'case-file',
  'comparison-engine',
] as const

export type LessonArchetype = (typeof LESSON_ARCHETYPES)[number]

export interface ArchetypeDescriptor {
  slug: LessonArchetype
  label: string
  /** Bloom's levels this archetype fits best. */
  bloomFit: string[]
  /** Preferred pedagogical roles. */
  roleFit: string[]
}

export const ARCHETYPE_DESCRIPTORS: Record<LessonArchetype, ArchetypeDescriptor> = {
  'cold-open': {
    slug: 'cold-open',
    label: 'Cold Open',
    bloomFit: ['Apply', 'Analyze'],
    roleFit: ['Practical application', 'Analysis and critical thinking'],
  },
  socratic: {
    slug: 'socratic',
    label: 'Socratic Path',
    bloomFit: ['Understand', 'Analyze'],
    roleFit: ['Concept deep-dive', 'Foundation / orientation'],
  },
  'misconception-trap': {
    slug: 'misconception-trap',
    label: 'Misconception Trap',
    bloomFit: ['Understand', 'Evaluate'],
    roleFit: ['Concept deep-dive', 'Analysis and critical thinking'],
  },
  'case-file': {
    slug: 'case-file',
    label: 'Case File',
    bloomFit: ['Apply', 'Analyze', 'Evaluate'],
    roleFit: ['Practical application', 'Synthesis / capstone'],
  },
  'comparison-engine': {
    slug: 'comparison-engine',
    label: 'Comparison Engine',
    bloomFit: ['Understand', 'Analyze'],
    roleFit: ['Concept deep-dive', 'Analysis and critical thinking'],
  },
}

/**
 * Select an archetype for a module given curriculum context.
 * Prefers archetypes that fit the module's Bloom level and role,
 * and avoids repeating the previous module's archetype.
 */
export function selectArchetype(
  bloomLevel: string,
  moduleRole: string,
  _moduleIndex: number,
  previousArchetype: LessonArchetype | null
): LessonArchetype {
  const roleLower = moduleRole.toLowerCase()
  const bloom = bloomLevel.trim()

  const scored = LESSON_ARCHETYPES.map((slug) => {
    const desc = ARCHETYPE_DESCRIPTORS[slug]
    let score = 0
    if (desc.bloomFit.includes(bloom)) score += 2
    if (desc.roleFit.some((r) => roleLower.includes(r.toLowerCase().slice(0, 8)))) score += 1
    if (slug === previousArchetype) score -= 10
    return { slug, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0].score > -10 ? scored[0].slug : scored.find((s) => s.slug !== previousArchetype)?.slug ?? scored[0].slug
}

/** Entry state types for lesson openers (replace generic introduction). */
export const ENTRY_STATE_TYPES = ['provocation', 'data-drop', 'scenario-fragment', 'contrarian-claim'] as const
export type EntryStateType = (typeof ENTRY_STATE_TYPES)[number]

/** Exit state types for lesson closers (replace generic summary). */
export const EXIT_STATE_TYPES = ['reflection', 'apply-24h', 'next-conflict-teaser', 'what-changed'] as const
export type ExitStateType = (typeof EXIT_STATE_TYPES)[number]

/** Suggested entry/exit types per archetype for prompt hints. */
export function getEntryExitHints(archetype: LessonArchetype): { entry: EntryStateType[]; exit: ExitStateType[] } {
  switch (archetype) {
    case 'cold-open':
      return { entry: ['scenario-fragment', 'data-drop'], exit: ['reflection', 'apply-24h'] }
    case 'socratic':
      return { entry: ['provocation'], exit: ['reflection', 'what-changed'] }
    case 'misconception-trap':
      return { entry: ['contrarian-claim'], exit: ['what-changed', 'reflection'] }
    case 'case-file':
      return { entry: ['scenario-fragment', 'data-drop'], exit: ['apply-24h', 'reflection'] }
    case 'comparison-engine':
      return { entry: ['contrarian-claim', 'provocation'], exit: ['what-changed', 'next-conflict-teaser'] }
    default:
      return { entry: ['provocation'], exit: ['reflection'] }
  }
}

/** One-paragraph structural rule for the given archetype to inject into module content prompts. */
export function getArchetypeStructuralRule(archetype: LessonArchetype): string {
  switch (archetype) {
    case 'cold-open':
      return 'COLD OPEN: Do not start with context or explanation. Drop the learner into a concrete scenario, problem, or situation in the first paragraph. Let the tension or question sit before you explain. Then use the section headings to unpack and resolve.'
    case 'socratic':
      return 'SOCRATIC PATH: Structure the lesson as a series of questions that lead the learner to the conclusion. Each section can open with a question; the body of the section answers it and leads to the next question. The learner should feel they are discovering, not being told.'
    case 'misconception-trap':
      return 'MISCONCEPTION TRAP: Open the first section by stating a commonly believed wrong idea as if it were true. Build brief tension or plausibility. Then in the next section dismantle it clearly and replace it with the correct understanding. Do not meta-comment ("Many people think…"); present the myth then the correction.'
    case 'case-file':
      return 'CASE FILE: Anchor the entire module to one real-world case, scenario, or example. Every section should refer back to that same case—dissecting a different aspect, decision, or consequence. The learner should leave feeling they have fully analyzed one concrete situation.'
    case 'comparison-engine':
      return 'COMPARISON ENGINE: The concept only exists in contrast. Structure the content around comparing two alternatives (e.g. X vs Y, before vs after, myth vs reality). Use the section headings to explore each side and the tension between them; avoid explaining the concept in isolation.'
    default:
      return 'Vary your structure: avoid starting with "In this module..." or a generic summary. Start with something concrete—a question, a scenario, or a striking claim.'
  }
}
