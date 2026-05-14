export type ContentIntent = 'conceptual' | 'procedural' | 'review' | 'assessment'

/** Heuristic mapping from Learn modality tab to content intent (for 2D affinity). */
export function inferContentIntentFromModality(toModality: string): ContentIntent {
  const m = (toModality ?? 'text').toLowerCase()
  if (m === 'flashcards') return 'review'
  if (m === 'text' || m === 'reading') return 'procedural'
  if (m === 'game' || m === 'feed') return 'assessment'
  return 'conceptual'
}
