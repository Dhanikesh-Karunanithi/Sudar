/**
 * Short conversational follow-ups that are often misclassified by the guardrail LLM
 * because they lack standalone learning keywords, yet are continuations of study sessions.
 *
 * Patterns in SESSION_ONLY must not apply on the first turn of a thread: common English
 * starters like "What is…" or the word "continue" appear in harmful first messages and
 * would otherwise skip the learning-scope check entirely.
 */
export const TUTOR_FOLLOWUP_BYPASS_PATTERNS_ALWAYS: readonly RegExp[] = [
  /^(simplif(y|ied)|simpler|simple version|make\s+it\s+simpler)/i,
  /\bin\s+brief\b/i,
  /\bin\s+short\b/i,
  /\bbriefly\b/i,
  /\bsummarise\b|\bsummarize\b/i,
  /\bsummary\b/i,
  /\bshorten\b|\bshorter\b/i,
  /\brepeat\s+that\b|\bsay\s+that\s+again\b|\bonce\s+more\b/i,
  /^(ok|okay|got\s+it|thanks|thank\s+you|great|nice|cool|makes\s+sense|understood)/i,
  /\bexplain\s+(again|more|further|that|this|it)\b/i,
  /\bgive\s+(me\s+)?(an?\s+)?(example|analogy|demo)\b/i,
  /\bmore\s+(detail|context|depth|info|information|examples?)\b/i,
  /\bwhat\s+does\s+(that|this)\s+mean\b/i,
  /\bi\s+(don'?t\s+)?(understand|get\s+it|follow)\b/i,
  /\bcan\s+you\s+(re)?explain\b/i,
  /\btoo\s+(long|complex|technical|advanced|complicated)\b/i,
  /\beli5\b|\blayman'?s?\s+terms?\b/i,
]

/** Only safe after at least one prior turn in conversation_history. */
export const TUTOR_FOLLOWUP_BYPASS_PATTERNS_SESSION_ONLY: readonly RegExp[] = [
  /^(what|why|how|when|where|who|which)\s/i,
  /\bnext\b|\bcontinue\b|\bgo\s+on\b|\bproceed\b/i,
]

export function tutorMessageMatchesFollowupBypass(
  trimmed: string,
  hasConversationHistory: boolean,
): boolean {
  for (const pattern of TUTOR_FOLLOWUP_BYPASS_PATTERNS_ALWAYS) {
    if (pattern.test(trimmed)) return true
  }
  if (hasConversationHistory) {
    for (const pattern of TUTOR_FOLLOWUP_BYPASS_PATTERNS_SESSION_ONLY) {
      if (pattern.test(trimmed)) return true
    }
  }
  return false
}
