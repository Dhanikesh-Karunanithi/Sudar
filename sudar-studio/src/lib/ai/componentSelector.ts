/**
 * Sudar Studio — Component effectiveness profiles for AI-powered component selection.
 * Used by generate-course and generate-all-modules to recommend interactive components per module.
 */

import type { RichInteractiveElement, QuizMode } from '@/types/content'
import { isUnverifiedOrBadVideoUrl } from '@/lib/media/videoSearch'

export type ComponentType =
  | 'timeline'
  | 'flipcard'
  | 'hotspot'
  | 'matching'
  | 'tabs'
  | 'quiz'
  | 'expandable'
  | 'flashcard'
  | 'video'
  | 'audio'

export type ModuleRole = 'intro' | 'core' | 'deep-dive' | 'assessment' | 'capstone'

export interface ComponentProfile {
  type: ComponentType
  /** When this component is most effective (learning context). */
  bestFor: string[]
  /** Bloom's taxonomy levels this component supports. */
  bloomLevels: string[]
  /** Short description for the LLM. */
  description: string
}

export const COMPONENT_PROFILES: ComponentProfile[] = [
  {
    type: 'timeline',
    bestFor: ['sequential processes', 'historical content', 'step-by-step procedures', 'chronology'],
    bloomLevels: ['Remember', 'Understand'],
    description: 'Step-by-step timeline; ideal for processes, history, or ordered stages.',
  },
  {
    type: 'flipcard',
    bestFor: ['vocabulary', 'definitions', 'key terms', 'memorization', 'recall'],
    bloomLevels: ['Remember'],
    description: 'Front/back cards for terms and definitions; supports spaced repetition.',
  },
  {
    type: 'hotspot',
    bestFor: ['visual explanation', 'diagrams', 'maps', 'identifying parts', 'spatial learning'],
    bloomLevels: ['Understand', 'Apply'],
    description: 'Clickable regions on an image to reveal labels or explanations.',
  },
  {
    type: 'matching',
    bestFor: ['vocabulary', 'definitions', 'concept pairing', 'categorization'],
    bloomLevels: ['Remember', 'Understand'],
    description: 'Drag-and-drop or select to match terms with definitions or pairs.',
  },
  {
    type: 'tabs',
    bestFor: ['comparing alternatives', 'multiple perspectives', 'grouped sub-topics', 'reducing clutter'],
    bloomLevels: ['Understand', 'Analyze'],
    description: 'Tabbed panels to compare or organize related content.',
  },
  {
    type: 'quiz',
    bestFor: ['checking understanding', 'formative assessment', 'recall', 'knowledge checks'],
    bloomLevels: ['Remember', 'Understand', 'Apply'],
    description: 'Multiple-choice question to reinforce or assess learning.',
  },
  {
    type: 'expandable',
    bestFor: ['optional detail', 'FAQs', 'deeper dives', 'progressive disclosure'],
    bloomLevels: ['Understand', 'Apply'],
    description: 'Collapsible section for extra detail or optional content.',
  },
  {
    type: 'flashcard',
    bestFor: ['recall', 'key facts', 'summaries', 'review'],
    bloomLevels: ['Remember'],
    description: 'Swipeable card deck for review and reinforcement.',
  },
  {
    type: 'video',
    bestFor: ['demonstrations', 'explanations', 'narrated content', 'visual learners'],
    bloomLevels: ['Understand', 'Apply'],
    description: 'Embedded video (YouTube, Vimeo, or direct URL).',
  },
  {
    type: 'audio',
    bestFor: ['podcasts', 'narration', 'accessibility', 'listening practice'],
    bloomLevels: ['Understand'],
    description: 'Audio player with optional transcript.',
  },
]

/** Build a prompt snippet describing available components for the LLM. */
export function buildComponentPromptSnippet(allowedTypes?: ComponentType[]): string {
  const list = allowedTypes?.length
    ? COMPONENT_PROFILES.filter((p) => allowedTypes.includes(p.type))
    : COMPONENT_PROFILES
  return list
    .map(
      (p) =>
        `- ${p.type}: ${p.description} Best for: ${p.bestFor.join(', ')}. Bloom: ${p.bloomLevels.join(', ')}.`
    )
    .join('\n')
}

import { chatCompletion } from './chat'

