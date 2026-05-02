import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'
import { injectScormShim } from '@/lib/scorm/scormApiShim'

// ---------------------------------------------------------------------------
// Semantic text extractor — converts SCORM HTML into readable plain text
// that Sudar can use as a knowledge base to answer questions about the module.
// ---------------------------------------------------------------------------
function extractSemanticText(html: string): string {
  let text = html
    // Kill scripts, styles, forms, nav — nothing Sudar needs
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    // Headings → newline + text
    .replace(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi, (_, _tag, inner) =>
      '\n\n' + inner.replace(/<[^>]+>/g, ' ').trim() + '\n')
    // List items → bullet
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) =>
      '\n• ' + inner.replace(/<[^>]+>/g, ' ').trim())
    // Table cells → pipe-separated
    .replace(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi, (_, inner) =>
      ' | ' + inner.replace(/<[^>]+>/g, ' ').trim())
    .replace(/<tr[^>]*>/gi, '\n')
    // Paragraphs and divs → newlines
    .replace(/<\/?(p|div|section|article|blockquote|pre|figure)[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    // Strip all remaining tags
    .replace(/<[^>]+>/g, ' ')

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z]{2,8};/gi, ' ')
    // Clean up whitespace
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return text
}

// ---------------------------------------------------------------------------
// XML attribute helpers — fast-xml-parser uses @_ prefix for attributes
// ---------------------------------------------------------------------------
type XmlNode = Record<string, unknown>

function attr(node: XmlNode, name: string): string {
  return String((node[`@_${name}`] ?? node[name] ?? '')).trim()
}

function childText(node: XmlNode, tag: string): string {
  const v = node[tag]
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'object' && v !== null && '#text' in (v as object))
    return String((v as XmlNode)['#text']).trim()
  return ''
}

// ---------------------------------------------------------------------------
// Collect SCO leaf items from an organization tree
// ---------------------------------------------------------------------------
interface ScormItem { title: string; identifierref?: string }

function collectItems(node: XmlNode, out: ScormItem[] = []): ScormItem[] {
  const title = childText(node, 'title') || attr(node, 'identifier') || 'Untitled'
  const identifierref = attr(node, 'identifierref') || undefined

  const rawItem = node.item
  const children: XmlNode[] = rawItem == null
    ? []
    : Array.isArray(rawItem) ? rawItem as XmlNode[] : [rawItem as XmlNode]

  if (children.length === 0) {
    out.push({ title, identifierref })
  } else {
    for (const child of children) collectItems(child, out)
  }
  return out
}

// ---------------------------------------------------------------------------
// ZIP safety — zip-bomb and path traversal mitigation
// ---------------------------------------------------------------------------
const MAX_SCORM_ZIP_BYTES = 120 * 1024 * 1024
const MAX_SCORM_ENTRIES = 2500
/** Declared uncompressed total (ZIP central directory) — rejects obvious zip bombs early */
const MAX_SCORM_UNCOMPRESSED_TOTAL = 450 * 1024 * 1024
const MAX_SCORM_SINGLE_ENTRY = 90 * 1024 * 1024

function assertSafeZipEntries(
  entries: ReturnType<InstanceType<typeof AdmZip>['getEntries']>
): { ok: true; fileCount: number; uncompressedTotal: number } | { ok: false; error: string } {
  if (entries.length > MAX_SCORM_ENTRIES) {
    return { ok: false, error: 'ZIP contains too many entries' }
  }
  let uncompressedTotal = 0
  let fileCount = 0
  for (const entry of entries) {
    const name = entry.entryName.replace(/\\/g, '/')
    if (!name || name.startsWith('/') || name.split('/').some((p) => p === '..')) {
      return { ok: false as const, error: 'ZIP contains unsafe paths' }
    }
    if (entry.isDirectory) continue
    fileCount += 1
    const sz = Number((entry as { header?: { size?: number } }).header?.size ?? 0)
    if (sz > MAX_SCORM_SINGLE_ENTRY) {
      return { ok: false as const, error: 'ZIP contains an entry larger than the allowed limit' }
    }
    uncompressedTotal += sz
  }
  if (uncompressedTotal > MAX_SCORM_UNCOMPRESSED_TOTAL) {
    return { ok: false as const, error: 'ZIP uncompressed size exceeds safety limit' }
  }
  return { ok: true as const, fileCount, uncompressedTotal }
}

