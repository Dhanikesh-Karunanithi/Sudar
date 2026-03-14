/**
 * POST /api/courses/[id]/reextract-scorm
 *
 * Re-extracts readable text from already-uploaded SCORM packages and saves
 * it as scorm_text_content on each module. Run this once for courses imported
 * before scorm_text_content was added to the pipeline.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function extractSemanticText(html: string): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) =>
      '\n\n' + inner.replace(/<[^>]+>/g, ' ').trim() + '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, inner) =>
      '\n• ' + inner.replace(/<[^>]+>/g, ' ').trim())
    .replace(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi, (_m, inner) =>
      ' | ' + inner.replace(/<[^>]+>/g, ' ').trim())
    .replace(/<tr[^>]*>/gi, '\n')
    .replace(/<\/?(p|div|section|article|blockquote|pre|figure)[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    .replace(/<[^>]+>/g, ' ')

  return text
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/&[a-z]{2,8};/gi, ' ')
    .replace(/[ \t]{2,}/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n').trim()
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const courseId = params.id

  // Verify the course belongs to this user's org
  const { data: course } = await admin
    .from('courses')
    .select('id, title, modules(id, title, content, order_index)')
    .eq('id', courseId)
    .eq('created_by', user.id)
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const modules = (course.modules as Array<{
    id: string
    title: string
    content: { type?: string; launch_url?: string; scorm_text_content?: string } | null
    order_index: number
  }>) ?? []

  const scormModules = modules.filter(
    (m) => m.content?.type === 'scorm' && m.content.launch_url
  )

  if (scormModules.length === 0) {
    return NextResponse.json({ message: 'No SCORM modules found in this course', updated: 0 })
  }

  let updated = 0
  const errors: string[] = []

  for (const mod of scormModules) {
    try {
      const launchPath = mod.content!.launch_url!
      const launchDir = launchPath.includes('/')
        ? launchPath.slice(0, launchPath.lastIndexOf('/') + 1)
        : ''

      const textParts: string[] = []

      // Download the launch HTML file
      const { data: launchFile, error: launchErr } = await admin.storage
        .from('course-media')
        .download(launchPath)

      if (!launchErr && launchFile) {
        textParts.push(extractSemanticText(await launchFile.text()))
      }

      // List sibling HTML files and download up to 5
      if (launchDir) {
        const { data: fileList } = await admin.storage
          .from('course-media')
          .list(launchDir.replace(/\/$/, ''), { limit: 50 })

        let extras = 0
        for (const f of fileList ?? []) {
          if (extras >= 5) break
          if (!/\.html?$/i.test(f.name)) continue
          const siblingPath = launchDir + f.name
          if (siblingPath === launchPath) continue
          const { data: sibFile } = await admin.storage.from('course-media').download(siblingPath)
          if (sibFile) {
            textParts.push(extractSemanticText(await sibFile.text()))
            extras++
          }
        }
      }

      const scormTextContent = textParts
        .join('\n\n---\n\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, 12000) || undefined

      if (!scormTextContent) continue

      await admin.from('modules').update({
        content: { ...mod.content, scorm_text_content: scormTextContent },
      }).eq('id', mod.id)

      updated++
    } catch (err) {
      errors.push(`Module ${mod.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({
    message: `Re-extracted text for ${updated}/${scormModules.length} SCORM modules`,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  })
}
