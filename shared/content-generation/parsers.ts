import {
  flashcardsResultSchema,
  interactiveResultSchema,
  quizResultSchema,
  type FlashcardPair,
  type InteractiveElement,
  type QuizResult,
} from './schemas'

export function extractJsonObject(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in AI response')
  return JSON.parse(match[0])
}

export function extractJsonArray(raw: string): unknown {
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array found in AI response')
  return JSON.parse(match[0])
}

export function parseQuizFromAi(raw: string): QuizResult {
  const parsed = extractJsonObject(raw)
  return quizResultSchema.parse(parsed)
}

export function parseFlashcardsFromAi(raw: string): FlashcardPair[] {
  const parsed = extractJsonArray(raw)
  const result = flashcardsResultSchema.safeParse({ cards: parsed })
  if (result.success) return result.data.cards
  if (Array.isArray(parsed)) {
    return parsed
      .filter((c: unknown) => c && typeof c === 'object' && 'front' in c && 'back' in c)
      .map((c: { front?: string; back?: string }) => ({
        front: String(c.front ?? '').slice(0, 300),
        back: String(c.back ?? '').slice(0, 500),
      }))
      .filter((c) => c.front.trim() && c.back.trim())
  }
  throw new Error('Invalid flashcards structure')
}

export function parseInteractiveFromAi(raw: string): InteractiveElement[] {
  const parsed = extractJsonObject(raw)
  const result = interactiveResultSchema.parse(parsed)
  return result.interactive_elements
}

export function parseOutlineFromAi(raw: string): string[] {
  const parsed = extractJsonArray(raw)
  if (!Array.isArray(parsed)) throw new Error('Outline must be an array')
  return parsed.map((m) => String(m).trim()).filter(Boolean)
}
