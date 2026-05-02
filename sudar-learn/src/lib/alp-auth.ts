/**
 * ALP (Adaptive Learning Layer) key validation.
 * Accepts env ALP_API_KEY or any key from integration_api_keys (hashed lookup).
 * Returns { valid, keyId } so routes can update last_used_at when keyId is set.
 */
import { createHash, createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

function hashKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

export type AlpKeyResult =
  | { valid: true; keyId?: string; orgId?: string }
  | { valid: false }

/**
 * When orgId is set, the key is org-scoped: callers must only access user_id that belong to that org (org_members).
 */
export async function validateAlpKey(key: string | null): Promise<AlpKeyResult> {
  if (!key?.trim()) return { valid: false }

  const envKey = process.env.ALP_API_KEY
  if (envKey && key === envKey) return { valid: true }

  const keyHash = hashKey(key)
  const admin = createServiceRoleSupabaseClient()

  // integration_api_keys lives in shared Supabase; table not in Learn's generated types
  type IntegrationDb = {
    from: (t: string) => {
      select: (c: string) => { eq: (a: string, v: string) => { limit: (n: number) => { maybeSingle: () => Promise<{ data: { id: string; org_id: string } | null }> } } }
      update: (u: { last_used_at: string }) => { eq: (a: string, v: string) => Promise<unknown> }
    }
  }
  const db = admin as unknown as IntegrationDb
  const { data: row } = await db.from('integration_api_keys').select('id, org_id').eq('key_hash', keyHash).limit(1).maybeSingle()

  if (row?.id) {
    void db.from('integration_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', row.id).catch(() => {})
    return { valid: true, keyId: row.id, orgId: row.org_id }
  }

  return { valid: false }
}

export function getAlpKeyFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  return request.headers.get('x-alp-api-key')?.trim() ?? null
}

/** Minimal Supabase-like client for org_members lookup */
type SupabaseLikeClient = {
  from: (table: string) => {
    select: (columns: string) => { eq: (col: string, val: string) => { eq: (col2: string, val2: string) => { maybeSingle: () => Promise<{ data: unknown }> } } }
  }
}

/**
 * Verifies that user_id is a member of the given org (org_members).
 * Used for org-scoped ALP keys to prevent IDOR: key holder must only access learners in their org.
 */
export async function isUserInOrg(adminClient: unknown, userId: string, orgId: string): Promise<boolean> {
  const admin = adminClient as SupabaseLikeClient
  const { data } = await admin.from('org_members').select('user_id').eq('org_id', orgId).eq('user_id', userId).maybeSingle()
  return !!data
}

export async function rejectAlpUserOutsideOrg(
  admin: unknown,
  auth: AlpKeyResult,
  userId: string,
): Promise<NextResponse | null> {
  if (!auth.valid || !auth.orgId) return null

  const inOrg = await isUserInOrg(admin, userId, auth.orgId)
  if (!inOrg) {
    return NextResponse.json({ error: 'Forbidden: user not in key organisation' }, { status: 403 })
  }

  return null
}

function embedSigningSecret(): string {
  return process.env.ALP_EMBED_SIGNING_SECRET?.trim() || process.env.ALP_EMBED_SECRET?.trim() || ''
}

export function getEmbedSigningSecretConfigured(): boolean {
  return !!embedSigningSecret()
}

function signForEmbed(payload: string): string {
  const secret = embedSigningSecret()
  if (!secret) return ''
  return createHmac('sha256', secret).update(payload, 'utf8').digest('base64url')
}

export function signEmbedPayload(payload: string): string {
  return signForEmbed(payload)
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
