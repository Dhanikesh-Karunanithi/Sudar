#!/usr/bin/env node
/**
 * Provision sandbox / pilot organisations and grant platform super_admin.
 *
 * Historical: originally seeded Talisma + Foundever (2026-06). Those pilots are closed;
 * defaults now provision **Cavi** (personal sandbox). Pass ORG_* env to customize.
 *
 * Usage (from repo root):
 *   node --env-file=sudar-studio/.env.local scripts/ops/provision-pilot-org.mjs [--dry-run]
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   PILOT_ADMIN_EMAILS — comma-separated admins (default: connect@…)
 *   ORG_NAME — default Cavi
 *   ORG_SLUG — default cavi
 *   ORG_PLAN — default enterprise
 *
 *   ORG_SANDBOX — "0" to mark the org as non-sandbox (e.g. the tester beta org)
 *   KEEP_ACTIVE_ORG — "1" to leave the admins' home/active org unchanged
 *   SKIP_INVITE_CODE — "1" to skip minting a generic invite code (beta testers join via
 *     Studio → Users email invites, which also add them to this org)
 *
 * Beta org example (PowerShell: set the env vars with $env:NAME='value' first):
 *   ORG_NAME="Sudar Beta" ORG_SLUG=sudar-beta ORG_SANDBOX=0 KEEP_ACTIVE_ORG=1 SKIP_INVITE_CODE=1 \
 *     node --env-file=sudar-studio/.env.local scripts/ops/provision-pilot-org.mjs
 *
 * Writes local credentials (invite + integration key) to
 *   .local-backups/<slug>-credentials.local.json  (gitignored via .local-backups/)
 * Never commit invite codes.
 */
import { createHash, randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

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

const DEFAULT_ADMIN_EMAILS = ['connect@dhanikeshkarunanithi.com']

const adminEmails = (process.env.PILOT_ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAILS.join(','))
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

/** Historical pilot defs kept for reference — not provisioned unless ORG_SLUG matches. */
const HISTORICAL_PILOT_SLUGS = ['talisma', 'foundever', 'talisma-early-d737a0']

const ORG_DEFS = [
  {
    name: process.env.ORG_NAME ?? 'Cavi',
    slug: process.env.ORG_SLUG ?? 'cavi',
    plan: process.env.ORG_PLAN ?? 'enterprise',
    settings: {
      sandbox: process.env.ORG_SANDBOX !== '0',
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

function randomInviteCode(prefix) {
  return `${prefix}-${randomBytes(6).toString('base64url').toUpperCase()}`
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
    .ilike('name', `%sandbox%`)
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
    name: `${orgName} sandbox provisioning`,
    key_hash: keyHash,
    key_prefix: keyPrefix,
  })
  if (error) throw error
  console.log('\n*** SAVE INTEGRATION KEY (shown once) — also written to .local-backups ***')
  console.log(`${orgName}: ${rawKey}\n`)
  return rawKey
}

const keepActiveOrg = process.env.KEEP_ACTIVE_ORG === '1'
const skipInviteCode = process.env.SKIP_INVITE_CODE === '1'
const primarySlug = ORG_DEFS[0].slug
const invitePrefix = primarySlug.split('-')[0].toUpperCase().slice(0, 8) || 'SUDAR'

async function ensureInviteCode() {
  if (skipInviteCode) {
    console.log('Skipping generic invite code (SKIP_INVITE_CODE=1)')
    return null
  }
  const code = randomInviteCode(invitePrefix)
  if (dryRun) {
    console.log('[dry-run] would create invite:', code)
    return code
  }
  const { error } = await admin.from('invite_codes').insert({
    code,
    type: 'early_access',
    grants_tier: 'early_access',
    bonus_credits: 0,
    max_uses: 20,
    is_active: true,
  })
  if (error) throw error
  console.log('Created invite code (local only):', code)
  return code
}

async function provisionOrg(def) {
  if (HISTORICAL_PILOT_SLUGS.includes(def.slug)) {
    console.warn('Refusing historical pilot slug:', def.slug)
    return null
  }
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
  console.log('Org provisioning', dryRun ? '(dry-run)' : '', '→', ORG_DEFS.map((o) => o.name).join(', '))
  const userIds = []
  for (const email of adminEmails) {
    const userId = await ensureAuthUser(email)
    await ensureProfile(userId, email)
    if (userId) userIds.push({ email, userId })
  }

  const orgIds = []
  const credentials = {
    provisionedAt: new Date().toISOString(),
    orgs: [],
    admins: userIds.map((u) => u.email),
    inviteCode: null,
    note: 'Local only — do not commit. Share invite out-of-band.',
  }

  for (const def of ORG_DEFS) {
    const orgId = await provisionOrg(def)
    if (orgId) orgIds.push({ name: def.name, slug: def.slug, orgId })
    for (const { userId } of userIds) {
      await ensureOrgMembership(orgId, userId, 'ADMIN')
    }
    const integrationKey = await ensureIntegrationKey(orgId, def.name)
    credentials.orgs.push({
      name: def.name,
      slug: def.slug,
      orgId,
      integrationKey,
    })
  }

  credentials.inviteCode = await ensureInviteCode()

  if (userIds.length > 0 && orgIds.length > 0 && !keepActiveOrg) {
    const firstOrg = orgIds[0].orgId
    for (const { email, userId } of userIds) {
      await setActiveOrg(userId, firstOrg)
      console.log('Set active org to', orgIds[0].name, 'for', email)
    }
  }

  const credentialsFile = `${primarySlug}-credentials.local.json`
  if (!dryRun) {
    const outDir = join(process.cwd(), '.local-backups')
    mkdirSync(outDir, { recursive: true })
    const outPath = join(outDir, credentialsFile)
    writeFileSync(outPath, JSON.stringify(credentials, null, 2), 'utf8')
    console.log('\nWrote credentials to', outPath)
  }

  console.log('\nDone. Next steps:')
  console.log(
    keepActiveOrg
      ? `1. Switch to ${ORG_DEFS[0].name} with the Studio org switcher when you want to author there.`
      : `1. Log into Studio/Learn; active org should be ${ORG_DEFS[0].name} for provisioned admins.`
  )
  console.log(
    skipInviteCode
      ? `2. Invite testers by email from Studio → Users while ${ORG_DEFS[0].name} is active.`
      : `2. Share invite from .local-backups/${credentialsFile} out-of-band only.`
  )
  console.log('3. Staging remains Vercel behind CF proxy (Option B) — unchanged.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
