#!/usr/bin/env node
/**
 * Local-only clean-slate backup. Writes JSON dumps under .local-backups/
 * (gitignored). Never push these files.
 *
 * Usage (repo root):
 *   node --env-file=sudar-studio/.env.local scripts/ops/backup-clean-slate-local.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/** Tables whose rows we intend to wipe (or that cascade from orgs/courses). */
const TABLES = [
  'organisations',
  'org_members',
  'org_invites',
  'org_branding',
  'org_tags',
  'org_challenges',
  'org_challenge_progress',
  'tag_groups',
  'course_org_tags',
  'courses',
  'modules',
  'enrollments',
  'invite_codes',
  'learning_paths',
  'certifications',
  'compliance_records',
  'learning_events',
  'ai_interactions',
  'ai_usage_events',
  'ai_usage_daily_org',
  'content_chunks',
  'content_assets',
  'content_generation_jobs',
  'knowledge_bases',
  'kb_ingest_queue',
  'learner_groups',
  'learner_group_members',
  'learner_performance_records',
  'learning_domains',
  'learning_claims',
  'claim_edges',
  'claim_content_links',
  'learner_claim_mastery',
  'learning_sessions',
  'agent_runs',
  'analytics_daily_course',
  'analytics_daily_module',
  'analytics_daily_user',
  'analytics_org_rollup',
  'analytics_risk_signals',
  'analytics_feedback',
  'integration_api_keys',
  'notification_campaigns',
  'notification_templates',
  'sim_scenarios',
  'sim_crm_skins',
  'sim_sessions',
  'sim_transcripts',
  'sim_rubric_results',
  'skills',
  'skill_gaps',
  'learner_skills',
  'early_access_feedback',
  // Reference snapshot of profiles (org_id will be nulled on wipe — table kept)
  'profiles',
  'learner_profiles',
]

async function fetchAll(table) {
  const pageSize = 1000
  let from = 0
  const rows = []
  for (;;) {
    const { data, error } = await admin.from(table).select('*').range(from, from + pageSize - 1)
    if (error) {
      if (/does not exist|schema cache|Could not find/i.test(error.message)) {
        return { missing: true, rows: [] }
      }
      throw new Error(`${table}: ${error.message}`)
    }
    if (!data?.length) break
    rows.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return { missing: false, rows }
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const outDir = join(process.cwd(), '.local-backups', `clean-slate-${stamp}`)
mkdirSync(outDir, { recursive: true })

const manifest = {
  createdAt: new Date().toISOString(),
  projectUrl: url,
  purpose: 'Pre-wipe backup for clean-slate org/course delete. Local only — not for git.',
  tables: {},
}

for (const table of TABLES) {
  process.stdout.write(`dump ${table}... `)
  try {
    const { missing, rows } = await fetchAll(table)
    if (missing) {
      console.log('SKIP (missing)')
      manifest.tables[table] = { status: 'missing', rows: 0 }
      continue
    }
    const path = join(outDir, `${table}.json`)
    writeFileSync(path, JSON.stringify(rows, null, 2), 'utf8')
    console.log(`${rows.length} rows`)
    manifest.tables[table] = { status: 'ok', rows: rows.length, file: `${table}.json` }
  } catch (err) {
    console.log('ERROR', err.message)
    manifest.tables[table] = { status: 'error', error: String(err.message) }
  }
}

writeFileSync(join(outDir, '_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
writeFileSync(
  join(outDir, 'README.txt'),
  [
    'LOCAL BACKUP ONLY — do not commit or push.',
    `Created: ${manifest.createdAt}`,
    `Dir: ${outDir}`,
    'Restore is manual / selective; this is a reference dump before clean-slate wipe.',
  ].join('\n'),
  'utf8'
)

console.log('\nBackup complete:', outDir)
if (!existsSync(join(process.cwd(), '.gitignore'))) {
  console.warn('No .gitignore found — ensure .local-backups/ is ignored')
}
