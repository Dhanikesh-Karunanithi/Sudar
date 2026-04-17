/**
 * Integration API keys (ALP) — create and list. Admin/Manager only.
 * Keys are hashed; raw key is returned only on create.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

const KEY_PREFIX = 'alp_'
const KEY_BYTES = 32
const PREFIX_DISPLAY_LEN = 8

function hashKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: keys, error } = await admin
    .from('integration_api_keys')
    .select('id, name, key_prefix, created_at, last_used_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ keys: keys ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : 'ALP key'
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const rawKey = KEY_PREFIX + randomBytes(KEY_BYTES).toString('hex')
  const keyHash = hashKey(rawKey)
  const keyPrefix = rawKey.slice(0, PREFIX_DISPLAY_LEN)

  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('integration_api_keys')
    .insert({ org_id: orgId, name, key_hash: keyHash, key_prefix: keyPrefix })
    .select('id, name, key_prefix, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    key: row,
    raw_key: rawKey,
    message: 'Copy the key now; it will not be shown again.',
  })
}
