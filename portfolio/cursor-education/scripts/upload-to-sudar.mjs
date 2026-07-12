#!/usr/bin/env node
/**
 * Upload built SCORM ZIPs into the Cursor Education Portfolio org and wire a certified path.
 *
 * Usage:
 *   node --env-file=sudar-studio/.env.local portfolio/cursor-education/scripts/upload-to-sudar.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { createClient } from '@supabase/supabase-js'

const require = createRequire(import.meta.url)
const AdmZip = require(join(process.cwd(), 'sudar-studio/node_modules/adm-zip'))
const { XMLParser } = require(join(process.cwd(), 'sudar-studio/node_modules/fast-xml-parser'))

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SCORM_API_SHIM = `<script id="sudar-scorm-shim">(function(){
  var d={};
  function post(m){try{window.parent.postMessage(m,'*');}catch(e){}}
  var API={
    LMSInitialize:function(s){post({type:'scorm_initialize'});return'true';},
    LMSFinish:function(s){
      post({type:'scorm_finish',lesson_status:d['cmi.core.lesson_status']||'completed',data:d});
      return'true';
    },
    LMSGetValue:function(n){return d[n]||'';},
    LMSSetValue:function(n,v){
      d[n]=v;
      post({type:'scorm_set_value',name:n,value:v});
      if(n==='cmi.core.lesson_status'&&(v==='completed'||v==='passed'||v==='failed')){
        post({type:'scorm_finish',lesson_status:v,data:d});
      }
      return'true';
    },
    LMSCommit:function(s){return'true';},
    LMSGetLastError:function(){return'0';},
    LMSGetErrorString:function(n){return'';},
    LMSGetDiagnostic:function(n){return'';}
  };
  window.API=API;
  try{if(window.parent&&window.parent!==window)window.parent.API=API;}catch(e){}
  try{if(window.top&&window.top!==window)window.top.API=API;}catch(e){}
})();</script>`

function injectScormShim(html) {
  if (html.includes('id="sudar-scorm-shim"')) return html
  if (/<head[^>]*>/i.test(html)) return html.replace(/(<head[^>]*>)/i, `$1\n${SCORM_API_SHIM}`)
  if (/<html[^>]*>/i.test(html)) return html.replace(/(<html[^>]*>)/i, `$1\n<head>${SCORM_API_SHIM}</head>`)
  return SCORM_API_SHIM + html
}

function extractSemanticText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000)
}

const PACKAGES = [
  {
    zip: 'cursor-fluent-scorm12.zip',
    title: 'Cursor Fluent',
    description:
      'Learn how professional developers use Cursor to ship real work: mental models (Chat vs Agent vs Tab), repo grounding, multi-file changes with tests, rules, MCP judgment, and diff review. Interactive lessons with scored practice — pass at 70%.',
  },
  {
    zip: 'org-adoption-scorm12.zip',
    title: 'From Isolated to Org-Wide',
    description:
      'For eng leaders and enablement: diagnose adoption stage, design a 30/60/90 rollout, set velocity-safe guardrails, replace completion vanity with fluency metrics, and run a workshop for your first 50 engineers.',
  },
  {
    zip: 'edu-ops-scorm12.zip',
    title: 'Education Ops for a Weekly-Shipping IDE',
    description:
      'How to run product education when the IDE ships weekly: content architecture, launch Definition of Done, mid-flight cut/keep decisions, safe deprecation, and hiring education engineers.',
  },
]

async function loadCredentials() {
  const path = join(root, 'credentials.local')
  if (!existsSync(path)) throw new Error('Missing credentials.local — run provision script first')
  return JSON.parse(readFileSync(path, 'utf8'))
}

async function ensureBucket() {
  const { data: buckets } = await admin.storage.listBuckets()
  if (!buckets?.some((b) => b.name === 'course-media')) {
    const { error } = await admin.storage.createBucket('course-media', { public: true })
    if (error && !error.message.includes('already exists')) throw error
  }
}

async function findExistingCourse(orgId, title) {
  const { data } = await admin
    .from('courses')
    .select('id')
    .eq('org_id', orgId)
    .eq('title', title)
    .maybeSingle()
  return data?.id ?? null
}

async function deleteCourseCascade(courseId) {
  await admin.from('modules').delete().eq('course_id', courseId)
  await admin.from('enrollments').delete().eq('course_id', courseId)
  // best-effort storage cleanup skipped
  await admin.from('courses').delete().eq('id', courseId)
}

async function importZip(orgId, createdBy, pkg) {
  const zipPath = join(dist, pkg.zip)
  if (!existsSync(zipPath)) throw new Error('Build SCORMs first — missing ' + zipPath)

  const existingId = await findExistingCourse(orgId, pkg.title)
  if (existingId) {
    console.log('Replacing existing course:', pkg.title)
    await deleteCourseCascade(existingId)
  }

  const zip = new AdmZip(zipPath)
  const entries = zip.getEntries()
  const manifestEntry = entries.find((e) => e.entryName.replace(/\\/g, '/').endsWith('imsmanifest.xml'))
  if (!manifestEntry) throw new Error('No imsmanifest.xml in ' + pkg.zip)

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const manifest = parser.parse(manifestEntry.getData().toString('utf8'))
  const root = manifest.manifest
  const orgNode = root.organizations?.organization
  const title =
    (typeof orgNode?.title === 'string' ? orgNode.title : orgNode?.title?.['#text']) || pkg.title

  const now = new Date().toISOString()
  const { data: course, error: courseError } = await admin
    .from('courses')
    .insert({
      org_id: orgId,
      created_by: createdBy,
      title,
      description: pkg.description,
      difficulty: 'intermediate',
      status: 'published',
      published_at: now,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()
  if (courseError || !course) throw courseError || new Error('course insert failed')

  const courseId = course.id
  const storagePath = `scorm-packages/${courseId}`

  for (const entry of entries) {
    if (entry.isDirectory) continue
    const entryName = entry.entryName.replace(/\\/g, '/')
    let data = entry.getData()
    const isHtml = /\.html?$/i.test(entryName)
    if (isHtml) {
      try {
        data = Buffer.from(injectScormShim(data.toString('utf8')), 'utf8')
      } catch {
        /* keep */
      }
    }
    const mimeType = isHtml
      ? 'text/html'
      : entryName.endsWith('.js')
        ? 'application/javascript'
        : entryName.endsWith('.css')
          ? 'text/css'
          : entryName.endsWith('.json')
            ? 'application/json'
            : entryName.endsWith('.xml')
              ? 'application/xml'
              : 'application/octet-stream'

    const { error: uploadError } = await admin.storage
      .from('course-media')
      .upload(`${storagePath}/${entryName}`, data, { contentType: mimeType, upsert: true })
    if (uploadError) console.warn('Upload warn', entryName, uploadError.message)
  }

  const launchHref = 'index.html'
  const launchUrl = `${storagePath}/${launchHref}`
  const htmlEntry = entries.find((e) => e.entryName.replace(/\\/g, '/') === 'index.html')
  const scormText = htmlEntry
    ? extractSemanticText(htmlEntry.getData().toString('utf8'))
    : pkg.description

  // Also pull mission titles from course.json if present
  const jsonEntry = entries.find((e) => e.entryName.replace(/\\/g, '/').endsWith('course.json'))
  let extraText = ''
  if (jsonEntry) {
    try {
      const cfg = JSON.parse(jsonEntry.getData().toString('utf8'))
      extraText =
        '\n\n' +
        (cfg.missions || []).map((m) => `${m.id} ${m.title}: ${m.brief || ''}`).join('\n')
    } catch {
      /* ignore */
    }
  }

  const { error: modError } = await admin.from('modules').insert({
    course_id: courseId,
    title: title,
    order_index: 0,
    content: {
      type: 'scorm',
      launch_url: launchUrl,
      scorm_version: '1.2',
      scorm_text_content: (scormText + extraText).slice(0, 12000),
    },
  })
  if (modError) throw modError

  console.log('Imported', title, courseId)
  return { id: courseId, title }
}

