#!/usr/bin/env node
/**
 * Provision QA persona accounts inside an existing org (default: Sudar Beta) so browser
 * agents and the Playwright loop can exercise the product as real users.
 *
 * Usage (from repo root):
 *   node --env-file=sudar-studio/.env.local scripts/ops/provision-persona-testers.mjs [--dry-run]
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   ORG_SLUG — target org (default sudar-beta; the org must already exist)
 *   PERSONA_EMAIL_PREFIX — local part before "+" (default qa)
 *   PERSONA_EMAIL_DOMAIN — default thesudar.com
 *   ROTATE_PASSWORDS — "1" to reset passwords for personas that already exist
 *
 * Users are created with confirmed emails (no mail is sent). Passwords are written to
 *   .local-backups/<slug>-personas.local.json  (gitignored). Never commit them.
 */
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

const orgSlug = process.env.ORG_SLUG ?? 'sudar-beta'
const emailPrefix = process.env.PERSONA_EMAIL_PREFIX ?? 'qa'
const emailDomain = process.env.PERSONA_EMAIL_DOMAIN ?? 'thesudar.com'
const rotatePasswords = process.env.ROTATE_PASSWORDS === '1'

const PERSONAS = [
  { key: 'priya', fullName: 'Priya Raman', role: 'CREATOR', summary: 'L&D manager, non-technical course author' },
  { key: 'arjun', fullName: 'Arjun Mehta', role: 'LEARNER', summary: 'New-hire learner on a phone, low patience' },
  { key: 'meera', fullName: 'Meera Iyer', role: 'LEARNER', summary: 'Curious self-learner using SudarNotes' },
  { key: 'rahul', fullName: 'Rahul Verma', role: 'LEARNER', summary: 'Sales rep practising with SudarSim' },
  { key: 'sam', fullName: 'Sam Okafor', role: 'LEARNER', summary: 'Accessibility-first, keyboard-only learner' },
  { key: 'skeptic', fullName: 'Kai Skeptic', role: 'LEARNER', summary: 'Adversarial tester probing limits' },
]

function personaEmail(key) {
  return `${emailPrefix}+${key}@${emailDomain}`.toLowerCase()
}

function newPassword() {
  return randomBytes(16).toString('base64url') + 'Aa1!'
}

async function findUserIdByEmail(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const user = data.users.find((u) => u.email?.toLowerCase() === email)
    if (user) return user.id
    if (data.users.length < 1000) return null
  }
  return null
}

async function ensureUser(persona, previousPassword) {
  const email = personaEmail(persona.key)
  const existingId = await findUserIdByEmail(email)
  if (existingId) {
    if (!rotatePasswords && previousPassword) return { userId: existingId, password: previousPassword }
    const password = newPassword()
    if (dryRun) {
      console.log('[dry-run] would reset password for', email)
      return { userId: existingId, password: null }
    }
    const { error } = await admin.auth.admin.updateUserById(existingId, { password })
    if (error) throw error
    console.log('Reset password:', email)
    return { userId: existingId, password }
  }
  if (dryRun) {
    console.log('[dry-run] would create', email)
    return { userId: null, password: null }
  }
  const password = newPassword()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: persona.fullName, qa_persona: persona.key },
  })
  if (error) throw error
  console.log('Created:', email)
  return { userId: data.user.id, password }
}

async function ensureProfile(userId, persona, orgId) {
  if (!userId || dryRun) return
  const patch = {
    full_name: persona.fullName,
    access_tier: 'tester',
    signup_code_used: 'ORG_PROVISIONED',
    org_id: orgId,
    active_org_id: orgId,
  }
  const { data: existing } = await admin.from('profiles').select('id').eq('id', userId).maybeSingle()
  const { error } = existing
    ? await admin.from('profiles').update(patch).eq('id', userId)
    : await admin.from('profiles').insert({ id: userId, ...patch })
  if (error) throw error
}

async function ensureMembership(userId, orgId, role) {
  if (!userId || dryRun) return
  const { data } = await admin
    .from('org_members')
    .select('id, role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  if (data) {
    if (data.role !== role) await admin.from('org_members').update({ role }).eq('id', data.id)
    return
  }
  const { error } = await admin.from('org_members').insert({ org_id: orgId, user_id: userId, role })
  if (error) throw error
}

async function main() {
  const { data: org, error: orgErr } = await admin
    .from('organisations')
    .select('id, name')
    .eq('slug', orgSlug)
    .maybeSingle()
  if (orgErr) throw orgErr
  if (!org) {
    console.error(`Org "${orgSlug}" not found. Provision it first (scripts/ops/provision-pilot-org.mjs).`)
    process.exit(1)
  }

  const outDir = join(process.cwd(), '.local-backups')
  const outPath = join(outDir, `${orgSlug}-personas.local.json`)
  const previous = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : { personas: [] }
  const previousByEmail = new Map((previous.personas ?? []).map((p) => [p.email, p.password]))

  console.log(`Persona provisioning ${dryRun ? '(dry-run) ' : ''}-> ${org.name}`)
  const results = []
  for (const persona of PERSONAS) {
    const email = personaEmail(persona.key)
    const { userId, password } = await ensureUser(persona, previousByEmail.get(email))
    await ensureProfile(userId, persona, org.id)
    await ensureMembership(userId, org.id, persona.role)
    results.push({ key: persona.key, fullName: persona.fullName, role: persona.role, summary: persona.summary, email, password })
  }

  if (dryRun) return
  mkdirSync(outDir, { recursive: true })
  writeFileSync(
    outPath,
    JSON.stringify(
      { provisionedAt: new Date().toISOString(), org: org.name, orgSlug, note: 'Local only - do not commit.', personas: results },
      null,
      2
    ),
    'utf8'
  )
  console.log('\nWrote', outPath)
  console.log('Learner emails for seed-demo LEARNER_EMAILS:')
  console.log(results.filter((r) => r.role === 'LEARNER').map((r) => r.email).join(','))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