function extractJson(raw: string): string {
  let s = raw.trim()
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/m)
  if (fence) s = fence[1].trim()
  const openChar = s.startsWith('[') ? '[' : '{'
  const closeChar = openChar === '[' ? ']' : '}'
  if (!s.startsWith(openChar)) {
    const start = s.indexOf(openChar)
    if (start === -1) return s
    s = s.slice(start)
  }
  let depth = 0
  let inString: string | null = null
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (inString) {
      if (c === '\\') { i += 2; continue }
      if (c === inString) inString = null
      i++
      continue
    }
    if (c === '"' || c === "'") inString = c
    else if (c === openChar) depth++
    else if (c === closeChar) {
      depth--
      if (depth === 0) return s.slice(0, i + 1).replace(/,(\s*[}\]])/g, '$1')
    }
    i++
  }
  return s.replace(/,(\s*[}\]])/g, '$1')
}

export interface SelectedComponent {
  type: ComponentType
  data: Record<string, unknown>
}

export interface SelectComponentsOptions {
  /** Types the model must not use (e.g. recently used to force variety). */
  excludeTypes?: ComponentType[]
  /** When set, these types are removed from the available list entirely. */
  disallowedTypes?: ComponentType[]
  /**
   * When false, video is not offered and any video URL from the model is dropped later.
   * When true, do not invent video URLs — omit video or leave url empty (platform may fill from search).
   */
  allowVideoInPrompt?: boolean
  /** If provided, instructs the model it may only reference this URL for a video component. */
  verifiedVideoUrl?: string | null
  /** Optional chat context for org private AI keys. */
  chatContext?: import('@/lib/ai/chat').ChatCompletionContext
  /** Bloom level for this module — steers component choice. */
  bloomLevel?: string
  /** Lesson archetype — steers variety. */
  archetype?: string
  learningOutcomes?: string[]
  assessmentDensity?: 'light' | 'moderate' | 'heavy'
  interactivityLevel?: 'low' | 'balanced' | 'high'
  primaryPedagogy?: string
  /** Full module markdown — ground timelines/cards/quizzes in this text. */
  moduleFullText?: string
  /** Running counts of each type already placed in prior modules this course. */
  courseTypeCounts?: Partial<Record<ComponentType, number>>
  moduleIndex?: number
  totalModules?: number
}

/** Drop or fix video components: no hallucinated YouTube URLs. */
export function sanitizeVideoComponents(
  components: SelectedComponent[],
  opts: { verifiedWatchUrl: string | null; allowExternalVideo: boolean }
): SelectedComponent[] {
  let usedVerified = false
  const out: SelectedComponent[] = []
  for (const c of components) {
    if (c.type !== 'video') {
      out.push(c)
      continue
    }
    if (!opts.allowExternalVideo) continue
    const data = c.data && typeof c.data === 'object' ? { ...c.data } : {}
    const url = typeof data.url === 'string' ? data.url.trim() : ''
    if (opts.verifiedWatchUrl && !usedVerified) {
      data.url = opts.verifiedWatchUrl
      usedVerified = true
      out.push({ type: 'video', data })
      continue
    }
    if (url && !isUnverifiedOrBadVideoUrl(url)) {
      out.push({ type: 'video', data })
      continue
    }
    // Drop unverified / blocklisted / empty
  }
  return out
}

const COURSE_CAPS: Partial<Record<ComponentType, number>> = {
  timeline: 2,
  flipcard: 2,
}

function targetComponentCount(interactivity?: SelectComponentsOptions['interactivityLevel']): number {
  if (interactivity === 'low') return 1
  if (interactivity === 'high') return 3
  return 2
}

/** Drop components that would exceed per-course caps; ensure at least one remains when possible. */
export function applyCourseTypeCaps(
  components: SelectedComponent[],
  priorCounts: Partial<Record<ComponentType, number>>
): SelectedComponent[] {
  const local: Partial<Record<ComponentType, number>> = { ...priorCounts }
  const out: SelectedComponent[] = []
  for (const c of components) {
    const t = c.type as ComponentType
    const cap = COURSE_CAPS[t] ?? 99
    const next = (local[t] ?? 0) + 1
    if (next > cap) continue
    local[t] = next
    out.push(c)
  }
  return out
}

