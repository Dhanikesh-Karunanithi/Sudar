#!/usr/bin/env node
/**
 * Patch Render sudar-intelligence env: CORS_ORIGINS + ALLOW_ORG_PLATFORM_AI for staging.
 *
 * Requires RENDER_API_KEY (https://dashboard.render.com/u/settings#api-keys)
 * Optional: RENDER_SERVICE_ID (auto-detects service named sudar-intelligence)
 *
 * Usage:
 *   export RENDER_API_KEY=rnd_...
 *   node scripts/ops/patch-render-intelligence-cors.mjs
 */
const RENDER_API_KEY = process.env.RENDER_API_KEY?.trim()
if (!RENDER_API_KEY) {
  console.error('Set RENDER_API_KEY (Render dashboard → Account Settings → API Keys)')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${RENDER_API_KEY}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

const CORS_ORIGINS =
  'https://learn.thesudar.com,https://studio.thesudar.com,https://staging.learn.thesudar.com,https://staging.studio.thesudar.com,https://sudar-learn.vercel.app,https://sudar-studio.vercel.app'

async function renderFetch(path, init = {}) {
  const res = await fetch(`https://api.render.com/v1${path}`, { ...init, headers: { ...headers, ...init.headers } })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    console.error(`Render API ${init.method ?? 'GET'} ${path} → ${res.status}`, json)
    process.exit(1)
  }
  return json
}

let serviceId = process.env.RENDER_SERVICE_ID?.trim()
if (!serviceId) {
  const services = await renderFetch('/services?limit=100')
  const match = (services ?? []).find((row) => {
    const svc = row.service ?? row
    return svc?.name === 'sudar-intelligence' || svc?.slug === 'sudar-intelligence'
  })
  const svc = match?.service ?? match
  if (!svc?.id) {
    console.error('Could not find sudar-intelligence service. Set RENDER_SERVICE_ID.')
    process.exit(1)
  }
  serviceId = svc.id
  console.log('Found service:', svc.name, serviceId)
}

const envVars = await renderFetch(`/services/${serviceId}/env-vars`)
const existing = new Map((envVars ?? []).map((row) => {
  const ev = row.envVar ?? row
  return [ev.key, ev.value]
}))

const updates = {
  CORS_ORIGINS,
  ALLOW_ORG_PLATFORM_AI: 'true',
}

for (const [key, value] of Object.entries(updates)) {
  if (existing.get(key) === value) {
    console.log(`OK (unchanged): ${key}`)
    continue
  }
  await renderFetch(`/services/${serviceId}/env-vars`, {
    method: 'PUT',
    body: JSON.stringify([{ key, value }]),
  })
  console.log(`Updated: ${key}`)
}

console.log('Trigger redeploy in Render dashboard or push a commit to redeploy.')
