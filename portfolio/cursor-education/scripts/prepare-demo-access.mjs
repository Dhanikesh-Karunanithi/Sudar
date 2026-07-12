#!/usr/bin/env node
/**
 * Fix Cursor Education portfolio access for the job demo:
 * - Switch portfolio users to Cursor Education org
 * - Ensure enrollments on current courses + path
 * - Hide (draft) all other published courses; save restore map
 * - Upload Cursor brand covers onto the three courses
 *
 * Usage:
 *   node --env-file=sudar-studio/.env.local portfolio/cursor-education/scripts/prepare-demo-access.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const CURSOR_TITLES = [
  'Cursor Fluent',
  'From Isolated to Org-Wide',
  'Education Ops for a Weekly-Shipping IDE',
]

const CARD_BY_TITLE = {
  'Cursor Fluent': 'cursor-fluent',
  'From Isolated to Org-Wide': 'org-adoption',
  'Education Ops for a Weekly-Shipping IDE': 'edu-ops',
}

async function loadCreds() {
  const path = join(root, 'credentials.local')
  if (!existsSync(path)) throw new Error('Missing credentials.local')
  return JSON.parse(readFileSync(path, 'utf8'))
}

async function main() {
  const creds = await loadCreds()
  const orgId = creds.org?.id
  if (!orgId) throw new Error('credentials.local missing org.id')

  const userIds = [
    ...(creds.admins || []).map((a) => a.userId),
    ...(creds.learners || []).map((l) => l.userId),
  ].filter(Boolean)

  // 1) Switch active org
  for (const uid of userIds) {
    const { error } = await admin
      .from('profiles')
      .update({ org_id: orgId, active_org_id: orgId })
      .eq('id', uid)
    if (error) console.warn('profile update', uid, error.message)
  }
  console.log('Switched', userIds.length, 'users to Cursor Education org')

  // 2) Resolve current Cursor courses
  const { data: cursorCourses, error: cErr } = await admin
    .from('courses')
    .select('id, title, status')
    .eq('org_id', orgId)
    .in('title', CURSOR_TITLES)
  if (cErr) throw cErr
  if (!cursorCourses?.length) throw new Error('No Cursor courses found in org')

  const now = new Date().toISOString()
  for (const c of cursorCourses) {
    await admin
      .from('courses')
      .update({ status: 'published', published_at: now, updated_at: now })
      .eq('id', c.id)
  }

  const { data: pathRow } = await admin
    .from('learning_paths')
    .select('id')
    .eq('org_id', orgId)
    .eq('title', 'Cursor Developer Fluency Program')
    .maybeSingle()
  const pathId = pathRow?.id ?? null

  // 3) Enroll everyone
  for (const uid of userIds) {
    for (const c of cursorCourses) {
      const { data: ex } = await admin
        .from('enrollments')
        .select('id')
        .eq('user_id', uid)
        .eq('course_id', c.id)
        .maybeSingle()
      if (!ex) {
        const { error } = await admin.from('enrollments').insert({
          user_id: uid,
          course_id: c.id,
          status: 'active',
        })
        if (error) console.warn('enroll', c.title, error.message)
      }
    }
    if (pathId) {
      const { data: pe } = await admin
        .from('enrollments')
        .select('id')
        .eq('user_id', uid)
        .eq('path_id', pathId)
        .maybeSingle()
      if (!pe) {
        await admin.from('enrollments').insert({
          user_id: uid,
          path_id: pathId,
          status: 'active',
        })
      }
    }
  }
  console.log('Enrollments ensured for', cursorCourses.length, 'courses')

  // 4) Hide other published courses (restore map)
  const { data: others } = await admin
    .from('courses')
    .select('id, title, org_id, status')
    .eq('status', 'published')
    .neq('org_id', orgId)

  const restore = (others || []).map((c) => ({
    id: c.id,
    title: c.title,
    org_id: c.org_id,
    previous_status: c.status,
  }))

  if (restore.length) {
    const ids = restore.map((r) => r.id)
    const { error } = await admin.from('courses').update({ status: 'draft', updated_at: now }).in('id', ids)
    if (error) throw error
    writeFileSync(
      join(root, 'hidden-courses.restore.local'),
      JSON.stringify({ hiddenAt: now, courses: restore }, null, 2),
      'utf8',
    )
    console.log('Hid', restore.length, 'non-Cursor published courses (draft). Restore file written.')
  } else {
    console.log('No other published courses to hide')
  }

  // Also draft other paths outside Cursor org
  const { data: otherPaths } = await admin
    .from('learning_paths')
    .select('id, title, org_id, status')
    .eq('status', 'published')
    .neq('org_id', orgId)
  if (otherPaths?.length) {
    await admin
      .from('learning_paths')
      .update({ status: 'draft' })
      .in(
        'id',
        otherPaths.map((p) => p.id),
      )
    writeFileSync(
      join(root, 'hidden-paths.restore.local'),
      JSON.stringify({ hiddenAt: now, paths: otherPaths }, null, 2),
      'utf8',
    )
    console.log('Hid', otherPaths.length, 'non-Cursor published paths')
  }

  // 5) Upload brand covers
  const cardsDir = join(root, 'brand', 'cards')
  if (!existsSync(join(cardsDir, 'cursor-fluent-thumb.png'))) {
    console.warn('Run make-course-cards.mjs first — skipping cover upload')
  } else {
    for (const c of cursorCourses) {
      const slug = CARD_BY_TITLE[c.title]
      if (!slug) continue
      const thumbPath = `course-covers/${c.id}/thumb.png`
      const bannerPath = `course-covers/${c.id}/banner.png`
      const thumbBuf = readFileSync(join(cardsDir, `${slug}-thumb.png`))
      const bannerBuf = readFileSync(join(cardsDir, `${slug}-banner.png`))
      await admin.storage.from('course-media').upload(thumbPath, thumbBuf, {
        contentType: 'image/png',
        upsert: true,
      })
      await admin.storage.from('course-media').upload(bannerPath, bannerBuf, {
        contentType: 'image/png',
        upsert: true,
      })
      const thumbUrl = admin.storage.from('course-media').getPublicUrl(thumbPath).data.publicUrl
      const bannerUrl = admin.storage.from('course-media').getPublicUrl(bannerPath).data.publicUrl
      await admin
        .from('courses')
        .update({ thumbnail_url: thumbUrl, banner_url: bannerUrl, updated_at: now })
        .eq('id', c.id)
      console.log('Cover set', c.title)
    }
  }

  console.log('\n=== DEMO READY ===')
  console.log(
    JSON.stringify(
      {
        orgId,
        pathId,
        courses: cursorCourses.map((c) => ({ id: c.id, title: c.title })),
        learnUrls: cursorCourses.map((c) => `/courses/${c.id}/learn`),
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