// ---------------------------------------------------------------------------
// POST /api/courses/import-scorm
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Upload a SCORM 1.2 ZIP file (multipart/form-data)' }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.length > MAX_SCORM_ZIP_BYTES) {
    return NextResponse.json({ error: 'SCORM package is too large' }, { status: 400 })
  }
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    return NextResponse.json({ error: 'Not a valid ZIP file' }, { status: 400 })
  }
  let zip: AdmZip
  try {
    zip = new AdmZip(buffer)
  } catch {
    return NextResponse.json({ error: 'Invalid ZIP file' }, { status: 400 })
  }

  const entries = zip.getEntries()
  const zipCheck = assertSafeZipEntries(entries)
  if (!zipCheck.ok) {
    return NextResponse.json({ error: zipCheck.error }, { status: 400 })
  }

  // ── Find imsmanifest.xml ──────────────────────────────────────────────────
  let manifestXml: string | null = null
  let manifestDir = ''

  for (const entry of entries) {
    const name = entry.entryName.replace(/\\/g, '/')
    if (name.toLowerCase().endsWith('imsmanifest.xml')) {
      manifestXml = entry.getData().toString('utf8')
      manifestDir = name.replace(/\/?imsmanifest\.xml$/i, '')
      if (manifestDir) manifestDir += '/'
      break
    }
  }

  if (!manifestXml) return NextResponse.json({ error: 'imsmanifest.xml not found in the package' }, { status: 400 })

  // ── Parse manifest ────────────────────────────────────────────────────────
  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, ignoreDeclaration: true })
  let parsed: Record<string, unknown>
  try {
    parsed = parser.parse(manifestXml) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid manifest XML' }, { status: 400 })
  }

  // Root is <manifest> — fast-xml-parser nests it under the tag name
  const root = (parsed.manifest as XmlNode) ?? parsed

  // ── Resolve organizations ─────────────────────────────────────────────────
  const orgsNode = root.organizations as XmlNode | undefined
  const defaultOrgId = orgsNode ? attr(orgsNode, 'default') : ''

  let orgList: XmlNode[] = []
  if (orgsNode?.organization) {
    orgList = Array.isArray(orgsNode.organization)
      ? orgsNode.organization as XmlNode[]
      : [orgsNode.organization as XmlNode]
  }

  let defaultOrg: XmlNode | undefined = defaultOrgId
    ? orgList.find((o) => attr(o, 'identifier') === defaultOrgId) ?? orgList[0]
    : orgList[0]

  // ── Resolve resources ─────────────────────────────────────────────────────
  const resourcesNode = root.resources as XmlNode | undefined
  let resourceList: XmlNode[] = []
  if (resourcesNode?.resource) {
    resourceList = Array.isArray(resourcesNode.resource)
      ? resourcesNode.resource as XmlNode[]
      : [resourcesNode.resource as XmlNode]
  }

  // Fallback: no <organizations> but has <resources> — build synthetic org
  if (!defaultOrg && resourceList.length > 0) {
    defaultOrg = {
      title: file.name.replace(/\.zip$/i, '') || 'Imported SCORM course',
      item: resourceList.map((r) => ({
        title: childText(r, 'title') || attr(r, 'identifier') || 'Untitled',
        '@_identifierref': attr(r, 'identifier'),
      })),
    }
  }

  if (!defaultOrg) {
    return NextResponse.json({ error: 'No organization or resources found in manifest' }, { status: 400 })
  }

  const courseTitle = childText(defaultOrg, 'title') || attr(defaultOrg, 'identifier') || 'Imported SCORM course'
  const items = collectItems(defaultOrg)

  const resourceMap = new Map<string, { href: string }>()
  for (const res of resourceList) {
    const id = attr(res, 'identifier')
    const href = attr(res, 'href')
    if (id && href) resourceMap.set(id, { href })
  }

  // ── Create course record ──────────────────────────────────────────────────
  const now = new Date().toISOString()
  const { data: course, error: courseError } = await admin
    .from('courses')
    .insert({
      org_id: orgId,
      created_by: user.id,
      title: courseTitle,
      description: 'Imported from SCORM package. You can edit this course like any other.',
      difficulty: 'intermediate',
      status: 'draft',
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (courseError || !course) {
    return NextResponse.json({ error: courseError?.message ?? 'Failed to create course' }, { status: 500 })
  }

  const courseId = course.id
  const storagePath = `scorm-packages/${courseId}`

  // ── Ensure the storage bucket exists (auto-create if missing) ────────────
  const { data: buckets } = await admin.storage.listBuckets()
  const bucketExists = buckets?.some((b) => b.name === 'course-media')
  if (!bucketExists) {
    const { error: bucketError } = await admin.storage.createBucket('course-media', {
      public: true,
    })
    if (bucketError && !bucketError.message.includes('already exists')) {
      await admin.from('courses').delete().eq('id', courseId)
      return NextResponse.json({ error: `Could not create storage bucket: ${bucketError.message}` }, { status: 500 })
    }
  }

  // ── Upload all ZIP files to Supabase Storage ──────────────────────────────
  // HTML launch files get the SCORM API shim injected first.
  const uploadErrors: string[] = []

  for (const entry of entries) {
    if (entry.isDirectory) continue
    const entryName = entry.entryName.replace(/\\/g, '/')
    let data: Buffer = entry.getData()

    const isHtml = /\.html?$/i.test(entryName)
    if (isHtml) {
      try {
        const html = data.toString('utf8')
        data = Buffer.from(injectScormShim(html), 'utf8')
      } catch {
        // Leave binary as-is if UTF-8 decode fails
      }
    }

    const mimeType = isHtml
      ? 'text/html'
      : entryName.endsWith('.js') ? 'application/javascript'
      : entryName.endsWith('.css') ? 'text/css'
      : entryName.endsWith('.png') ? 'image/png'
      : entryName.endsWith('.jpg') || entryName.endsWith('.jpeg') ? 'image/jpeg'
      : entryName.endsWith('.gif') ? 'image/gif'
      : entryName.endsWith('.svg') ? 'image/svg+xml'
      : entryName.endsWith('.mp4') ? 'video/mp4'
      : entryName.endsWith('.mp3') ? 'audio/mpeg'
      : entryName.endsWith('.xml') ? 'application/xml'
      : 'application/octet-stream'

    const { error: uploadError } = await admin.storage
      .from('course-media')
      .upload(`${storagePath}/${entryName}`, data, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) uploadErrors.push(`${entryName}: ${uploadError.message}`)
  }

  if (uploadErrors.length > 0) {
    // Clean up course record if upload failed entirely
    if (uploadErrors.length === entries.filter((e) => !e.isDirectory).length) {
      await admin.from('courses').delete().eq('id', courseId)
      return NextResponse.json({
        error: `Storage upload failed. Make sure the "course-media" bucket exists in Supabase. Details: ${uploadErrors[0]}`,
      }, { status: 500 })
    }
    // Partial failure — continue but log
    console.warn('[import-scorm] Some files failed to upload:', uploadErrors.slice(0, 5))
  }

  // ── Create module records ─────────────────────────────────────────────────
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    let launchHref = ''

    if (it.identifierref) {
      const res = resourceMap.get(it.identifierref)
      if (res?.href) {
        launchHref = (manifestDir + res.href).replace(/\/+/g, '/')
      }
    }

    // Fallback: use the first HTML file if no explicit launch href
    if (!launchHref) {
      const fallback = entries.find((e) => /\.html?$/i.test(e.entryName) && !e.isDirectory)
      if (fallback) launchHref = fallback.entryName.replace(/\\/g, '/')
    }

    // Store only the bucket-relative path. Each app proxies it through /api/scorm/
    // so the iframe is same-origin and HTML renders correctly.
    const launchUrl = launchHref ? `${storagePath}/${launchHref}` : ''

    // ── Extract semantic text for Sudar's knowledge base ─────────────────
    // Collect text from this module's SCO HTML file plus sibling HTML files
    // in the same folder (slides, pop-ups, supplementary pages, etc.).
    const textParts: string[] = []

    if (launchHref) {
      // Primary SCO launch file
      const scoEntry = entries.find((e) => {
        const n = e.entryName.replace(/\\/g, '/')
        return n === launchHref || n.endsWith('/' + launchHref.split('/').pop()!)
      })
      if (scoEntry) {
        try { textParts.push(extractSemanticText(scoEntry.getData().toString('utf8'))) } catch { /* ignore */ }
      }

      // Sibling HTML files in the same directory (limit to 5 extras)
      const launchDir = launchHref.includes('/')
        ? launchHref.slice(0, launchHref.lastIndexOf('/') + 1)
        : ''
      let extras = 0
      for (const entry of entries) {
        if (extras >= 5) break
        const n = entry.entryName.replace(/\\/g, '/')
        if (entry.isDirectory || n === launchHref || !/\.html?$/i.test(n)) continue
        if (launchDir && n.startsWith(launchDir)) {
          try { textParts.push(extractSemanticText(entry.getData().toString('utf8'))); extras++ } catch { /* ignore */ }
        }
      }
    }

    // Combine and cap at 12 000 chars — enough for Sudar to be context-aware
    // without overwhelming the tutor's context window
    const scormTextContent = textParts
      .join('\n\n---\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 12000) || undefined

    await admin.from('modules').insert({
      course_id: courseId,
      title: it.title,
      content: launchUrl
        ? { type: 'scorm', launch_url: launchUrl, scorm_version: '1.2', scorm_text_content: scormTextContent }
        : { type: 'text', body: `Content for: ${it.title}` },
      order_index: i,
    })
  }

  return NextResponse.json({ course_id: courseId })
}
