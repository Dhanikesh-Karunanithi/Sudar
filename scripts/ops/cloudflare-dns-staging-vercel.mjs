#!/usr/bin/env node
/**
 * Create or update staging.learn / staging.studio A records → Vercel (76.76.21.21, DNS only).
 */

const ZONE_ID = 'ec9f8f44820b216ec2aa412fbf26d250'
const VERCEL_A = '76.76.21.21'

const STAGING_HOSTS = [
  { name: 'staging.learn', fqdn: 'staging.learn.thesudar.com' },
  { name: 'staging.studio', fqdn: 'staging.studio.thesudar.com' },
]

const tokenFromEnv = process.env.CLOUDFLARE_API_TOKEN?.trim()
if (!tokenFromEnv) {
  console.error(
    'CLOUDFLARE_API_TOKEN is required (Zone → DNS → Edit). Wrangler OAuth cannot write DNS records.',
  )
  process.exit(1)
}
const token = tokenFromEnv
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
