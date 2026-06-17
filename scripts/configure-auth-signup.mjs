/**
 * Configure auth: email confirmation + before-user-created hook for early access.
 * Requires SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens
 * Run from repo root: node scripts/configure-auth-signup.mjs
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvValue(key: string, paths: string[]): string | null {
  if (process.env[key]?.trim()) return process.env[key]!.trim()
  for (const envPath of paths) {
    try {
      const raw = readFileSync(envPath, 'utf8')
      for (const line of raw.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.startsWith(`${key}=`)) {
          return trimmed.slice(key.length + 1).trim()
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

const token = loadEnvValue('SUPABASE_ACCESS_TOKEN', [
  resolve(__dirname, '../sudar-studio/.env.local'),
  resolve(__dirname, '../sudar-learn/.env.local'),
])

const projectRef =
  loadEnvValue('SUPABASE_PROJECT_REF', [
    resolve(__dirname, '../sudar-studio/.env.local'),
    resolve(__dirname, '../sudar-learn/.env.local'),
  ]) ??
  process.env.SUPABASE_PROJECT_REF ??
  'qnsrrboprydmjyormlky'

if (!token || !projectRef) {
  console.log('SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF are required.')
  console.log('Set them in sudar-studio/.env.local or sudar-learn/.env.local, then re-run.')
  console.log('Token: https://supabase.com/dashboard/account/tokens')
  console.log('Project ref: Supabase Dashboard → Project Settings → General')
  console.log('\nManual fallback:')
  console.log(`  Hook: https://supabase.com/dashboard/project/${projectRef ?? '<ref>'}/auth/hooks`)
  console.log('        Before User Created → Postgres → public.hook_before_user_created')
  process.exit(process.env.REQUIRE_AUTH_CONFIG === '1' ? 1 : 0)
}

async function main() {
  const getRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!getRes.ok) {
    console.error('Failed to read auth config:', getRes.status, await getRes.text())
    process.exit(1)
  }
  const current = await getRes.json()
  console.log('Current mailer_autoconfirm:', current.mailer_autoconfirm)
  console.log('Current hook_before_user_created:', current.hook_before_user_created_enabled)

  const patchBody = {
    mailer_autoconfirm: false,
    hook_before_user_created_enabled: true,
    hook_before_user_created_uri: 'pg-functions://postgres/public/hook_before_user_created',
  }

  const patchRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patchBody),
  })

  if (!patchRes.ok) {
    const body = await patchRes.text()
    console.error('PATCH failed:', patchRes.status, body)
    console.log('\nWire manually: Authentication → Hooks → Before User Created → public.hook_before_user_created')
    process.exit(1)
  }

  const updated = await patchRes.json()
  console.log('Updated mailer_autoconfirm:', updated.mailer_autoconfirm)
  console.log('Updated hook_before_user_created_enabled:', updated.hook_before_user_created_enabled)
  console.log('Updated hook_before_user_created_uri:', updated.hook_before_user_created_uri)
}

main().catch(console.error)
