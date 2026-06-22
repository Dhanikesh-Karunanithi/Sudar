#!/usr/bin/env node
/**
 * Merge thesudar.com auth redirect URLs into Supabase project auth config.
 * Requires SUPABASE_ACCESS_TOKEN (fine-grained: auth_config_write + project_admin_write).
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/ops/patch-supabase-auth-urls.mjs
 */
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? 'qnsrrboprydmjyormlky'
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

const ADDITIONAL = [
  'https://learn.thesudar.com/**',
  'https://studio.thesudar.com/**',
  'https://staging.learn.thesudar.com/**',
  'https://staging.studio.thesudar.com/**',
  'https://sudar-learn.vercel.app/**',
  'https://sudar-studio.vercel.app/**',
  'https://mcp.thesudar.com/oauth/callback',
]

if (!TOKEN) {
  console.error('Set SUPABASE_ACCESS_TOKEN (Supabase dashboard → Account → Access Tokens).')
  process.exit(1)
}

const base = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`

const getRes = await fetch(base, {
  headers: { Authorization: `Bearer ${TOKEN}` },
})
if (!getRes.ok) {
  console.error('GET auth config failed:', getRes.status, await getRes.text())
  process.exit(1)
}

const current = await getRes.json()
const existing = String(current.uri_allow_list ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const merged = [...new Set([...existing, ...ADDITIONAL])]
const SITE_URL = process.env.SUPABASE_SITE_URL ?? 'https://learn.thesudar.com'

const patchRes = await fetch(base, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    site_url: SITE_URL,
    uri_allow_list: merged.join(','),
  }),
})

if (!patchRes.ok) {
  console.error('PATCH auth config failed:', patchRes.status, await patchRes.text())
  process.exit(1)
}

console.log('Updated site_url:', SITE_URL)
console.log('Updated uri_allow_list with:', ADDITIONAL.join(', '))
