#!/usr/bin/env node
/**
 * Seed 3 published SudarSim contact-center scenarios (Voice MVP Stream C).
 *
 * Idempotent upsert by org_id + source.reference (seed:voice-mvp:…).
 *
 * Usage (from sudar-studio so @supabase/supabase-js resolves):
 *   cd sudar-studio
 *   ORG_ID=<uuid> CREATED_BY=<profile-uuid> node ../scripts/seed-sudarsim-voice-scenarios.mjs
 *
 * Or look up creator by email:
 *   ORG_ID=<uuid> CREATED_BY_EMAIL=you@company.com node ../scripts/seed-sudarsim-voice-scenarios.mjs
 *
 * Optional:
 *   --dry-run          Print rows without writing
 *   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Loads sudar-studio/.env.local and sudar-learn/.env.local when present.
 *
 * See docs/SUDAR_SIM_VOICE_SEED.md
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
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
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // optional
  }
}

loadEnvFile(resolve(__dirname, '../sudar-studio/.env.local'))
loadEnvFile(resolve(__dirname, '../sudar-learn/.env.local'))

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const orgId = process.env.ORG_ID?.trim()
const createdByEnv = process.env.CREATED_BY?.trim()
const createdByEmail = process.env.CREATED_BY_EMAIL?.trim()?.toLowerCase()

if (!supabaseUrl || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

if (!orgId) {
  console.error(
    'Set ORG_ID to the target organisation UUID (placeholder — never hardcode a production org in this script).',
  )
  process.exit(1)
}

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
if (!uuidRe.test(orgId)) {
  console.error('ORG_ID must be a UUID.')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const seedPath = resolve(__dirname, 'data/sudarsim-voice-mvp-scenarios.json')
const seed = JSON.parse(readFileSync(seedPath, 'utf8'))

async function resolveCreatedBy() {
  if (createdByEnv) {
    if (!uuidRe.test(createdByEnv)) {
      throw new Error('CREATED_BY must be a profile UUID.')
    }
    return createdByEnv
  }
  if (!createdByEmail) {
    throw new Error('Set CREATED_BY (profile UUID) or CREATED_BY_EMAIL.')
  }

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  const user = data.users.find((u) => u.email?.toLowerCase() === createdByEmail)
  if (!user) throw new Error(`No auth user for CREATED_BY_EMAIL=${createdByEmail}`)
  return user.id
}

function buildRow(scenario, createdBy) {
  const now = new Date().toISOString()
  return {
    org_id: orgId,
    created_by: createdBy,
    title: scenario.title,
    locale: scenario.locale ?? seed.locale ?? 'en',
    status: scenario.status ?? 'published',
    persona: scenario.persona ?? {},
    channels: scenario.channels ?? { phone: true, chat: true, email: false },
    channel_config: scenario.channel_config ?? {},
    rubric: scenario.rubric ?? {},
    completion_rule: scenario.completion_rule ?? {
      enabled: true,
      min_overall_score: 70,
      require_must_pass: true,
    },
    compliance: scenario.compliance ?? {
      record_audio: false,
      record_transcript: true,
      retention_days: 90,
    },
    persona_state_rules: scenario.persona_state_rules ?? {},
    source: scenario.source ?? { type: 'manual', reference: `seed:voice-mvp:${scenario.slug}` },
    updated_at: now,
  }
}

async function findExisting(reference) {
  const { data, error } = await admin
    .from('sim_scenarios')
    .select('id, title, status, source')
    .eq('org_id', orgId)
    .filter('source->>reference', 'eq', reference)
    .maybeSingle()
  if (error) throw error
  return data
}

async function main() {
  const { data: org, error: orgErr } = await admin
    .from('organisations')
    .select('id, name')
    .eq('id', orgId)
    .maybeSingle()
  if (orgErr) throw orgErr
  if (!org) {
    console.error(`Organisation not found for ORG_ID=${orgId}`)
    process.exit(1)
  }

  const createdBy = await resolveCreatedBy()
  console.log(`Org: ${org.name} (${org.id})`)
  console.log(`Created by: ${createdBy}`)
  if (dryRun) console.log('Dry run — no writes.\n')

  const results = []

  for (const scenario of seed.scenarios) {
    const reference = scenario.source?.reference ?? `seed:voice-mvp:${scenario.slug}`
    const row = buildRow(scenario, createdBy)
    const existing = await findExisting(reference)

    if (dryRun) {
      results.push({
        action: existing ? 'would_update' : 'would_insert',
        id: existing?.id ?? '(new)',
        title: row.title,
        reference,
        tags: row.channel_config?.library_card?.tags,
        initial_state: row.persona_state_rules?.initial_state,
      })
      continue
    }

    if (existing?.id) {
      const { data, error } = await admin
        .from('sim_scenarios')
        .update(row)
        .eq('id', existing.id)
        .select('id, title, status')
        .single()
      if (error) throw error
      results.push({
        action: 'updated',
        id: data.id,
        title: data.title,
        status: data.status,
        reference,
        open: `/sim/session/new?scenario_id=${data.id}`,
      })
    } else {
      const { data, error } = await admin
        .from('sim_scenarios')
        .insert({ ...row, created_at: new Date().toISOString() })
        .select('id, title, status')
        .single()
      if (error) throw error
      results.push({
        action: 'inserted',
        id: data.id,
        title: data.title,
        status: data.status,
        reference,
        open: `/sim/session/new?scenario_id=${data.id}`,
      })
    }
  }

  console.log(JSON.stringify({ success: true, dryRun, scenarios: results }, null, 2))
  if (!dryRun) {
    console.log('\nOpen in Learn (authenticated learner in this org):')
    for (const r of results) {
      console.log(`  ${r.title}: ${r.open}`)
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
