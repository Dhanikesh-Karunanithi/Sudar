/**
 * organisations.settings.ai_inference — org-level private OpenAI-compatible LLM.
 * Bearer token is never stored in JSON; use LOCAL_LLM_BEARER_TOKEN or AI_CHAT_API_KEY on the server.
 */
import { z } from 'zod'

const privateUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((s) => s.length === 0 || /^https?:\/\//i.test(s), {
    message: 'Server address must start with http:// or https://',
  })

const modelSchema = z.string().trim().max(256)

const runtimeModeSchema = z.enum(['cloud', 'local', 'hybrid'])
const runtimeCapabilitySchema = z.enum(['chat', 'summarize', 'rewrite', 'flashcards', 'quiz_explain'])
const runtimeProviderTypeSchema = z.enum(['openai_compatible_local'])
const runtimeAuthModeSchema = z.enum(['none', 'bearer'])

export const runtimeProviderSchema = z.object({
  id: z.string().trim().min(1).max(128),
  type: runtimeProviderTypeSchema.default('openai_compatible_local'),
  base_url: privateUrlSchema,
  model: modelSchema,
  auth_mode: runtimeAuthModeSchema.default('none'),
  timeout_ms: z.number().int().min(1000).max(120000).default(30000),
  max_tokens_default: z.number().int().min(32).max(8192).default(512),
  capabilities: z.array(runtimeCapabilitySchema).default(['chat', 'summarize', 'rewrite']),
  active: z.boolean().default(true),
  encrypted_secret_ref: z.string().trim().max(256).nullable().optional(),
})

export const orgAiRuntimePolicySchema = z.object({
  mode: runtimeModeSchema.default('cloud'),
  strict_local: z.boolean().default(false),
  fallback_enabled: z.boolean().default(true),
  providers: z.array(runtimeProviderSchema).default([]),
})

export const orgAiInferencePatchSchema = z
  .object({
    use_private_server: z.boolean().optional(),
    private_server_url: privateUrlSchema.optional(),
    private_server_model: modelSchema.optional(),
  })
  .strict()

export type OrgAiInferencePatch = z.infer<typeof orgAiInferencePatchSchema>

export type OrgAiInferenceStored = {
  use_private_server: boolean
  private_server_url: string
  private_server_model: string
}

export type RuntimeCapability = z.infer<typeof runtimeCapabilitySchema>
export type RuntimeMode = z.infer<typeof runtimeModeSchema>
export type RuntimeProviderStored = z.infer<typeof runtimeProviderSchema>
export type OrgAiRuntimePolicy = z.infer<typeof orgAiRuntimePolicySchema>

export type PrivateOpenAiRuntime = {
  baseUrl: string
  apiKey: string
  defaultModel: string
}

export function isOrgPrivateAiFeatureEnabled(): boolean {
  return process.env.ALLOW_ORG_PRIVATE_AI_SERVER?.trim().toLowerCase() === 'true'
}

/** Bearer for org private server: dedicated env first, then generic custom key. */
export function getPrivateLlmBearerToken(): string {
  return (
    process.env.LOCAL_LLM_BEARER_TOKEN?.trim() ||
    process.env.AI_CHAT_API_KEY?.trim() ||
    ''
  )
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return true
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true
  return false
}

/**
 * Validates URL for SSRF mitigation. When PRIVATE_AI_URL_HOST_ALLOWLIST is set (comma-separated),
 * hostname must match one entry (exact or suffix with leading dot for subdomains).
 */
