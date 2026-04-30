'use strict'

/**
 * Apply the Sudar Agents `agent_runs` migration via Supabase CLI (no MCP / no Dashboard paste).
 *
 * Requires a direct Postgres connection string (typically from Supabase Dashboard → Project Settings →
 * Database → Connection string → URI, using the postgres role).
 *
 *   PowerShell:
 *     $env:SUPABASE_DATABASE_URL = "postgresql://postgres:...@db.....supabase.co:5432/postgres"
 *     npm run db:apply:agent-runs
 *
 * Alternate env name: DATABASE_URL (same semantics).
 */

const { spawnSync } = require('node:child_process')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const sqlFile = path.join(root, 'supabase/migrations/20260502100000_agent_runs.sql')

const dbUrl =
  process.env.SUPABASE_DATABASE_URL?.trim() ||
  process.env.DATABASE_DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim()

if (!dbUrl) {
  console.error(
    [
      '[apply-agent-runs-sql] Missing database URL.',
      'Set SUPABASE_DATABASE_URL or DATABASE_DIRECT_URL or DATABASE_URL to your Supabase Postgres URI, then re-run:',
      '  npm run db:apply:agent-runs',
    ].join('\n'),
  )
  process.exit(1)
}

const r = spawnSync(
  'npx',
  ['--yes', 'supabase@latest', 'db', 'query', '-f', sqlFile, '--db-url', dbUrl, '--agent=yes'],
  { stdio: 'inherit', cwd: root, env: process.env, shell: true },
)

process.exit(r.status === null ? 1 : r.status)
