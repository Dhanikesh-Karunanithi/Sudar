import {
  chatCompletion,
  getDefaultMemoryModel,
  resolveChatConfigError,
  type ChatCompletionContext,
} from '@/lib/ai/chat'
import { buildTutorUsageChatCtx, type TutorMeteringDeps } from '@/lib/tutor/tutorUsageContext'
import type { PrivateOpenAiRuntime } from '@/types/orgAiInference'
import { tutorMessageMatchesIdentityBypass } from '@/lib/tutor/tutorIdentityBypassPatterns'

export type TutorGuardrailAiDeps = TutorMeteringDeps & {
  orgSettings: unknown
  privateRuntime: PrivateOpenAiRuntime | null
  chatCtx: ChatCompletionContext
}

// Blocklist: messages containing these (case-insensitive) are refused before calling the model.
const INPUT_BLOCKLIST_PATTERNS = [
  /\bhow\s+to\s+(hack|exploit|cheat|steal|hurt|kill)\b/i,
  /\bwrite\s+(me\s+)?(malware|virus|ransomware)\b/i,
  /\bunethical\s+(request|ask)\b/i,
  /\bignore\s+(all\s+)?(previous|instructions)\b/i,
  /\b(jailbreak|bypass)\s+(safety|guardrails)\b/i,
  /\b(reveal|print|dump|show)\s+(your\s+)?(system\s+prompt|hidden\s+instructions|developer\s+message)\b/i,
  /\bexfiltrat|send\s+(me\s+)?(the\s+)?(api\s+key|password|secret|env|\.env)\b/i,
]

// Short conversational follow-ups that are always valid in a learning context.
// These are frequently misclassified by the guardrail LLM because they have no
// standalone learning keywords, yet they are clearly continuations of study sessions.
const FOLLOWUP_BYPASS_PATTERNS = [
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
  /\bgive\s+(me\s+)?(an?\s+)?(example|analogy|analogy|demo)\b/i,
  /\bmore\s+(detail|context|depth|info|information|examples?)\b/i,
  /\bwhat\s+does\s+(that|this)\s+mean\b/i,
  /\bi\s+(don'?t\s+)?(understand|get\s+it|follow)\b/i,
  /\bcan\s+you\s+(re)?explain\b/i,
  /\btoo\s+(long|complex|technical|advanced|complicated)\b/i,
  /\beli5\b|\blayman'?s?\s+terms?\b/i,
  /\bnext\b|\bcontinue\b|\bgo\s+on\b|\bproceed\b/i,
]

/** Returns true if the message passes the input guardrail (learning/platform scope). */
export async function runTutorInputGuardrail(
  message: string,
  aiDeps: TutorGuardrailAiDeps
): Promise<{ pass: boolean }> {
  const trimmed = message.trim()
  if (!trimmed) return { pass: false }

  for (const pattern of INPUT_BLOCKLIST_PATTERNS) {
    if (pattern.test(trimmed)) return { pass: false }
  }

  if (tutorMessageMatchesIdentityBypass(trimmed)) return { pass: true }

  for (const pattern of FOLLOWUP_BYPASS_PATTERNS) {
    if (pattern.test(trimmed)) return { pass: true }
  }

  // Never skip the LLM scope check based on client-supplied `conversation_history`:
  // a single spoofed prior turn previously bypassed all scope checks for arbitrary messages.

  if (resolveChatConfigError(aiDeps.orgSettings, aiDeps.privateRuntime)) return { pass: true }

  try {
    const { content } = await chatCompletion(
      {
        model: getDefaultMemoryModel(aiDeps.privateRuntime),
        messages: [
          {
            role: 'user',
            content: `Does this message ask for help with learning, courses, studying, questions about the AI tutor, or using this learning platform? Reply with exactly YES or NO.\n\nMessage: "${trimmed.slice(0, 500)}"`,
          },
        ],
        max_tokens: 10,
        temperature: 0,
      },
      buildTutorUsageChatCtx(aiDeps, 'guardrail')
    )
    const answer = (content ?? '').toUpperCase()
    const pass = !answer.startsWith('NO')
    return { pass }
  } catch {
    return { pass: true }
  }
}
