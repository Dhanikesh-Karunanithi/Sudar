type RpcFn = (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>

/** Structural so both apps' supabase-js copies (and typed Database clients) are accepted. */
export interface RateLimitClient {
  rpc: unknown
}

export interface RateLimitRule {
  /** Namespace so different endpoints do not share a bucket. */
  scope: string
  windowSeconds: number
  maxHits: number
}

export const INVITE_CODE_RATE_LIMIT: RateLimitRule = { scope: 'invite', windowSeconds: 600, maxHits: 10 }

export const RATE_LIMITED_MESSAGE = 'Too many attempts. Please wait a few minutes and try again.'

export function clientIpFromHeaders(headers: Headers): string {
  const cf = headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  return headers.get('x-real-ip')?.trim() || 'unknown'
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function rateLimitBucketKey(rule: RateLimitRule, identity: string): Promise<string> {
  return `${rule.scope}:${await sha256Hex(identity)}`
}

/**
 * Returns true when the request is within the limit. Fails open on limiter errors so a DB hiccup
 * cannot lock every tester out of signup; brute force still needs sustained successful hits.
 */
export async function checkRateLimit(
  admin: RateLimitClient,
  rule: RateLimitRule,
  identity: string
): Promise<boolean> {
  try {
    const key = await rateLimitBucketKey(rule, identity)
    const rpc = admin.rpc as RpcFn
    const { data, error } = await rpc.call(admin, 'hit_rate_limit', {
      p_key: key,
      p_window_seconds: rule.windowSeconds,
      p_max_hits: rule.maxHits,
    })
    if (error) return true
    return data !== false
  } catch {
    return true
  }
}
