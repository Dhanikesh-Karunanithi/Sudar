#!/usr/bin/env node
/**
 * Provision Cursor Education Portfolio org, test users, and early-access invite codes.
 *
 * Usage (from repo root, with Studio env loaded):
 *   node --env-file=sudar-studio/.env.local scripts/ops/provision-cursor-education-org.mjs [--dry-run]
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: CURSOR_EDU_ADMIN_EMAILS (comma-separated)
 */
import { createHash, randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dryRun = process.argv.includes('--dry-run')
const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '../..')

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

const adminEmails = (process.env.CURSOR_EDU_ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAILS.join(','))
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

const ORG = {
  name: 'Cursor Education Portfolio',
  slug: 'cursor-education',
  plan: 'enterprise',
  settings: {
    portfolio: true,
    purpose: 'Director Product Education Engineering application showcase',
    ai_platform: { enabled: true, label: 'Sudar AI', model: 'auto' },
    ai_entitlements: {
      monthly_token_allowance: 10_000_000,
      warn_threshold_pct: 80,
      hard_stop: false,
    },
  },
}

const TEST_LEARNERS = [
  {
    email: 'demo.ic.cursor-edu@sudar.local',
    full_name: 'Demo IC Developer',
    role: 'LEARNER',
    passwordHint: 'IC path walker',
  },
  {
    email: 'demo.lead.cursor-edu@sudar.local',
    full_name: 'Demo Eng Leader',
    role: 'LEARNER',
    passwordHint: 'Leader path walker',
  },
  {
    email: 'hire.reviewer.cursor-edu@sudar.local',
    full_name: 'Hiring Reviewer Guest',
    role: 'LEARNER',
    passwordHint: 'Hiring manager guest',
  },
]

const INVITE_CODES = [
  { code: 'CURSOR-HIRE-01', max_uses: 5, type: 'tester', grants_tier: 'tester' },
  { code: 'CURSOR-HIRE-02', max_uses: 5, type: 'early_access', grants_tier: 'early_access' },
  { code: 'CURSOR-HIRE-03', max_uses: 3, type: 'tester', grants_tier: 'unlimited' },
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

async function ensureAuthUser(email, fullName, temporaryPassword) {
  const existing = await findUserIdByEmail(email)
  if (existing) {
    if (!dryRun && temporaryPassword) {
      await admin.auth.admin.updateUserById(existing, { password: temporaryPassword })
    }
    return { userId: existing, created: false, password: temporaryPassword }
  }

  if (dryRun) {
    console.log('[dry-run] would create auth user:', email)
    return { userId: null, created: false, password: temporaryPassword }
  }

  const password = temporaryPassword ?? randomBytes(12).toString('base64url') + 'Aa1!'
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) throw error
  console.log('Created auth user:', email, data.user.id)
  return { userId: data.user.id, created: true, password }
}

async function ensureAdminProfile(userId, email) {
  if (!userId) return
  const { data: existing } = await admin.from('profiles').select('id').eq('id', userId).maybeSingle()
  const patch = {
    id: userId,
    role: 'SUPER_ADMIN',
    access_tier: 'unlimited',
    signup_code_used: 'GRANDFATHERED',
    full_name: email.split('@')[0],
  }
  if (dryRun) {
    console.log('[dry-run] would upsert admin profile:', email)
    return
  }
  if (existing) {
    await admin
      .from('profiles')
      .update({
        role: 'SUPER_ADMIN',
        access_tier: 'unlimited',
        signup_code_used: 'GRANDFATHERED',
      })
      .eq('id', userId)
  } else {
    await admin.from('profiles').insert(patch)
  }
  console.log('Admin profile ready:', email)
}

async function ensureLearnerProfile(userId, fullName) {
  if (!userId || dryRun) return
  const { data: existing } = await admin.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (existing) {
    await admin
      .from('profiles')
      .update({
        full_name: fullName,
        access_tier: 'tester',
        signup_code_used: 'ORG_PROVISIONED',
      })
      .eq('id', userId)
  } else {
    await admin.from('profiles').insert({
      id: userId,
      role: 'LEARNER',
      access_tier: 'tester',
      signup_code_used: 'ORG_PROVISIONED',
      full_name: fullName,
    })
  }
}

