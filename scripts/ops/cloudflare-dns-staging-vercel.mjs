#!/usr/bin/env node
/**
 * Create or update staging.learn / staging.studio A records → Vercel (76.76.21.21, DNS only).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ZONE_ID = 'ec9f8f44820b216ec2aa412fbf26d250'
const VERCEL_A = '76.76.21.21'

const STAGING_HOSTS = [
  { name: 'staging.learn', fqdn: 'staging.learn.thesudar.com' },
  { name: 'staging.studio', fqdn: 'staging.studio.thesudar.com' },
]

const cfgPath = path.join(
  os.homedir(),
  'AppData/Roaming/xdg.config/.wrangler/config/default.toml',
)
const tokenFromEnv = process.env.CLOUDFLARE_API_TOKEN?.trim()
let token = tokenFromEnv
if (!token) {
  const cfg = fs.readFileSync(cfgPath, 'utf8')
  const tokenMatch = cfg.match(/oauth_token = "([^"]+)"/)
  if (!tokenMatch) {
    console.error('No CLOUDFLARE_API_TOKEN or wrangler oauth token. Run: npx wrangler login')
    process.exit(1)
  }
  token = tokenMatch[1]
}
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

async function upsertARecord({ name, fqdn }) {
  const listRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${encodeURIComponent(fqdn)}`,
    { headers },
  )
  const listJson = await listRes.json()
  if (!listJson.success) {
    console.error(`List failed for ${fqdn}:`, listJson.errors)
    process.exit(1)
  }

  const body = {
    type: 'A',
    name,
    content: VERCEL_A,
    proxied: false,
    ttl: 1,
  }

  if (listJson.result?.length) {
    const id = listJson.result[0].id
    const patchRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${id}`,
      { method: 'PATCH', headers, body: JSON.stringify(body) },
    )
    const patchJson = await patchRes.json()
    if (!patchJson.success) {
      console.error(`Patch failed for ${fqdn}:`, patchJson.errors)
      process.exit(1)
    }
    console.log('Updated:', patchJson.result.name, '→', patchJson.result.content, 'proxied:', patchJson.result.proxied)
    return
  }

  const createRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
    { method: 'POST', headers, body: JSON.stringify(body) },
  )
  const createJson = await createRes.json()
  if (!createJson.success) {
    console.error(`Create failed for ${fqdn}:`, createJson.errors)
    process.exit(1)
  }
  console.log('Created:', createJson.result.name, '→', createJson.result.content, 'proxied:', createJson.result.proxied)
}

for (const host of STAGING_HOSTS) {
  await upsertARecord(host)
}
