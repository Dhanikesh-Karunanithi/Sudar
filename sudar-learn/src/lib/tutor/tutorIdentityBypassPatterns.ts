/**
 * Regexes that skip the secondary (LLM) learning-scope guardrail because the message
 * is clearly an identity / platform intro question — not arbitrary chat that mentions Sudar.
 *
 * IMPORTANT: Do not add a bare `\bsudar\b` match; learners often address the tutor by name
 * while asking off-topic or harmful questions, which must still go through guardrails.
 */
export const TUTOR_IDENTITY_BYPASS_PATTERNS: readonly RegExp[] = [
  /\b(what|who)\s+(is|are)\s+(your|u r|ur)\s+(name|you)\b/i,
  /\bwho\s+are\s+you\b/i,
  /\bwhat('?s|\s+is)\s+your\s+name\b/i,
  /\bintroduce\s+yourself\b/i,
  /\btell\s+me\s+about\s+yourself\b/i,
  /\bwhat\s+can\s+you\s+do\b/i,
  /\bwhat\s+are\s+you\b/i,
  /\byour\s+name\b/i,
  /\bwhat\s+(is|'s)\s+sudar\b/i,
  /\bwho\s+(is|'s)\s+sudar\b/i,
  /\bwhat\s+does\s+sudar\s+(do|mean)\b/i,
  /\btell\s+me\s+about\s+sudar\b/i,
]

export function tutorMessageMatchesIdentityBypass(trimmed: string): boolean {
  return TUTOR_IDENTITY_BYPASS_PATTERNS.some((p) => p.test(trimmed))
}
