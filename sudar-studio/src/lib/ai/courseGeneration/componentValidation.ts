/**
 * Validates interactive components before they are saved to module content.
 */

import type { ComponentType, SelectedComponent } from '@/lib/ai/componentSelector'

function isNonEmptyString(v: unknown, minLen = 2): v is string {
  return typeof v === 'string' && v.trim().length >= minLen
}

function normalizeMatchingPairs(data: Record<string, unknown>): { term: string; definition: string }[] | null {
  const raw = data.pairs
  if (!Array.isArray(raw) || raw.length < 2) return null
  const pairs: { term: string; definition: string }[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const term = isNonEmptyString(o.term)
      ? o.term.trim()
      : isNonEmptyString(o.left)
        ? o.left.trim()
        : ''
    const definition = isNonEmptyString(o.definition)
      ? o.definition.trim()
      : isNonEmptyString(o.right)
        ? o.right.trim()
        : ''
    if (term && definition && term.toLowerCase() !== definition.toLowerCase()) {
      pairs.push({ term, definition })
    }
  }
  return pairs.length >= 2 ? pairs : null
}

function normalizeFlipcards(data: Record<string, unknown>): { front: string; back: string }[] | null {
  const raw = data.cards
  if (!Array.isArray(raw) || raw.length === 0) return null
  const cards: { front: string; back: string }[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const front = isNonEmptyString(o.front) ? o.front.trim() : ''
    const back = isNonEmptyString(o.back) ? o.back.trim() : ''
    if (!front || !back) continue
    if (front.toLowerCase() === back.toLowerCase()) continue
    if (back.length < 12) continue
    cards.push({ front, back })
  }
  return cards.length > 0 ? cards : null
}

/** Per-domain preferred component types (strategic mix). */
export function getDomainComponentHints(courseType: string): string {
  const t = courseType.toLowerCase()
  if (t.includes('program')) {
    return 'Prefer: quiz, expandable (code walkthrough), timeline (algorithm steps). Avoid flipcard unless 4+ cards with substantive backs. Max 1 matching per module.'
  }
  if (t.includes('product')) {
    return 'Prefer: tabs (compare options), matching (framework ↔ use case), quiz (scenario-fork). Avoid bare flipcards of single words.'
  }
  if (t.includes('data')) {
    return 'Prefer: quiz (interpretation), flashcard (methods/metrics), tabs (technique comparison).'
  }
  if (t.includes('compliance')) {
    return 'Prefer: quiz (scenario decisions), expandable (policy detail), timeline (process steps).'
  }
  if (t.includes('soft')) {
    return 'Prefer: quiz (scenario-fork), tabs (approaches), expandable (scripts/examples).'
  }
  return 'Vary component types; each must add practice value beyond the prose.'
}

export function shouldIncludeComponent(
  type: ComponentType,
  data: Record<string, unknown>,
  moduleText?: string,
  opts: { strict?: boolean } = {}
): boolean {
  const strict = opts.strict !== false
  switch (type) {
    case 'matching': {
      const pairs = normalizeMatchingPairs(data)
      if (!pairs) return false
      if (!strict) return true
      const trivial = pairs.every(
        (p) => p.term.length < 4 || p.definition.length < 8
      )
      return !trivial
    }
    case 'flipcard': {
      const cards = normalizeFlipcards(data)
      return cards != null && cards.length >= (strict ? 2 : 1)
    }
    case 'quiz': {
      const q = data.question
      const opts = data.options
      if (!isNonEmptyString(q, 12) || !Array.isArray(opts)) return false
      const valid = opts.filter((o): o is string => isNonEmptyString(o, 2)).map((o) => o.trim().toLowerCase())
      if (valid.length < 3 || valid.length !== opts.length) return false
      if (new Set(valid).size !== valid.length) return false
      const answer = data.correctAnswer
      if (typeof answer === 'number') return Number.isInteger(answer) && answer >= 0 && answer < valid.length
      if (typeof answer === 'string') {
        const trimmed = answer.trim()
        if (/^\d+$/.test(trimmed)) return Number(trimmed) < valid.length
        return valid.includes(trimmed.toLowerCase())
      }
      return false
    }
    case 'timeline': {
      const steps = data.steps
      if (!Array.isArray(steps) || steps.length < 2) return false
      return steps.every(
        (s) =>
          s &&
          typeof s === 'object' &&
          isNonEmptyString((s as { title?: string }).title) &&
          isNonEmptyString((s as { description?: string }).description, 10)
      )
    }
    case 'tabs': {
      const tabs = data.tabs
      if (!Array.isArray(tabs) || tabs.length < 2) return false
      return tabs.every(
        (t) =>
          t &&
          typeof t === 'object' &&
          isNonEmptyString((t as { label?: string }).label) &&
          isNonEmptyString((t as { content?: string }).content, 20)
      )
    }
    case 'expandable': {
      return (
        isNonEmptyString(data.title, 3) && isNonEmptyString(data.content, 40)
      )
    }
    case 'flashcard': {
      return normalizeFlipcards(data) != null
    }
    case 'video':
      return isNonEmptyString(data.url, 10)
    case 'audio':
      return isNonEmptyString(data.url, 10)
    case 'hotspot':
      return (
        isNonEmptyString(data.imageUrl, 8) &&
        Array.isArray(data.spots) &&
        (data.spots as unknown[]).length > 0
      )
    default:
      return true
  }
}

/** Sanitize and normalize component data; returns null if unusable. */
export function sanitizeComponent(
  component: SelectedComponent,
  moduleText?: string,
  opts: { strict?: boolean } = {}
): SelectedComponent | null {
  const data =
    component.data && typeof component.data === 'object'
      ? { ...component.data }
      : {}

  if (!shouldIncludeComponent(component.type, data, moduleText, opts)) {
    return null
  }

  if (component.type === 'matching') {
    const pairs = normalizeMatchingPairs(data)
    if (!pairs) return null
    return { type: 'matching', data: { pairs, instruction: data.instruction ?? 'Match each term to its definition.' } }
  }

  if (component.type === 'flipcard' || component.type === 'flashcard') {
    const cards = normalizeFlipcards(data)
    if (!cards) return null
    return { type: component.type, data: { cards } }
  }

  return { type: component.type, data }
}

export function filterAndSanitizeComponents(
  components: SelectedComponent[],
  moduleText?: string,
  opts: { strict?: boolean } = {}
): SelectedComponent[] {
  const out: SelectedComponent[] = []
  for (const c of components) {
    const sanitized = sanitizeComponent(c, moduleText, opts)
    if (sanitized) out.push(sanitized)
  }
  return out
}
