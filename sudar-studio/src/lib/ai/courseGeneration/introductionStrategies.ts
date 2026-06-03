/**
 * Domain-specific introduction strategies — vary module openers across a course.
 */

export type IntroductionApproach =
  | 'problem-first'
  | 'concept-first'
  | 'code-first'
  | 'market-reality'
  | 'framework-first'
  | 'story-case'
  | 'question-first'
  | 'dataset-first'
  | 'insight-first'
  | 'compliance-hook'
  | 'skill-moment'

const DOMAIN_STRATEGIES: Record<string, IntroductionApproach[]> = {
  programming: ['problem-first', 'concept-first', 'code-first'],
  'product strategy': ['market-reality', 'framework-first', 'story-case'],
  'data science': ['question-first', 'dataset-first', 'insight-first'],
  compliance: ['compliance-hook', 'story-case', 'problem-first'],
  'soft skills': ['skill-moment', 'story-case', 'question-first'],
}

const DEFAULT_STRATEGIES: IntroductionApproach[] = [
  'question-first',
  'concept-first',
  'story-case',
]

/** Banned generic scenario hooks — regeneration should avoid these. */
export const BANNED_OPENING_PATTERNS = [
  /simple calculator program/i,
  /creating a (simple )?calculator/i,
  /you'?re tasked with creating/i,
  /you'?ve just been handed a critical project/i,
  /designing the core components of an e-commerce platform/i,
  /you'?re stuck\s*[-—]/i,
  /in this module,?\s+we will/i,
  /let'?s explore/i,
]

export function inferCourseTypeFromSettings(
  courseType?: string | null,
  industry?: string | null,
  title?: string | null
): string {
  if (courseType?.trim()) return courseType.trim().toLowerCase()
  const hay = `${industry ?? ''} ${title ?? ''}`.toLowerCase()
  if (/program|software|developer|coding|python|javascript|react|api/.test(hay)) return 'programming'
  if (/product|strategy|roadmap|pm\b|growth/.test(hay)) return 'product strategy'
  if (/data science|machine learning|analytics|ml\b|statistics/.test(hay)) return 'data science'
  if (/compliance|regulation|gdpr|hipaa|policy/.test(hay)) return 'compliance'
  if (/leadership|communication|soft skill|teamwork|emotional/.test(hay)) return 'soft skills'
  return 'general'
}

export function getIntroductionStrategy(courseType: string, moduleIndex: number): IntroductionApproach {
  const key = courseType.toLowerCase()
  const pool =
    DOMAIN_STRATEGIES[key] ??
    DOMAIN_STRATEGIES[key.replace(/_/g, ' ')] ??
    DEFAULT_STRATEGIES
  return pool[moduleIndex % pool.length]!
}

export function getIntroductionStrategyPromptBlock(
  approach: IntroductionApproach,
  moduleTitle: string,
  courseType: string
): string {
  const blocks: Record<IntroductionApproach, string> = {
    'problem-first': `OPENING (Problem-First): Start with a specific, realistic bug, failure, or constraint a professional would face related to "${moduleTitle}". Name the stakes (time, users, money). Do NOT use a toy "build a calculator" homework scenario. No "you're tasked with creating..." framing.`,
    'concept-first': `OPENING (Concept-First): Open with a crisp definition or mental model for the core idea in "${moduleTitle}", then immediately show why it matters in ${courseType} work. Use a striking comparison or metaphor — not a fictional assignment.`,
    'code-first': `OPENING (Code-First): Show a short, real code snippet (6–15 lines) that demonstrates the idea in "${moduleTitle}". Briefly narrate what it does before unpacking it. Use plausible production-style code, not a hello-world calculator.`,
    'market-reality': `OPENING (Market-Reality): Lead with a concrete market stat, user behavior shift, or competitive move relevant to "${moduleTitle}". Cite a plausible company or trend (no generic "imagine you're building an app").`,
    'framework-first': `OPENING (Framework-First): Introduce a named framework or model (e.g. JTBD, RICE, OKRs) as the lens for "${moduleTitle}". Explain when teams use it — not a generic project brief.`,
    'story-case': `OPENING (Story-Case): Open with a 2–3 sentence mini case about a real company decision related to "${moduleTitle}". Use a company learners know; avoid repeating the same case across modules.`,
    'question-first': `OPENING (Question-First): Pose one sharp, answerable question that "${moduleTitle}" resolves. The rest of the module answers it — no staged homework scenario.`,
    'dataset-first': `OPENING (Dataset-First): Describe a dataset or measurement situation (columns, noise, goal) that motivates "${moduleTitle}". No calculator or e-commerce build exercises.`,
    'insight-first': `OPENING (Insight-First): Lead with a counter-intuitive finding or result from practice, then explain how "${moduleTitle}" explains it.`,
    'compliance-hook': `OPENING (Compliance-Hook): Start with a concrete risk, audit finding, or regulatory trigger relevant to "${moduleTitle}". Ground in real obligations — not a generic IT project.`,
    'skill-moment': `OPENING (Skill-Moment): Describe a high-stakes interpersonal or leadership moment where "${moduleTitle}" skills decide the outcome. Avoid "you've been handed a project" tropes.`,
  }
  return blocks[approach]
}

export function contentHasBannedOpening(text: string): boolean {
  const head = text.slice(0, 800)
  return BANNED_OPENING_PATTERNS.some((p) => p.test(head))
}

export function contentHasGenericScenarioDuplication(entryContent: string | undefined, body: string): boolean {
  if (!entryContent?.trim()) return false
  const a = entryContent.slice(0, 120).toLowerCase().replace(/\s+/g, ' ')
  const b = body.slice(0, 400).toLowerCase().replace(/\s+/g, ' ')
  if (a.length < 40) return false
  const words = a.split(' ').filter((w) => w.length > 4)
  const overlap = words.filter((w) => b.includes(w)).length
  return overlap >= Math.min(6, words.length * 0.5)
}
