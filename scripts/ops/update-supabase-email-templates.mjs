#!/usr/bin/env node
/**
 * Push Supabase Auth email templates from supabase/templates/*.html
 * and set production site_url (removes vercel.app from invite copy).
 *
 * Requires SUPABASE_ACCESS_TOKEN with access to the Sudar project and
 * fine-grained permission `auth_config_write`.
 * https://supabase.com/dashboard/account/tokens
 *
 * Usage:
 *   node scripts/ops/update-supabase-email-templates.mjs
 *   node scripts/ops/update-supabase-email-templates.mjs --dry-run
 *   node scripts/ops/update-supabase-email-templates.mjs --only=invite
 *   node scripts/ops/update-supabase-email-templates.mjs --print-dashboard
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')
const TEMPLATES_DIR = resolve(ROOT, 'supabase/templates')
const ENV_PATHS = [
  resolve(ROOT, 'sudar-studio/.env.local'),
  resolve(ROOT, 'sudar-learn/.env.local'),
]

const dryRun = process.argv.includes('--dry-run')
const printDashboard = process.argv.includes('--print-dashboard')
const onlyFlag = process.argv.find((a) => a.startsWith('--only='))
const only = onlyFlag ? onlyFlag.slice('--only='.length) : null

function loadEnvValue(key, paths = ENV_PATHS) {
  if (process.env[key]?.trim()) return process.env[key].trim()
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

function projectRefFromSupabaseUrl(url) {
  if (!url) return null
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/)
  return match?.[1] ?? null
}

const token = loadEnvValue('SUPABASE_ACCESS_TOKEN')

const projectRef =
  loadEnvValue('SUPABASE_PROJECT_REF') ??
  projectRefFromSupabaseUrl(loadEnvValue('NEXT_PUBLIC_SUPABASE_URL')) ??
  process.env.SUPABASE_PROJECT_REF ??
  'qnsrrboprydmjyormlky'

const SITE_URL = process.env.SUPABASE_SITE_URL ?? 'https://studio.thesudar.com'

/** Maps local filename (without .html) → Supabase auth config fields */
const TEMPLATE_MAP = {
  invite: {
    subjectKey: 'mailer_subjects_invite',
    contentKey: 'mailer_templates_invite_content',
    subject: "You're invited to Sudar",
    file: 'invite.html',
  },
}

async function listAccessibleProjects(accessToken) {
  const res = await fetch('https://api.supabase.com/v1/projects', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return res.json()
}

function printAccessHelp(projectRefValue, accessible) {
  const names = accessible?.map((p) => `${p.name} (${p.ref})`).join(', ') ?? 'none'
  console.error('\nToken cannot manage auth config for project:', projectRefValue)
  console.error('Projects this token can access:', names)
  console.error('\nFix: create a new token at https://supabase.com/dashboard/account/tokens')
  console.error('  - Scope it to the Sudar project (ref above from NEXT_PUBLIC_SUPABASE_URL)')
  console.error('  - Enable permission: auth_config_write (Auth configuration → Update)')
  console.error('  - Or use a classic full-access token on an Owner/Admin account')
  console.error('\nManual fallback (Dashboard):')
  console.error(`  https://supabase.com/dashboard/project/${projectRefValue}/auth/templates`)
  console.error('  → Invite user → paste HTML from supabase/templates/invite.html')
  console.error(`  → URL configuration → Site URL = ${SITE_URL}`)
}

async function verifyProjectAccess(accessToken, projectRefValue) {
  const projects = await listAccessibleProjects(accessToken)
  if (!projects) return true
  const allowed = projects.some((p) => p.ref === projectRefValue)
  if (!allowed) {
    printAccessHelp(projectRefValue, projects)
    return false
  }
  return true
}

async function main() {
  if (!token) {
    console.error('Set SUPABASE_ACCESS_TOKEN in sudar-studio/.env.local or sudar-learn/.env.local')
    console.error('Create one at https://supabase.com/dashboard/account/tokens')
    process.exit(1)
  }

  console.log('Target project:', projectRef)

  const patchBody = {
    site_url: SITE_URL,
  }

  for (const [name, cfg] of Object.entries(TEMPLATE_MAP)) {
    if (only && only !== name) continue
    const htmlPath = resolve(TEMPLATES_DIR, cfg.file)
    const content = readFileSync(htmlPath, 'utf8')
    patchBody[cfg.subjectKey] = cfg.subject
    patchBody[cfg.contentKey] = content
    console.log(`Prepared ${name}: ${cfg.file} (${content.length} chars)`)
  }

  if (printDashboard) {
    const invite = TEMPLATE_MAP.invite
    console.log('\n--- Dashboard paste (Invite user) ---')
    console.log('Subject:', invite.subject)
    console.log('Body:\n')
    console.log(patchBody[invite.contentKey])
    return
  }

  if (dryRun) {
    const ok = await verifyProjectAccess(token, projectRef)
    console.log('\nDry run — would PATCH:', ok ? 'allowed' : 'blocked (see errors above)')
    console.log(JSON.stringify({
      project_ref: projectRef,
      site_url: patchBody.site_url,
      templateKeys: Object.keys(patchBody).filter((k) => k.startsWith('mailer_')),
    }, null, 2))
    process.exit(ok ? 0 : 1)
  }

  if (!(await verifyProjectAccess(token, projectRef))) {
    process.exit(1)
  }

  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patchBody),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('PATCH failed:', res.status, body)
    if (res.status === 403) {
      const projects = await listAccessibleProjects(token)
      printAccessHelp(projectRef, projects)
    }
    process.exit(1)
  }

  const updated = await res.json()
  console.log('Updated site_url:', updated.site_url)
  for (const [name, cfg] of Object.entries(TEMPLATE_MAP)) {
    if (only && only !== name) continue
    console.log(`Updated ${name} subject:`, updated[cfg.subjectKey])
  }
  console.log('\nDone. Send a test invite from Studio → Users to verify branding.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
