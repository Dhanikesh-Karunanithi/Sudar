#!/usr/bin/env node
/**
 * Permanently delete old (non–Cursor Education) courses that were soft-hidden
 * for the job demo. Cursor Education Portfolio courses are never touched.
 *
 * Usage:
 *   node --env-file=sudar-studio/.env.local portfolio/cursor-education/scripts/purge-old-courses.mjs
 *   node --env-file=sudar-studio/.env.local portfolio/cursor-education/scripts/purge-old-courses.mjs --dry-run
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dryRun = process.argv.includes('--dry-run')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const CURSOR_ORG = '89c5fbb1-127d-4075-97cc-d4922f703659'

async function main() {
  const restorePath = join(root, 'hidden-courses.restore.local')
  let ids = []

  if (existsSync(restorePath)) {
    const restore = JSON.parse(readFileSync(restorePath, 'utf8'))
    ids = (restore.courses || []).map((c) => c.id).filter(Boolean)
    console.log('Loaded', ids.length, 'ids from hidden-courses.restore.local')
  } else {
    const { data } = await admin
      .from('courses')
      .select('id, title, org_id, status')
      .neq('org_id', CURSOR_ORG)
    ids = (data || []).map((c) => c.id)
    console.log('No restore file — targeting', ids.length, 'courses outside Cursor org')
  }

  // Safety: never delete Cursor Education courses
  const { data: cursorCourses } = await admin
    .from('courses')
    .select('id')
    .eq('org_id', CURSOR_ORG)
  const cursorIds = new Set((cursorCourses || []).map((c) => c.id))
  ids = ids.filter((id) => !cursorIds.has(id))

  if (!ids.length) {
    console.log('Nothing to purge')
    return
  }

  const { data: preview } = await admin.from('courses').select('id, title, org_id, status').in('id', ids)
  console.log(
    dryRun ? 'DRY RUN — would delete:' : 'Deleting:',
    (preview || []).map((c) => `${c.title} (${c.id})`).join('\n  '),
  )

  if (dryRun) return

  // enrollments → modules → courses
  const { error: e1 } = await admin.from('enrollments').delete().in('course_id', ids)
  if (e1) console.warn('enrollments', e1.message)

  const { error: e2 } = await admin.from('modules').delete().in('course_id', ids)
  if (e2) console.warn('modules', e2.message)

  // learning_events best-effort
  const { error: e3 } = await admin.from('learning_events').delete().in('course_id', ids)
  if (e3) console.warn('learning_events', e3.message)

  const { error: e4 } = await admin.from('courses').delete().in('id', ids)
  if (e4) throw e4

  // paths outside Cursor org that were soft-hidden
  const pathRestore = join(root, 'hidden-paths.restore.local')
  if (existsSync(pathRestore)) {
    const paths = JSON.parse(readFileSync(pathRestore, 'utf8')).paths || []
    const pathIds = paths.map((p) => p.id).filter(Boolean)
    if (pathIds.length) {
      await admin.from('enrollments').delete().in('path_id', pathIds)
      const { error } = await admin.from('learning_paths').delete().in('id', pathIds)
      if (error) console.warn('paths', error.message)
      else console.log('Deleted', pathIds.length, 'old paths')
    }
  }

  writeFileSync(
    join(root, 'purged-courses.local'),
    JSON.stringify({ purgedAt: new Date().toISOString(), ids, titles: (preview || []).map((c) => c.title) }, null, 2),
  )
  console.log('Purged', ids.length, 'courses. Cursor Education Portfolio untouched.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
