#!/usr/bin/env node
/**
 * Provision pilot organisations (Talisma, Foundever) and grant platform super_admin.
 *
 * Usage:
 *   node scripts/ops/provision-pilot-org.mjs [--dry-run]
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   PILOT_ADMIN_EMAILS — comma-separated (default: connect@ + foundever emails)
 */
import { createHash, randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const dryRun = process.argv.includes('--dry-run')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEFAULT_ADMIN_EMAILS = [
  'connect@dhanikeshkarunanithi.com',
  'dhanikesh.karunanithi@foundever.com',
]

const adminEmails = (process.env.PILOT_ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAILS.join(','))
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

const PILOT_ORGS = [
  {
    name: 'Talisma',
    slug: 'talisma',
    plan: 'enterprise',
    settings: {
      pilot: true,
      ai_platform: { enabled: true, label: 'Sudar AI', model: 'auto' },
      ai_entitlements: {
        monthly_token_allowance: 50_000_000,
        warn_threshold_pct: 80,
        hard_stop: true,
      },
    },
  },
  {
    name: 'Foundever',
    slug: 'foundever',
    plan: 'enterprise',
    settings: {
      pilot: true,
      ai_platform: { enabled: true, label: 'Sudar AI', model: 'auto' },
      ai_entitlements: {
        monthly_token_allowance: 50_000_000,
        warn_threshold_pct: 80,
        hard_stop: true,
      },
    },
  },
]

function hashKey(key) {
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

async function findUserIdByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  const user = data.users.find((u) => u.email?.toLowerCase() === email)
  return user?.id ?? null
}

async function ensureAuthUser(email) {
  const existing = await findUserIdByEmail(email)
  if (existing) return existing

  if (dryRun) {
    console.log('[dry-run] would create auth user:', email)
    return null
  }

  const password = randomBytes(16).toString('base64url') + 'Aa1!'
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: email.split('@')[0] },
  })
  if (error) throw error
  console.log('Created auth user:', email, data.user.id)
  return data.user.id
}

async function ensureProfile(userId, email) {
  if (!userId) return
  const { data: existing } = await admin.from('profiles').select('id, role, access_tier').eq('id', userId).maybeSingle()
  const patch = {
    id: userId,
    role: 'super_admin',
    access_tier: 'unlimited',
    signup_code_used: 'GRANDFATHERED',
    full_name: email.split('@')[0],
  }
  if (dryRun) {
    console.log('[dry-run] would upsert profile super_admin:', email)
    return
  }
  if (existing) {
    await admin.from('profiles').update({
      role: 'super_admin',
      access_tier: 'unlimited',
    }).eq('id', userId)
  } else {
    await admin.from('profiles').insert(patch)
  }
  console.log('Granted super_admin + unlimited tier:', email)
}

async function ensureOrgMembership(orgId, userId, role = 'ADMIN') {
  if (!userId) return
  const { data } = await admin
    .from('org_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  if (data) {
    console.log('Already member of org:', userId, orgId)
    return
  }
  if (dryRun) {
    console.log('[dry-run] would add org member', userId, 'to', orgId)
    return
  }
  const { error } = await admin.from('org_members').insert({ org_id: orgId, user_id: userId, role })
  if (error) throw error
  console.log('Added org member:', userId, role, orgId)
}

async function ensureIntegrationKey(orgId, orgName) {
  const { data: existing } = await admin
    .from('integration_api_keys')
    .select('id, name')
    .eq('org_id', orgId)
    .ilike('name', `%pilot%`)
    .limit(1)
    .maybeSingle()
  if (existing) {
    console.log('Integration key already exists for', orgName)
    return null
  }
  const rawKey = 'alp_' + randomBytes(32).toString('hex')
  const keyHash = hashKey(rawKey)
  const keyPrefix = rawKey.slice(0, 8)
  if (dryRun) {
    console.log('[dry-run] would create integration key for', orgName)
    return rawKey
  }
  const { error } = await admin.from('integration_api_keys').insert({
    org_id: orgId,
    name: `${orgName} pilot provisioning`,
    key_hash: keyHash,
    key_prefix: keyPrefix,
  })
  if (error) throw error
  console.log('\n*** SAVE INTEGRATION KEY (shown once) ***')
  console.log(`${orgName}: ${rawKey}\n`)
  return rawKey
}

async function provisionOrg(def) {
  const { data: existing } = await admin
    .from('organisations')
    .select('id, name, slug, settings')
    .eq('slug', def.slug)
    .maybeSingle()

  let orgId = existing?.id ?? null
  if (orgId) {
    console.log('Org exists:', def.name, orgId)
    if (!dryRun) {
      const mergedSettings = {
        ...(typeof existing.settings === 'object' && existing.settings ? existing.settings : {}),
        ...def.settings,
      }
      await admin.from('organisations').update({
        name: def.name,
        plan: def.plan,
        settings: mergedSettings,
      }).eq('id', orgId)
    }
  } else if (dryRun) {
    console.log('[dry-run] would create org:', def.name)
  } else {
    const { data, error } = await admin
      .from('organisations')
      .insert({ name: def.name, slug: def.slug, plan: def.plan, settings: def.settings })
      .select('id')
      .single()
    if (error) throw error
    orgId = data.id
    console.log('Created org:', def.name, orgId)
  }

  return orgId
}

async function setActiveOrg(userId, orgId) {
  if (!userId || !orgId || dryRun) return
  await admin.from('profiles').update({ org_id: orgId, active_org_id: orgId }).eq('id', userId)
}

async function main() {
  console.log('Pilot provisioning', dryRun ? '(dry-run)' : '')
  const userIds = []
  for (const email of adminEmails) {
    const userId = await ensureAuthUser(email)
    await ensureProfile(userId, email)
    if (userId) userIds.push({ email, userId })
  }

  const orgIds = []
  for (const def of PILOT_ORGS) {
    const orgId = await provisionOrg(def)
    if (orgId) orgIds.push({ name: def.name, orgId })
    for (const { userId } of userIds) {
      await ensureOrgMembership(orgId, userId, 'ADMIN')
    }
    await ensureIntegrationKey(orgId, def.name)
  }

  if (userIds.length > 0 && orgIds.length > 0) {
    const firstOrg = orgIds[0].orgId
    for (const { email, userId } of userIds) {
      await setActiveOrg(userId, firstOrg)
      console.log('Set active org to', orgIds[0].name, 'for', email)
    }
  }

  console.log('\nDone. Next steps:')
  console.log('1. Apply migration 20260620100000_profiles_active_org_id.sql if not applied.')
  console.log('2. Set staging env: FREELLMAPI_*, ALLOW_ORG_PLATFORM_AI=true, ADMIN_EMAILS.')
  console.log('3. Log into Studio staging and use org switcher to manage Talisma / Foundever.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