export function validateOrgPrivateServerUrl(rawUrl: string): { ok: true; normalizedBase: string } | { ok: false; error: string } {
  const trimmed = rawUrl.trim()
  if (!trimmed) return { ok: false, error: 'Server address is required.' }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, error: 'Invalid server address. Use a full URL like http://192.168.1.10:11434' }
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https are allowed.' }
  }
  const hostname = parsed.hostname
  const allowlist = process.env.PRIVATE_AI_URL_HOST_ALLOWLIST?.trim()
  if (allowlist) {
    const parts = allowlist.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    const hostLower = hostname.toLowerCase()
    const allowed = parts.some((rule) => {
      if (rule.startsWith('.')) return hostLower.endsWith(rule.slice(1)) || hostLower === rule.slice(1)
      return hostLower === rule
    })
    if (!allowed) {
      return { ok: false, error: 'This server address is not on your organisation allowlist. Ask your platform operator.' }
    }
  } else {
    // Without allowlist, only allow localhost and private IPv4 (typical LAN LLM). Block public internet by default.
    if (!isPrivateOrLocalHost(hostname)) {
      return {
        ok: false,
        error:
          'For security, only private network addresses (e.g. 192.168.x.x) or localhost are allowed unless PRIVATE_AI_URL_HOST_ALLOWLIST is set by your operator.',
      }
    }
  }
  // Use origin only so Sudar always appends /v1/chat/completions consistently.
  const normalizedBase = `${parsed.protocol}//${parsed.host}`.replace(/\/$/, '')
  return { ok: true, normalizedBase }
}

export function parseOrgAiInference(settings: unknown): OrgAiInferenceStored {
  const s = settings as Record<string, unknown> | null | undefined
  const ai = (s?.ai_inference as Record<string, unknown> | undefined) ?? {}
  return {
    use_private_server: ai.use_private_server === true,
    private_server_url: typeof ai.private_server_url === 'string' ? ai.private_server_url.trim() : '',
    private_server_model: typeof ai.private_server_model === 'string' ? ai.private_server_model.trim() : '',
  }
}

export function parseOrgAiRuntimePolicy(settings: unknown): OrgAiRuntimePolicy {
  const s = settings as Record<string, unknown> | null | undefined
  const runtime = (s?.ai_runtime as Record<string, unknown> | undefined) ?? {}
  const parsed = orgAiRuntimePolicySchema.safeParse(runtime)
  if (!parsed.success) {
    return { mode: 'cloud', strict_local: false, fallback_enabled: true, providers: [] }
  }
  return parsed.data
}

export function capabilitySupported(policy: OrgAiRuntimePolicy, capability: RuntimeCapability): boolean {
  if (policy.mode === 'cloud') return true
  return policy.providers.some((p) => p.active && p.capabilities.includes(capability))
}

/** Resolves server-side runtime for chat when org uses private AI and feature flag is on. */
export function buildPrivateOpenAiRuntime(settings: unknown): PrivateOpenAiRuntime | null {
  if (!isOrgPrivateAiFeatureEnabled()) return null
  const inf = parseOrgAiInference(settings)
  if (!inf.use_private_server) return null
  const v = validateOrgPrivateServerUrl(inf.private_server_url)
  if (!v.ok) return null
  const model = inf.private_server_model.trim()
  if (!model) return null
  const apiKey = getPrivateLlmBearerToken()
  if (!apiKey) return null
  return {
    baseUrl: v.normalizedBase,
    apiKey,
    defaultModel: model,
  }
}

export function getOrgPrivateAiConfigError(settings: unknown): string | null {
  if (!isOrgPrivateAiFeatureEnabled()) return null
  const inf = parseOrgAiInference(settings)
  if (!inf.use_private_server) return null
  if (!inf.private_server_url.trim()) return 'Private AI is on but server address is missing. Add it in Org settings.'
  const v = validateOrgPrivateServerUrl(inf.private_server_url)
  if (!v.ok) return v.error
  if (!inf.private_server_model.trim()) return 'Private AI is on but model name is missing.'
  if (!getPrivateLlmBearerToken()) {
    return 'Private AI is on but the server password is not configured on this deployment. Set LOCAL_LLM_BEARER_TOKEN or AI_CHAT_API_KEY in the server environment.'
  }
  return null
}
