import { LESSON_ARCHETYPES, selectArchetype, type LessonArchetype } from '@/lib/ai/archetypeSelector'
import type { CurriculumEntry } from './types'

/** Varied section headings so index-based fallbacks never share one static four-part template. */
const FALLBACK_SECTION_SETS: string[][] = [
  ['Why this matters now', 'Foundations', 'Apply in practice', 'Key takeaways'],
  ['Objectives', 'Core concepts', 'Walkthrough', 'What changes for you'],
  ['The situation', 'What the research says', 'Trade-offs', 'Your decision'],
  ['Setup', 'Deep dive', 'Common pitfalls', 'Next steps'],
  ['Context', 'Key ideas', 'Worked example', 'Check your understanding'],
  ['Framing the problem', 'Essential definitions', 'Scenario', 'Summary'],
]

function bloomForIndex(i: number, total: number): string {
  if (total <= 1) return 'Understand'
  const p = i / Math.max(1, total - 1)
  if (p < 0.15) return 'Remember'
  if (p < 0.35) return 'Understand'
  if (p < 0.55) return 'Apply'
  if (p < 0.75) return 'Analyze'
  if (p < 0.9) return 'Evaluate'
  return 'Create'
}

function roleForIndex(i: number, total: number): string {
  if (i === 0) return 'Foundation / orientation'
  if (i === total - 1) return 'Synthesis / capstone'
  if (i <= Math.floor(total / 3)) return 'Concept exploration'
  if (i >= total - 2) return 'Analysis and critical thinking'
  return 'Practical application'
}

/**
 * When the AI plan is missing or short, build a distinct entry per module index.
 */
export function perIndexFallbackEntry(
  modIndex: number,
  total: number,
  title: string,
  priorModuleTitle: string | null,
  previousArchetype: LessonArchetype | null
): CurriculumEntry {
  const bloomLevel = bloomForIndex(modIndex, total)
  const pedagogicalRole = roleForIndex(modIndex, total)
  const archetype = selectArchetype(bloomLevel, pedagogicalRole, modIndex, previousArchetype)
  const sectionStructure = [...FALLBACK_SECTION_SETS[modIndex % FALLBACK_SECTION_SETS.length]]
  const buildOn =
    priorModuleTitle == null
      ? 'None — this is the foundation'
      : `Builds on concepts from "${priorModuleTitle}"`

  return {
    title,
    bloomLevel,
    pedagogicalRole,
    sectionStructure,
    brief: `Develops "${title}" as part of the course sequence (${bloomLevel} level).`,
    buildOn,
    archetype,
  }
}

/**
 * Aligns the AI curriculum array to DB module order: one entry per module, canonical titles from the course.
 * Pads with per-index fallbacks; trims excess; preserves AI fields when present.
 */
export function normalizeCurriculumToModules(
  curriculum: CurriculumEntry[],
  moduleTitles: string[]
): CurriculumEntry[] {
  const n = moduleTitles.length
  if (n === 0) return []

  const out: CurriculumEntry[] = []
  let prevArchetype: LessonArchetype | null = null

  for (let i = 0; i < n; i++) {
    const title = moduleTitles[i]
    const ai = curriculum[i]
    const priorTitle = i > 0 ? moduleTitles[i - 1] : null

    if (ai && typeof ai === 'object') {
      const ar = ai.archetype?.trim().toLowerCase()
      const validArchetype: LessonArchetype = LESSON_ARCHETYPES.includes(ar as LessonArchetype)
        ? (ar as LessonArchetype)
        : selectArchetype(ai.bloomLevel ?? bloomForIndex(i, n), ai.pedagogicalRole ?? '', i, prevArchetype)

      out.push({
        ...ai,
        title,
        bloomLevel: (ai.bloomLevel ?? bloomForIndex(i, n)).trim(),
        pedagogicalRole: ai.pedagogicalRole ?? roleForIndex(i, n),
        sectionStructure:
          Array.isArray(ai.sectionStructure) && ai.sectionStructure.length > 0
            ? [...ai.sectionStructure]
            : perIndexFallbackEntry(i, n, title, priorTitle, prevArchetype).sectionStructure,
        brief: ai.brief?.trim() || `Covers ${title} within the course curriculum.`,
        buildOn: ai.buildOn?.trim() || (priorTitle ? `Builds on "${priorTitle}"` : 'None — this is the foundation'),
        archetype: validArchetype,
      })
      prevArchetype = validArchetype
    } else {
      const fb = perIndexFallbackEntry(i, n, title, priorTitle, prevArchetype)
      out.push(fb)
      prevArchetype = (fb.archetype ?? 'cold-open') as LessonArchetype
    }
  }

  return out
}
