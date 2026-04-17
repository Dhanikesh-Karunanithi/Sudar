import AdmZip from 'adm-zip'
import type { SupabaseClient } from '@supabase/supabase-js'
import { listStorageFilesRecursive } from '@/lib/export/listStorageFilesRecursive'
import { buildNativeScoHtml } from '@/lib/export/scorm12HtmlShell'
import { stripSudarScormShim } from '@/lib/export/stripSudarScormShim'
import { isScormContent } from '@/types/content'
import type { ScormContent } from '@/types/content'

const BUCKET = 'course-media'

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function storagePrefix(courseId: string): string {
  return `scorm-packages/${courseId}`
}

function relInsideScormPackage(launchUrl: string, courseId: string): string {
  const prefix = `${storagePrefix(courseId)}/`
  if (launchUrl.startsWith(prefix)) return launchUrl.slice(prefix.length)
  return launchUrl.replace(/^\/+/, '')
}

export type ModuleRow = {
  title: string
  order_index: number
  content: unknown
}

function dedupeResources(items: { title: string; href: string }[]): {
  orgItems: { title: string; identifierref: string; itemId: string }[]
  resources: { id: string; href: string }[]
} {
  const hrefToResId = new Map<string, string>()
  const resources: { id: string; href: string }[] = []
  let resIdx = 0
  for (const it of items) {
    if (!hrefToResId.has(it.href)) {
      const id = `RES-${resIdx++}`
      hrefToResId.set(it.href, id)
      resources.push({ id, href: it.href })
    }
  }
  const orgItems = items.map((it, i) => ({
    title: it.title,
    identifierref: hrefToResId.get(it.href)!,
    itemId: `ITEM-${i}`,
  }))
  return { orgItems, resources }
}

function buildImsManifest(params: {
  courseTitle: string
  items: { title: string; href: string }[]
}): string {
  const { courseTitle, items } = params
  const { orgItems, resources: resList } = dedupeResources(items)

  const orgItemsXml = orgItems
    .map(
      (it) => `    <item identifier="${escXml(it.itemId)}" identifierref="${escXml(it.identifierref)}" isvisible="true">
      <title>${escXml(it.title)}</title>
    </item>`
    )
    .join('\n')

  const resourcesXml = resList
    .map(
      (r) => `    <resource identifier="${escXml(r.id)}" type="webcontent" adlcp:scormtype="sco" href="${escXml(r.href)}">
      <file href="${escXml(r.href)}"/>
    </resource>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="SudarManifest" version="1.1"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-SUDAR">
    <organization identifier="ORG-SUDAR" structure="hierarchical">
      <title>${escXml(courseTitle)}</title>
${orgItemsXml}
    </organization>
  </organizations>
  <resources>
${resourcesXml}
  </resources>
</manifest>
`
}

async function downloadStorageFile(admin: SupabaseClient, path: string): Promise<Buffer | null> {
  const { data, error } = await admin.storage.from(BUCKET).download(path)
  if (error || !data) return null
  return Buffer.from(await data.arrayBuffer())
}

/**
 * Builds a SCORM 1.2 Content Package ZIP for the course.
 */
export async function buildScorm12ExportZip(params: {
  admin: SupabaseClient
  courseId: string
  courseTitle: string
  modules: ModuleRow[]
}): Promise<Buffer> {
  const { admin, courseId, courseTitle, modules } = params
  const sorted = [...modules].sort((a, b) => a.order_index - b.order_index)
  const zip = new AdmZip()

  const manifestItems: { title: string; href: string }[] = []

  const hasImportedPackage = sorted.some(
    (m) => isScormContent(m.content) && typeof (m.content as ScormContent).launch_url === 'string'
  )

  if (hasImportedPackage) {
    const prefix = storagePrefix(courseId)
    const allPaths = await listStorageFilesRecursive(admin, BUCKET, prefix)
    for (const fullPath of allPaths) {
      const rel = fullPath.startsWith(prefix + '/') ? fullPath.slice(prefix.length + 1) : fullPath.slice(prefix.length)
      if (!rel || rel.endsWith('/')) continue
      const relNorm = rel.replace(/\\/g, '/')
      if (relNorm.toLowerCase() === 'imsmanifest.xml') continue
      let buf = await downloadStorageFile(admin, fullPath)
      if (!buf) continue
      if (/\.html?$/i.test(relNorm)) {
        const html = buf.toString('utf8')
        buf = Buffer.from(stripSudarScormShim(html), 'utf8')
      }
      zip.addFile(relNorm, buf)
    }
  }

  let nativeIndex = 0
  for (const mod of sorted) {
    const content = mod.content
    if (isScormContent(content)) {
      const sc = content as ScormContent
      const href = relInsideScormPackage(sc.launch_url, courseId).replace(/\\/g, '/')
      manifestItems.push({ title: mod.title, href })
      continue
    }

    const href = `__sudar_export/native-${nativeIndex}.html`
    nativeIndex++
    const html = buildNativeScoHtml({
      courseTitle,
      moduleTitle: mod.title,
      moduleContent: content,
    })
    zip.addFile(href, Buffer.from(html, 'utf8'))
    manifestItems.push({ title: mod.title, href })
  }

  zip.addFile('imsmanifest.xml', Buffer.from(buildImsManifest({ courseTitle, items: manifestItems }), 'utf8'))

  return zip.toBuffer()
}
