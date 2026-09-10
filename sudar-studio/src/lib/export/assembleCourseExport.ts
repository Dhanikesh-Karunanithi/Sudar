import type { SupabaseClient } from '@supabase/supabase-js'
import { buildScorm12ExportZip, type ModuleRow } from '@/lib/export/buildScorm12ExportZip'
import { moduleContentJsonToExportHtmlFragment } from '@/lib/export/moduleContentToExportHtmlFragment'
import { buildExportHtmlDocument, buildNativeScoHtml } from '@/lib/export/scorm12HtmlShell'

export const MAX_SCORM_JSON_BYTES = 3_500_000

export type HtmlExportModule = {
  title: string
  html: string
}

export type HtmlExportPayload = {
  course_id: string
  title: string
  studio_url: string
  combined_html: string
  modules: HtmlExportModule[]
}

export type ScormJsonPayload = {
  course_id: string
  title: string
  studio_url: string
  filename: string
  byte_length: number
  zip_base64?: string
  too_large?: boolean
}

export function sanitizeExportFilename(title: string): string {
  const s = title
    .replace(/[^\w\s\-().]/g, '')
    .replace(/\s+/g, '-')
    .trim()
    .slice(0, 80)
  return s || 'course'
}

export function assembleHtmlExportPayload(params: {
  courseId: string
  courseTitle: string
  studioUrl: string
  modules: ModuleRow[]
}): HtmlExportPayload {
  const sorted = [...params.modules].sort((a, b) => a.order_index - b.order_index)
  const modules: HtmlExportModule[] = sorted.map((mod) => ({
    title: mod.title,
    html: buildNativeScoHtml({
      courseTitle: params.courseTitle,
      moduleTitle: mod.title,
      moduleContent: mod.content,
    }),
  }))
  const inner = sorted
    .map((mod) => {
      const fragment = moduleContentJsonToExportHtmlFragment(mod.content, mod.title)
      return `<article class="export-module"><h1>${escapeHtml(mod.title)}</h1>${fragment}</article>`
    })
    .join('\n<hr/>\n')
  return {
    course_id: params.courseId,
    title: params.courseTitle,
    studio_url: params.studioUrl,
    combined_html: buildExportHtmlDocument({
      pageTitle: params.courseTitle,
      innerHtml: inner,
      includeScormApi: false,
    }),
    modules,
  }
}

export async function assembleScormJsonPayload(params: {
  admin: SupabaseClient
  courseId: string
  courseTitle: string
  studioUrl: string
  modules: ModuleRow[]
}): Promise<ScormJsonPayload> {
  const buf = await buildScorm12ExportZip({
    admin: params.admin,
    courseId: params.courseId,
    courseTitle: params.courseTitle,
    modules: params.modules,
  })
  const filename = `${sanitizeExportFilename(params.courseTitle)}-scorm12.zip`
  const payload: ScormJsonPayload = {
    course_id: params.courseId,
    title: params.courseTitle,
    studio_url: params.studioUrl,
    filename,
    byte_length: buf.length,
  }
  if (buf.length > MAX_SCORM_JSON_BYTES) {
    return { ...payload, too_large: true }
  }
  return { ...payload, zip_base64: buf.toString('base64') }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
