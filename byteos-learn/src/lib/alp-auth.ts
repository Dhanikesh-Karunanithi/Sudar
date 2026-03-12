/**
 * ALP (Adaptive Learning Layer) key validation.
 * Accepts env ALP_API_KEY or any key from integration_api_keys (hashed lookup).
 * Returns { valid, keyId } so routes can update last_used_at when keyId is set.
 */
import { createHash, createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

function hashKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

export async function validateAlpKey(
  key: string | null
): Promise<{ valid: true; keyId?: string } | { valid: false }> {
  if (!key?.trim()) return { valid: false }

  const envKey = process.env.ALP_API_KEY
  if (envKey && key === envKey) return { valid: true }

  const keyHash = hashKey(key)
  const admin = createAdminClient()

  // integration_api_keys lives in shared Supabase; table not in Learn's generated types
  const db = admin as unknown as { from: (t: string) => { select: (c: string) => { eq: (a: string, v: string) => { limit: (n: number) => { maybeSingle: () => Promise<{ data: { id: string } | null }> } } }; update: (u: { last_used_at: string }) => { eq: (a: string, v: string) => Promise<unknown> } } } }
  const { data: row } = await db.from('integration_api_keys').select('id').eq('key_hash', keyHash).limit(1).maybeSingle()

  if (row?.id) {
    void db.from('integration_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', row.id).catch(() => {})
    return { valid: true, keyId: row.id }
  }

  return { valid: false }
}

export function getAlpKeyFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  return request.headers.get('x-alp-api-key')?.trim() ?? null
}

const EMBED_SIGNING_SECRET = process.env.ALP_EMBED_SECRET || process.env.ALP_API_KEY || ''

function signForEmbed(payload: string): string {
  return createHmac('sha256', EMBED_SIGNING_SECRET).update(payload, 'utf8').digest('base64url')
}

/**
 * Validates an embed token (from /api/alp/embed-token). Returns payload or null.
 */
export function validateEmbedToken(token: string | null): { sub: string; course_id?: string | null; module_id?: string | null } | null {
  if (!token?.includes('.')) return null
  const [b64, sig] = token.split('.')
  if (!b64 || !sig) return null
  const expectedSig = signForEmbed(b64)
  if (sig !== expectedSig) return null
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    if (!payload.sub) return null
    return { sub: payload.sub, course_id: payload.course_id ?? null, module_id: payload.module_id ?? null }
  } catch {
    return null
  }
}