async function ensurePath(orgId, createdBy, courseRows) {
  const pathTitle = 'Cursor Developer Fluency Program'
  const { data: existing } = await admin
    .from('learning_paths')
    .select('id')
    .eq('org_id', orgId)
    .eq('title', pathTitle)
    .maybeSingle()

  const coursesJson = courseRows.map((c, i) => ({
    course_id: c.id,
    order_index: i,
    is_mandatory: true,
    title: c.title,
  }))

  const payload = {
    org_id: orgId,
    created_by: createdBy,
    title: pathTitle,
    description:
      'Portfolio path for Cursor Director, Product Education Engineering: Cursor Fluent → Org-Wide Adoption → Education Ops. Issues certificate on completion.',
    status: 'published',
    courses: coursesJson,
    is_adaptive: true,
    is_mandatory: false,
    issues_certificate: true,
  }

  if (existing?.id) {
    const { error } = await admin.from('learning_paths').update(payload).eq('id', existing.id)
    if (error) throw error
    console.log('Updated path', existing.id)
    return existing.id
  }

  const { data, error } = await admin.from('learning_paths').insert(payload).select('id').single()
  if (error) throw error
  console.log('Created path', data.id)
  return data.id
}

async function enrollLearners(orgId, courseRows, pathId, learnerUserIds) {
  for (const userId of learnerUserIds) {
    for (const c of courseRows) {
      const { data: ex } = await admin
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', c.id)
        .maybeSingle()
      if (!ex) {
        const { error } = await admin.from('enrollments').insert({
          user_id: userId,
          course_id: c.id,
          status: 'active',
        })
        if (error) console.warn('Course enroll warn', c.title, error.message)
      }
    }
    if (pathId) {
      const { data: pe } = await admin
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('path_id', pathId)
        .maybeSingle()
      if (!pe) {
        const { error } = await admin.from('enrollments').insert({
          user_id: userId,
          path_id: pathId,
          status: 'active',
        })
        if (error) console.warn('Path enroll warn', userId, error.message)
      }
    }
  }
  console.log('Enrolled', learnerUserIds.length, 'learners in org', orgId)
}

async function main() {
  const creds = await loadCredentials()
  const orgId = creds.org?.id
  const createdBy = creds.admins?.[0]?.userId
  if (!orgId || !createdBy) throw new Error('credentials.local missing org.id or admins')

  await ensureBucket()
  const courseRows = []
  for (const pkg of PACKAGES) {
    courseRows.push(await importZip(orgId, createdBy, pkg))
  }
  const pathId = await ensurePath(orgId, createdBy, courseRows)
  const learnerIds = (creds.learners || []).map((l) => l.userId).filter(Boolean)
  const adminIds = (creds.admins || []).map((a) => a.userId).filter(Boolean)
  const enrollIds = [...new Set([...learnerIds, ...adminIds])]
  await enrollLearners(orgId, courseRows, pathId, enrollIds)

  const summary = {
    orgId,
    pathId,
    courses: courseRows,
    learners: creds.learners?.map((l) => ({ email: l.email, password: l.password })),
    inviteCodes: creds.inviteCodes,
    uploadedAt: new Date().toISOString(),
  }
  console.log('\n=== UPLOAD SUMMARY ===')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
