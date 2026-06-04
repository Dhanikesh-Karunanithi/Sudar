#!/usr/bin/env node
/**
 * Create or update intelligence.thesudar.com CNAME → sudar.onrender.com (DNS only for Render).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ZONE_ID = 'ec9f8f44820b216ec2aa412fbf26d250'
const NAME = 'intelligence'
const TARGET = 'sudar.onrender.com'

const cfgPath = path.join(
  os.homedir(),
  'AppData/Roaming/xdg.config/.wrangler/config/default.toml',
)
const cfg = fs.readFileSync(cfgPath, 'utf8')
const tokenMatch = cfg.match(/oauth_token = "([^"]+)"/)
if (!tokenMatch) {
  console.error('No wrangler oauth token. Run: npx wrangler login')
  process.exit(1)
}
const token = tokenMatch[1]
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

const listRes = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=intelligence.thesudar.com`,
  { headers },
)
const listJson = await listRes.json()
if (!listJson.success) {
  console.error('List failed:', listJson.errors)
  process.exit(1)
}

const body = {
  type: 'CNAME',
  name: NAME,
  content: TARGET,
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
    console.error('Patch failed:', patchJson.errors)
    process.exit(1)
  }
  console.log('Updated:', patchJson.result.name, '→', patchJson.result.content, 'proxied:', patchJson.result.proxied)
} else {
  const createRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
    { method: 'POST', headers, body: JSON.stringify(body) },
  )
  const createJson = await createRes.json()
  if (!createJson.success) {
    console.error('Create failed:', createJson.errors)
    process.exit(1)
  }
  console.log('Created:', createJson.result.name, '→', createJson.result.content, 'proxied:', createJson.result.proxied)
}
