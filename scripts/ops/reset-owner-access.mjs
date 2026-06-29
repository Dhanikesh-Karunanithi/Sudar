#!/usr/bin/env node
/**
 * Reset owner/admin login access with a one-time password.
 *
 * Usage (from sudar-studio, which has @supabase/supabase-js):
 *   cd sudar-studio && node ../scripts/ops/reset-owner-access.mjs [--dry-run]
 *
 * Optional env:
 *   RESET_OWNER_EMAILS — comma-separated (default: connect@ + foundever dot email)
 */
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dryRun = process.argv.includes('--dry-run')

function loadEnvFile(path) {
  try {
    const raw = readFileSync(path, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // optional file
  }
}

loadEnvFile(resolve(__dirname, '../../sudar-studio/.env.local'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in sudar-studio/.env.local')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEFAULT_EMAILS = [
  'connect@dhanikeshkarunanithi.com',
  'dhanikesh.karunanithi@foundever.com',
]

const emails = (process.env.RESET_OWNER_EMAILS ?? DEFAULT_EMAILS.join(','))
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

function tempPassword() {
  const base = randomBytes(10).toString('base64url')
  return `Sudar-${base}1!`
}

async function findUserIdByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  return data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null
}

async function resetEmail(email) {
  const userId = await findUserIdByEmail(email)
  if (!userId) {
    console.log('SKIP (no auth user):', email)
    return
  }

  const password = tempPassword()
  const fullName =
    email === 'connect@dhanikeshkarunanithi.com'
      ? 'Dhanikesh Karunanithi'
      : email.startsWith('dhanikesh')
        ? 'Dhanikesh Karunanithi'
        : email.split('@')[0]

  if (dryRun) {
    console.log('[dry-run] would reset:', email, userId)
    return
  }

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (authError) throw authError

  const profilePatch = {
    full_name: fullName,
    require_password_change: true,
    access_tier: 'unlimited',
    signup_code_used: 'GRANDFATHERED',
    role: 'SUPER_ADMIN',
  }

  const { data: existing } = await admin.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (existing) {
    await admin.from('profiles').update(profilePatch).eq('id', userId)
  } else {
    await admin.from('profiles').insert({ id: userId, ...profilePatch })
  }

  const { data: lp } = await admin.from('learner_profiles').select('id').eq('user_id', userId).maybeSingle()
  if (!lp) await admin.from('learner_profiles').insert({ user_id: userId })

  console.log('\n*** LOGIN CREDENTIALS (change password after first sign-in) ***')
  console.log(`Email:    ${email}`)
  console.log(`Password: ${password}`)
  console.log(`User id:  ${userId}\n`)
}

async function main() {
  console.log('Resetting owner access', dryRun ? '(dry-run)' : '')
  for (const email of emails) {
    await resetEmail(email)
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