async function ensureOrgMembership(orgId, userId, role = 'ADMIN') {
  if (!userId) return
  const { data } = await admin
    .from('org_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  if (data) return
  if (dryRun) {
    console.log('[dry-run] would add org member', userId, role)
    return
  }
  const { error } = await admin.from('org_members').insert({ org_id: orgId, user_id: userId, role })
  if (error) throw error
  console.log('Added org member:', userId, role)
}

async function provisionOrg() {
  const { data: existing } = await admin
    .from('organisations')
    .select('id, settings')
    .eq('slug', ORG.slug)
    .maybeSingle()

  if (existing?.id) {
    console.log('Org exists:', ORG.name, existing.id)
    if (!dryRun) {
      const merged = {
        ...(typeof existing.settings === 'object' && existing.settings ? existing.settings : {}),
        ...ORG.settings,
      }
      await admin
        .from('organisations')
        .update({ name: ORG.name, plan: ORG.plan, settings: merged })
        .eq('id', existing.id)
    }
    return existing.id
  }

  if (dryRun) {
    console.log('[dry-run] would create org:', ORG.name)
    return null
  }

  const { data, error } = await admin
    .from('organisations')
    .insert({ name: ORG.name, slug: ORG.slug, plan: ORG.plan, settings: ORG.settings })
    .select('id')
    .single()
  if (error) throw error
  console.log('Created org:', ORG.name, data.id)
  return data.id
}

async function ensureIntegrationKey(orgId) {
  if (!orgId) return null
  const { data: existing } = await admin
    .from('integration_api_keys')
    .select('id')
    .eq('org_id', orgId)
    .ilike('name', '%cursor education%')
    .limit(1)
    .maybeSingle()
  if (existing) {
    console.log('Integration key already exists')
    return null
  }
  const rawKey = 'alp_' + randomBytes(32).toString('hex')
  if (dryRun) {
    console.log('[dry-run] would create integration key')
    return rawKey
  }
  const { error } = await admin.from('integration_api_keys').insert({
    org_id: orgId,
    name: 'Cursor Education Portfolio provisioning',
    key_hash: hashKey(rawKey),
    key_prefix: rawKey.slice(0, 8),
  })
  if (error) throw error
  console.log('\n*** SAVE INTEGRATION KEY (shown once) ***')
  console.log(rawKey, '\n')
  return rawKey
}

async function ensureInviteCodes() {
  const created = []
  for (const inv of INVITE_CODES) {
    const { data: existing } = await admin
      .from('invite_codes')
      .select('id, code')
      .eq('code', inv.code)
      .maybeSingle()
    if (existing) {
      console.log('Invite code exists:', inv.code)
      created.push({ ...inv, status: 'exists' })
      continue
    }
    if (dryRun) {
      console.log('[dry-run] would create invite:', inv.code)
      created.push({ ...inv, status: 'dry-run' })
      continue
    }
    const { error } = await admin.from('invite_codes').insert({
      code: inv.code,
      type: inv.type,
      grants_tier: inv.grants_tier,
      bonus_credits: 0,
      max_uses: inv.max_uses,
      is_active: true,
    })
    if (error) throw error
    console.log('Created invite code:', inv.code)
    created.push({ ...inv, status: 'created' })
  }
  return created
}

async function setActiveOrg(userId, orgId) {
  if (!userId || !orgId || dryRun) return
  await admin.from('profiles').update({ org_id: orgId, active_org_id: orgId }).eq('id', userId)
}

async function main() {
  console.log('Cursor Education Portfolio provisioning', dryRun ? '(dry-run)' : '')
  const credentials = {
    org: ORG,
    admins: [],
    learners: [],
    inviteCodes: [],
    integrationKey: null,
    provisionedAt: new Date().toISOString(),
  }

  const orgId = await provisionOrg()
  credentials.org.id = orgId

  for (const email of adminEmails) {
    const { userId } = await ensureAuthUser(email, email.split('@')[0])
    await ensureAdminProfile(userId, email)
    await ensureOrgMembership(orgId, userId, 'ADMIN')
    await setActiveOrg(userId, orgId)
    credentials.admins.push({ email, userId })
  }

  for (const learner of TEST_LEARNERS) {
    const password = 'CursorEdu-' + randomBytes(6).toString('base64url') + '1!'
    const { userId, created } = await ensureAuthUser(learner.email, learner.full_name, password)
    await ensureLearnerProfile(userId, learner.full_name)
    await ensureOrgMembership(orgId, userId, learner.role)
    await setActiveOrg(userId, orgId)
    credentials.learners.push({
      email: learner.email,
      full_name: learner.full_name,
      role: learner.role,
      password,
      created,
      hint: learner.passwordHint,
      userId,
    })
    console.log('Learner ready:', learner.email, created ? '(new)' : '(password reset)')
  }

  credentials.integrationKey = await ensureIntegrationKey(orgId)
  credentials.inviteCodes = await ensureInviteCodes()

  const outPath = join(repoRoot, 'portfolio/cursor-education/credentials.local')
  if (!dryRun) {
    mkdirSync(join(repoRoot, 'portfolio/cursor-education'), { recursive: true })
    writeFileSync(outPath, JSON.stringify(credentials, null, 2), 'utf8')
    console.log('\nWrote credentials to portfolio/cursor-education/credentials.local')
    console.log('(gitignored via *.local — do not commit)')
  }

  console.log('\nDone. Next:')
  console.log('1. Build SCORMs: node portfolio/cursor-education/scripts/build-scorm.mjs')
  console.log('2. Upload: node --env-file=sudar-studio/.env.local portfolio/cursor-education/scripts/upload-to-sudar.mjs')
  console.log('3. Share CURSOR-HIRE-* codes with hiring reviewers for self-signup.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
