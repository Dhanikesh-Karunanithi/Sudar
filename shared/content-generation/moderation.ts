/**
 * Output moderation for AI-generated learning content (server-only; reads provider keys from env).
 *
 * Order: Llama Guard via Together -> OpenAI omni-moderation -> local screen.
 * CONTENT_MODERATION_MODE: `auto` (default) | `local` (skip providers) | `off` (always allow; dev only).
 */

export interface ModerationVerdict {
  allowed: boolean
  provider: 'llama_guard' | 'openai' | 'local' | 'off'
  categories: string[]
  reason?: string
}

type Env = Record<string, string | undefined>

const LLAMA_GUARD_CATEGORIES: Record<string, string> = {
  S1: 'violent_crimes',
  S2: 'non_violent_crimes',
  S3: 'sex_crimes',
  S4: 'child_exploitation',
  S5: 'defamation',
  S6: 'specialized_advice',
  S7: 'privacy',
  S8: 'intellectual_property',
  S9: 'indiscriminate_weapons',
  S10: 'hate',
  S11: 'self_harm',
  S12: 'sexual_content',
  S13: 'elections',
  S14: 'code_interpreter_abuse',
}

/**
 * Categories that legitimately appear in corporate training (compliance, safety, legal, medical)
 * and should not block content by themselves.
 */
const TRAINING_TOLERATED = new Set(['specialized_advice', 'non_violent_crimes', 'elections', 'defamation', 'privacy'])

const LOCAL_PATTERNS: { category: string; re: RegExp }[] = [
  { category: 'self_harm', re: /\b(how to (kill|hurt) (yourself|myself)|suicide method)/i },
  { category: 'sexual_content', re: /\b(explicit sex|porn(ographic)?)\b/i },
  { category: 'hate', re: /\b(subhuman|ethnic cleansing is (good|justified))\b/i },
  { category: 'indiscriminate_weapons', re: /\b(build|make) (a )?(bomb|nerve agent|bioweapon)\b/i },
]

export function localModerationScreen(text: string): ModerationVerdict {
  const hits = LOCAL_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.category)
  return {
    allowed: hits.length === 0,
    provider: 'local',
    categories: hits,
    reason: hits.length ? `Local screen flagged: ${hits.join(', ')}` : undefined,
  }
}

/** Parse Llama Guard output: "safe" or "unsafe\nS1,S10". */
export function parseLlamaGuardOutput(raw: string): { safe: boolean; categories: string[] } | null {
  const text = raw.trim().toLowerCase()
  if (text.startsWith('safe')) return { safe: true, categories: [] }
  if (!text.startsWith('unsafe')) return null
  const codes = raw.toUpperCase().match(/S\d{1,2}/g) ?? []
  return { safe: false, categories: codes.map((c) => LLAMA_GUARD_CATEGORIES[c] ?? c) }
}

async function llamaGuard(text: string, env: Env, fetchImpl: typeof fetch): Promise<ModerationVerdict | null> {
  const key = env.TOGETHER_API_KEY
  if (!key) return null
  const model = env.CONTENT_MODERATION_MODEL || 'meta-llama/Llama-Guard-4-12B'
  const res = await fetchImpl('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: 20,
      temperature: 0,
      // Llama Guard classifies the last turn; a user turn is required before the assistant turn.
      messages: [
        { role: 'user', content: 'Write a module of workplace training content.' },
        { role: 'assistant', content: text.slice(0, 12000) },
      ],
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) return null
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const parsed = parseLlamaGuardOutput(json.choices?.[0]?.message?.content ?? '')
  if (!parsed) return null
  const blocking = parsed.categories.filter((c) => !TRAINING_TOLERATED.has(c))
  return {
    allowed: blocking.length === 0,
    provider: 'llama_guard',
    categories: parsed.categories,
    reason: blocking.length ? `Llama Guard flagged: ${blocking.join(', ')}` : undefined,
  }
}

async function openAiModeration(text: string, env: Env, fetchImpl: typeof fetch): Promise<ModerationVerdict | null> {
  const key = env.OPENAI_API_KEY
  if (!key) return null
  const res = await fetchImpl('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'omni-moderation-latest', input: text.slice(0, 20000) }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) return null
  const json = (await res.json()) as { results?: { flagged?: boolean; categories?: Record<string, boolean> }[] }
  const result = json.results?.[0]
  if (!result) return null
  const categories = Object.entries(result.categories ?? {})
    .filter(([, v]) => v)
    .map(([k]) => k)
  return {
    allowed: !result.flagged,
    provider: 'openai',
    categories,
    reason: result.flagged ? `OpenAI moderation flagged: ${categories.join(', ')}` : undefined,
  }
}

export async function moderateContent(
  text: string,
  opts: { env?: Env; fetchImpl?: typeof fetch } = {},
): Promise<ModerationVerdict> {
  const env = opts.env ?? (typeof process !== 'undefined' ? process.env : {})
  const fetchImpl = opts.fetchImpl ?? fetch
  const mode = (env.CONTENT_MODERATION_MODE || 'auto').toLowerCase()

  if (mode === 'off') {
    return { allowed: true, provider: 'off', categories: [] }
  }

  const local = localModerationScreen(text)
  if (!local.allowed || mode === 'local') return local

  for (const provider of [llamaGuard, openAiModeration]) {
    try {
      const verdict = await provider(text, env, fetchImpl)
      if (verdict) return verdict
    } catch {
      // provider unavailable; try the next one
    }
  }
  return local
}
