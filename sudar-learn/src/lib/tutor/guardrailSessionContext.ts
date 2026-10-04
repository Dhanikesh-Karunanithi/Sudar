/**
 * Build a short, server-trusted summary of recent tutor turns for the input guardrail.
 * Truncated on purpose — enough for continuity, not a full transcript spoof surface.
 */
export function buildGuardrailSessionContext(
  history: Array<{ role?: string; content?: string }> | undefined,
  maxTurns = 4,
  maxChars = 600,
): string {
  if (!Array.isArray(history) || history.length === 0) return ''
  const recent = history.slice(-maxTurns)
  const lines: string[] = []
  for (const m of recent) {
    const role = m.role === 'assistant' ? 'Tutor' : 'Learner'
    const content = String(m.content ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160)
    if (!content) continue
    lines.push(`${role}: ${content}`)
  }
  const joined = lines.join('\n')
  return joined.length > maxChars ? joined.slice(-maxChars) : joined
}
