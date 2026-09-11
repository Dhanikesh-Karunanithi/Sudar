import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { fillOneEmptyModule } from '@/lib/ai/courseGeneration/fillOneModule'
import { runInWaitUntil } from '@/lib/ai/courseGeneration/scheduleBackgroundFill'
import { getModuleBodyText } from '@/lib/contentBlocks'
import {
  assembleHtmlExportPayload,
  assembleScormJsonPayload,
  sanitizeExportFilename,
} from '@/lib/export/assembleCourseExport'
import { buildScorm12ExportZip, type ModuleRow } from '@/lib/export/buildScorm12ExportZip'
import type { ModuleContent } from '@/types/content'
import { studioCourseEditorUrl, studioPublicOrigin } from '@/lib/urls/studioOrigin'
import { NextRequest, NextResponse } from 'next/server'

type CoursePackageRow = {
  id: string
  title: string
  created_by: string
  settings: Record<string, unknown> | null
  modules: ModuleRow[] | null
}

async function findCourseByPackageToken(token: string): Promise<CoursePackageRow | null> {
  const admin = createServiceRoleSupabaseClient()
  const { data, error } = await admin
    .from('courses')
    .select('id, title, created_by, settings, modules(title, order_index, content)')
    .filter('settings->>mcp_package_token', 'eq', token)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .maybeSingle()
  if (error || !data) return null
  return data as unknown as CoursePackageRow
}

function remainingEmpty(modules: ModuleRow[]): number {
  return modules.filter((mod) => !getModuleBodyText(mod.content as ModuleContent | null)?.trim()).length
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token || token.length < 16) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const course = await findCourseByPackageToken(token)
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const modules = course.modules ?? []
  const remaining = remainingEmpty(modules)
  const format = request.nextUrl.searchParams.get('format') ?? 'json'
  const origin = studioPublicOrigin(request.url)
  const packageUrl = `${origin}/share/p/${token}`
  const studioUrl = studioCourseEditorUrl(course.id, request.url)

  if (remaining > 0) {
    await runInWaitUntil(fillOneEmptyModule(course.id, course.created_by).then(() => undefined))
  }

  if (format === 'json') {
    return NextResponse.json({
      success: true,
      course_id: course.id,
      title: course.title,
      remaining_empty: remaining,
      generation_completed: modules.length > 0 && remaining === 0,
      package_url: packageUrl,
      studio_url: studioUrl,
      html_url: remaining === 0 ? `${origin}/api/share/packages/${token}?format=html` : null,
      scorm_url: remaining === 0 ? `${origin}/api/share/packages/${token}?format=scorm-1.2` : null,
      modules: modules.map((m) => ({ title: m.title, order_index: m.order_index })),
    })
  }

  if (remaining > 0) {
    return NextResponse.json(
      { error: 'Lessons are still generating', remaining_empty: remaining, package_url: packageUrl },
      { status: 409 }
    )
  }

  if (format === 'html') {
    const payload = assembleHtmlExportPayload({
      courseId: course.id,
      courseTitle: course.title,
      studioUrl,
      modules,
    })
    return new NextResponse(payload.combined_html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${sanitizeExportFilename(course.title)}.html"`,
      },
    })
  }

  if (format === 'scorm-1.2') {
    const admin = createServiceRoleSupabaseClient()
    const buf = await buildScorm12ExportZip({
      admin,
      courseId: course.id,
      courseTitle: course.title,
      modules,
    })
    const filename = `${sanitizeExportFilename(course.title)}-scorm12.zip`
    const jsonWanted = request.nextUrl.searchParams.get('delivery') === 'json'
    if (jsonWanted) {
      const data = await assembleScormJsonPayload({
        admin,
        courseId: course.id,
        courseTitle: course.title,
        studioUrl,
        modules,
      })
      return NextResponse.json({ success: true, data })
    }
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buf.length),
      },
    })
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
}