function minimalFallbackQuiz(moduleTitle: string): SelectedComponent {
  return {
    type: 'quiz',
    data: {
      question: `Which statement best reflects a key idea from "${moduleTitle}"?`,
      options: [
        'The concepts apply to real decisions, not abstract memorization.',
        'This topic is unrelated to workplace practice.',
        'Skipping practice is the fastest path to mastery.',
      ],
      correctAnswer: 0,
      explanation: 'Effective learning ties ideas to how you will use them.',
    },
  }
}

/** Call AI to select 1-3 interactive components for the module. Returns empty array on failure. */
export async function selectComponentsForModule(
  moduleTitle: string,
  contentSummary: string,
  moduleRole: ModuleRole,
  options?: SelectComponentsOptions
): Promise<SelectedComponent[]> {
  const exclude = new Set(options?.excludeTypes ?? [])
  const disallowed = new Set(options?.disallowedTypes ?? [])
  /** Default false when omitted — avoids offering video unless caller verified a URL. */
  const allowVideo = options?.allowVideoInPrompt === true
  const allTypes = COMPONENT_PROFILES.map((p) => p.type).filter((t) => !disallowed.has(t))
  const prior = options?.courseTypeCounts ?? {}
  const allowedTypes = allTypes.filter((t) => {
    if (t === 'video' && !allowVideo) return false
    if (exclude.has(t)) return false
    const cap = COURSE_CAPS[t as ComponentType]
    if (cap != null && (prior[t as ComponentType] ?? 0) >= cap) return false
    return true
  })
  if (allowedTypes.length === 0) {
    return [minimalFallbackQuiz(moduleTitle)]
  }

  const snippet = buildComponentPromptSnippet(allowedTypes)
  const videoRule = allowVideo
    ? options?.verifiedVideoUrl
      ? `If you include type "video", set data.url to exactly: "${options.verifiedVideoUrl}" and nothing else.`
      : `Do NOT include type "video" — there is no verified embed URL for this module.`
    : `Do NOT use type "video".`

  const varietyRule =
    exclude.size > 0
      ? `Do NOT use these types (already used in the last modules): ${[...exclude].join(', ')}. Pick different types.`
      : ''

  const countsHint = Object.entries(prior)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([k, n]) => `${k}:${n}`)
    .join(', ')
  const capHint =
    countsHint.length > 0
      ? `Components already used in prior modules in this course: ${countsHint}. Prefer types that are not overused. Do NOT add another timeline if timelines were already used twice. Do NOT add another flipcard if flipcards were already used twice.`
      : ''

  const bloom = options?.bloomLevel?.trim() ?? ''
  const arche = options?.archetype?.trim() ?? ''
  const bloomHint =
    bloom === 'Evaluate' || bloom === 'Create'
      ? 'This module is high on Bloom — prefer tabs, matching, scenario-style quiz, or case-like interactives over simple recall cards.'
      : bloom === 'Remember' || bloom === 'Understand'
        ? 'This module emphasizes understanding — flipcards, matching, or short quizzes are appropriate; avoid over-complex layouts unless the content demands it.'
        : ''

  const ped = options?.primaryPedagogy?.trim() ?? ''
  const pedHint =
    ped === 'procedural'
      ? 'Favor ordering/timeline, checklist-style expandables, or scenario quiz.'
      : ped === 'scenario'
        ? 'Favor quiz, tabs (alternatives), or matching — minimize abstract timelines unless the scenario is chronological.'
        : ped === 'declarative'
          ? 'Favor flipcards, matching, and short quizzes for definitions.'
          : ''

  const assess = options?.assessmentDensity ?? 'moderate'
  const assessHint =
    assess === 'light'
      ? 'Assessment density is LIGHT — include at most one short quiz or skip quiz in favor of a non-test interactive.'
      : assess === 'heavy'
        ? 'Assessment density is HEAVY — include a quiz and at least one other practice-oriented component if space allows.'
        : 'Assessment density is MODERATE — one knowledge check is enough.'

  const iLevel = options?.interactivityLevel ?? 'balanced'
  const maxComponents = targetComponentCount(iLevel)
  const ixHint =
    iLevel === 'low'
      ? 'Interactivity is LOW — return exactly ONE component.'
      : iLevel === 'high'
        ? 'Interactivity is HIGH — return three distinct, complementary components.'
        : `Return ${maxComponents} components unless the content clearly needs only one.`

  const outcomes = options?.learningOutcomes
  const outcomeHint =
    outcomes && outcomes.length > 0
      ? `Align interactives to these course outcomes:\n${outcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}`
      : ''

  const fullText = options?.moduleFullText?.trim() ?? ''
  const grounding =
    fullText.length > 0
      ? `FULL MODULE TEXT (ground timelines, flipcards, matching pairs, and quiz items in specific phrases and ideas from this text — do not invent unrelated examples):\n---\n${fullText.slice(0, 7000)}\n---`
      : `Content summary (module text not available — use this):\n${contentSummary.slice(0, 1200)}`

  const modIdx = options?.moduleIndex ?? 0
  const total = options?.totalModules ?? 1

  const systemPrompt = `You are an expert instructional designer. Choose interactive components that fit THIS module's cognitive level and the creator's settings — avoid defaulting every lesson to "timeline + flipcard + quiz". Vary formats across the course.

Available components:
${snippet}

${videoRule}
${varietyRule}
${capHint}

Module context:
- Bloom level: ${bloom || 'not specified'}
- Structural archetype: ${arche || 'not specified'}
- Module index: ${modIdx + 1} of ${total}
${bloomHint}
${pedHint}
${assessHint}
${ixHint}
${outcomeHint}

Return format: { "components": [ { "type": "<component type>", "data": { ... } }, ... ] }
For each component, populate "data" with the full structure (timeline: "steps": [{ "title", "description" }]; flipcard: "cards": [{ "front", "back" }]; quiz: "question", "options" (array of strings), "correctAnswer" (0-based index), "explanation"; matching: "pairs": [{ "left", "right" }]; tabs: "tabs": [{ "label", "content" }]; etc.).
For video data use shape { "url": string, "title"?: string } only when video is allowed and a verified URL was provided above.`

  const userPrompt = `Module title: "${moduleTitle}"
Module role: ${moduleRole}

${grounding}

Return JSON with "components" only. Max ${maxComponents} components. Only use allowed types.`

  try {
    const { content: text } = await chatCompletion(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2200,
        temperature: 0.62,
      },
      options?.chatContext
    )
    if (!text) return []
    const jsonStr = extractJson(text)
    const parsed = JSON.parse(jsonStr) as { components?: SelectedComponent[] }
    let components = Array.isArray(parsed.components) ? parsed.components : []
    components = components
      .filter((c) => c && c.type && typeof c.data === 'object')
      .filter((c) => allowedTypes.includes(c.type as ComponentType))
      .slice(0, maxComponents)

    components = applyCourseTypeCaps(components, prior)

    if (assess === 'light') {
      components = components.filter((c, i) => !(c.type === 'quiz' && i > 0))
      if (components.length > 1) {
        const quizzes = components.filter((c) => c.type === 'quiz')
        if (quizzes.length > 1) {
          const firstQuiz = components.findIndex((c) => c.type === 'quiz')
          components = components.filter((c, idx) => c.type !== 'quiz' || idx === firstQuiz)
        }
      }
    }

    if (components.length === 0) {
      components = [minimalFallbackQuiz(moduleTitle)]
    }

    return components
  } catch {
    return [minimalFallbackQuiz(moduleTitle)]
  }
}

/** Suggest quiz mode from Bloom's level: Apply → scenario-fork, Remember → predict-then-learn, etc. */
export function getSuggestedQuizMode(bloomLevel: string): QuizMode {
  const level = bloomLevel.trim()
  if (level === 'Apply') return 'scenario-fork'
  if (level === 'Remember') return 'predict-then-learn'
  if (level === 'Understand') return 'confidence-tagged'
  if (level === 'Evaluate' || level === 'Analyze') return 'peer-contrast'
  return 'standard'
}

/** Convert SelectedComponent[] to RichInteractiveElement[]. Optionally set quizMode for quiz elements from bloomLevel. */
export function toInteractiveElements(components: SelectedComponent[], bloomLevel?: string): RichInteractiveElement[] {
  return components.map((c) => {
    const el: RichInteractiveElement = { type: c.type as RichInteractiveElement['type'], data: c.data }
    if (c.type === 'quiz' && bloomLevel) {
      el.quizMode = getSuggestedQuizMode(bloomLevel)
    }
    return el
  })
}
