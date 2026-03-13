/**
 * ByteOS Studio — Component effectiveness profiles for AI-powered component selection.
 * Used by generate-course and generate-all-modules to recommend interactive components per module.
 */

import type { RichInteractiveElement, QuizMode } from '@/types/content'

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
export function buildComponentPromptSnippet(): string {
  return COMPONENT_PROFILES.map(
    (p) =>
      `- ${p.type}: ${p.description} Best for: ${p.bestFor.join(', ')}. Bloom: ${p.bloomLevels.join(', ')}.`
  ).join('\n')
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

/** Call AI to select 1-3 interactive components for the module. Returns empty array on failure. */
export async function selectComponentsForModule(
  moduleTitle: string,
  contentSummary: string,
  moduleRole: ModuleRole
): Promise<SelectedComponent[]> {
  const snippet = buildComponentPromptSnippet()
  const systemPrompt = `You are an expert instructional designer. Given a module's title, content summary, and role in the course, select 1-3 interactive components that would be most effective for learning. Return ONLY valid JSON. No markdown, no explanation.

Available components:
${snippet}

Return format: { "components": [ { "type": "<component type>", "data": { ... } }, ... ] }
For each component, populate "data" with the full structure needed by that type (e.g. timeline needs "steps": [{ "title", "description" }], quiz needs "question", "options", "correctAnswer", "explanation"). Generate realistic, concise content that fits the module.`

  const userPrompt = `Module title: "${moduleTitle}"
Module role: ${moduleRole}
Content summary: ${contentSummary.slice(0, 500)}

Return JSON with 1-3 components (use "components" array). Only use types from the list. Generate full "data" for each.`

  try {
    const { content: text } = await chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.5,
    })
    if (!text) return []
    const jsonStr = extractJson(text)
    const parsed = JSON.parse(jsonStr) as { components?: SelectedComponent[] }
    const components = Array.isArray(parsed.components) ? parsed.components : []
    return components.filter((c) => c && c.type && typeof c.data === 'object').slice(0, 3)
  } catch {
    return []
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
