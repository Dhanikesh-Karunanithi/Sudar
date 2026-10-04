#!/usr/bin/env node
/**
 * Seed a tester-ready demo into one organisation (idempotent):
 *   - 2 hand-authored, published courses (scripts/data/demo-courses.json)
 *   - 3 SudarSim voice scenarios, with the practice module linked to one
 *   - a Teaching OS domain + claims per course (from module learning objectives)
 *   - optional enrolment of tester learners
 *
 * Usage (repo root):
 *   ORG_SLUG=<slug> CREATED_BY_EMAIL=<admin email> node scripts/seed-demo.mjs [--dry-run]
 *   ORG_ID=<uuid>   CREATED_BY_EMAIL=<admin email> LEARNER_EMAILS=a@x.com,b@y.com node scripts/seed-demo.mjs
 *
 * Reads sudar-studio/.env.local and sudar-learn/.env.local for Supabase credentials.
 */
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const { createClient } = createRequire(resolve(__dirname, '../sudar-studio/package.json'))('@supabase/supabase-js')
const dryRun = process.argv.includes('--dry-run')

function loadEnvFile(path) {
  try {
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // optional file
  }
}
loadEnvFile(resolve(__dirname, '../sudar-studio/.env.local'))
loadEnvFile(resolve(__dirname, '../sudar-learn/.env.local'))

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or add them to sudar-studio/.env.local).')
  process.exit(1)
}
const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const seed = JSON.parse(readFileSync(resolve(__dirname, 'data/demo-courses.json'), 'utf8'))

async function findUserIdByEmail(email) {
  const target = email.trim().toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === target)
    if (hit) return hit.id
    if (data.users.length < 200) break
  }
  return null
}

async function resolveOrg() {
  const orgId = process.env.ORG_ID?.trim()
  const orgSlug = process.env.ORG_SLUG?.trim()
  if (!orgId && !orgSlug) throw new Error('Set ORG_ID or ORG_SLUG (never hardcode an org in this script).')
  const query = admin.from('organisations').select('id, name, slug')
  const { data, error } = await (orgId ? query.eq('id', orgId) : query.eq('slug', orgSlug)).maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`Organisation not found (${orgId ?? orgSlug}). Provision it with scripts/ops/provision-pilot-org.mjs.`)
  return data
}

function seedSimScenarios(orgId, createdBy) {
  const result = spawnSync(process.execPath, [resolve(__dirname, 'seed-sudarsim-voice-scenarios.mjs'), ...(dryRun ? ['--dry-run'] : [])], {
    env: { ...process.env, ORG_ID: orgId, CREATED_BY: createdBy },
    encoding: 'utf8',
  })
  if (result.status !== 0) throw new Error(`Sim scenario seed failed: ${result.stderr || result.stdout}`)
  const jsonStart = result.stdout.indexOf('{')
  const parsed = JSON.parse(result.stdout.slice(jsonStart, result.stdout.lastIndexOf('}') + 1))
  const bySlug = {}
  for (const s of parsed.scenarios ?? []) {
    const slug = String(s.reference ?? '').replace('seed:voice-mvp:', '')
    if (slug && s.id && s.id !== '(new)') bySlug[slug] = s.id
  }
  return bySlug
}

async function upsertCourse(org, createdBy, course) {
  const { data: existing, error: findErr } = await admin
    .from('courses')
    .select('id')
    .eq('org_id', org.id)
    .filter('settings->>seed_reference', 'eq', course.reference)
    .maybeSingle()
  if (findErr) throw findErr

  const now = new Date().toISOString()
  const row = {
    org_id: org.id,
    created_by: createdBy,
    title: course.title,
    description: course.description,
    status: 'published',
    difficulty: course.difficulty,
    estimated_duration_mins: course.estimated_duration_mins,
    tags: course.tags,
    target_skills: course.target_skills,
    settings: { seed_reference: course.reference, demo: true, review: { status: 'approved', reviewed_by: 'seed' } },
    published_at: now,
    updated_at: now,
  }
  if (dryRun) return { id: existing?.id ?? '(new)', created: !existing }
  if (existing?.id) {
    const { error } = await admin.from('courses').update(row).eq('id', existing.id)
    if (error) throw error
    return { id: existing.id, created: false }
  }
  const { data, error } = await admin.from('courses').insert(row).select('id').single()
  if (error) throw error
  return { id: data.id, created: true }
}

async function replaceModules(courseId, modules, simBySlug) {
  if (dryRun) return modules.map((m) => ({ id: '(new)', title: m.title }))
  const { error: delErr } = await admin.from('modules').delete().eq('course_id', courseId)
  if (delErr) throw delErr
  const rows = modules.map((m, i) => {
    const content = { ...m.content, learning_objectives: m.learning_objectives }
    if (m.sources) content.sources = m.sources
    const simId = m.sim_slug ? simBySlug[m.sim_slug] : undefined
    return {
      course_id: courseId,
      title: m.title,
      order_index: i,
      content,
      quiz: m.quiz ?? null,
      ...(simId ? { sim_scenario_id: simId, sim_config: { required: false, source: 'seed' } } : {}),
    }
  })
  const { data, error } = await admin.from('modules').insert(rows).select('id, title, order_index, content')
  if (error) throw error
  return data
}

async function seedDomain(orgId, course, insertedModules) {
  if (dryRun) return { domainId: '(new)', claimCount: insertedModules.length * 2 }
  const { data: existing } = await admin
    .from('learning_domains')
    .select('id')
    .eq('org_id', orgId)
    .eq('source_course_id', course.id)
    .maybeSingle()
  let domainId = existing?.id
  if (domainId) {
    const { data: oldClaims } = await admin.from('learning_claims').select('id').eq('domain_id', domainId)
    const ids = (oldClaims ?? []).map((c) => c.id)
    if (ids.length) {
      await admin.from('claim_content_links').delete().in('claim_id', ids)
      await admin.from('claim_edges').delete().eq('domain_id', domainId)
      await admin.from('learning_claims').delete().eq('domain_id', domainId)
    }
  } else {
    const { data, error } = await admin
      .from('learning_domains')
      .insert({ org_id: orgId, title: course.title, description: course.description, source: 'course', source_course_id: course.id, version: 1, metadata: { seeded_from: 'seed-demo' } })
      .select('id')
      .single()
    if (error) throw error
    domainId = data.id
  }

  const claimIds = []
  let sort = 0
  for (const mod of [...insertedModules].sort((a, b) => a.order_index - b.order_index)) {
    for (const stem of mod.content?.learning_objectives ?? [mod.title]) {
      const { data: claim, error } = await admin
        .from('learning_claims')
        .insert({
          domain_id: domainId,
          stem,
          misconceptions: [],
          bloom: /apply|use|plan|turn|close|choose/i.test(stem) ? 'apply' : 'understand',
          evidence_types: ['quiz', 'explain_back', 'apply'],
          metadata: { module_id: mod.id, module_title: mod.title },
          sort_order: sort++,
        })
        .select('id')
        .single()
      if (error) throw error
      claimIds.push(claim.id)
      await admin.from('claim_content_links').upsert(
        { claim_id: claim.id, link_kind: 'module', target_id: String(mod.id), metadata: {} },
        { onConflict: 'claim_id,link_kind,target_id' },
      )
    }
  }
  for (let i = 0; i < claimIds.length - 1; i++) {
    await admin.from('claim_edges').upsert(
      { domain_id: domainId, from_claim_id: claimIds[i], to_claim_id: claimIds[i + 1], kind: 'prerequisite' },
      { onConflict: 'from_claim_id,to_claim_id,kind' },
    )
  }
  return { domainId, claimCount: claimIds.length }
}

async function enrolLearners(orgId, courseIds, enrolledBy) {
  const emails = (process.env.LEARNER_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)
  const out = []
  for (const email of emails) {
    const userId = await findUserIdByEmail(email)
    if (!userId) {
      out.push({ email, status: 'no auth user yet (they must sign up first)' })
      continue
    }
    if (dryRun) {
      out.push({ email, status: 'would enrol' })
      continue
    }
    const { data: member } = await admin.from('org_members').select('id').eq('org_id', orgId).eq('user_id', userId).maybeSingle()
    if (!member) await admin.from('org_members').insert({ org_id: orgId, user_id: userId, role: 'LEARNER' })
    for (const courseId of courseIds) {
      const { data: existing } = await admin.from('enrollments').select('id').eq('user_id', userId).eq('course_id', courseId).maybeSingle()
      if (!existing) {
        await admin.from('enrollments').insert({ user_id: userId, course_id: courseId, enrolled_by: enrolledBy, status: 'not_started', progress_pct: 0 })
      }
    }
    out.push({ email, status: 'enrolled' })
  }
  return out
}

async function main() {
  const org = await resolveOrg()
  const creatorEmail = process.env.CREATED_BY_EMAIL?.trim()
  const createdBy = process.env.CREATED_BY?.trim() || (creatorEmail ? await findUserIdByEmail(creatorEmail) : null)
  if (!createdBy) throw new Error('Set CREATED_BY_EMAIL (an existing admin in this org) or CREATED_BY (profile UUID).')

  console.log(`Seeding demo into ${org.name} (${org.slug})${dryRun ? ' [dry run]' : ''}`)
  const simBySlug = seedSimScenarios(org.id, createdBy)
  console.log(`  sim scenarios: ${Object.keys(simBySlug).length || '(dry run)'}`)

  const courseIds = []
  for (const course of seed.courses) {
    const saved = await upsertCourse(org, createdBy, course)
    const mods = await replaceModules(saved.id, course.modules, simBySlug)
    const domain = await seedDomain(org.id, { ...course, id: saved.id }, mods)
    courseIds.push(saved.id)
    console.log(`  course "${course.title}": ${saved.created ? 'created' : 'updated'} (${mods.length} modules, ${domain.claimCount} claims)`)
  }

  const enrolled = await enrolLearners(org.id, courseIds, createdBy)
  for (const e of enrolled) console.log(`  learner ${e.email}: ${e.status}`)
  console.log('\nDone. Learners in this org will see the courses in Learn > Courses; the practice module opens a SudarSim call.')
}

main().catch((err) => {
  console.error(`[seed-demo] ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
