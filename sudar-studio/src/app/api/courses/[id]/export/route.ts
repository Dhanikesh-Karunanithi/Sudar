import { getRequestSession } from '@/lib/auth/requestSession'
import {
  assembleHtmlExportPayload,
  assembleScormJsonPayload,
  sanitizeExportFilename,
} from '@/lib/export/assembleCourseExport'
import { buildScorm12ExportZip, type ModuleRow } from '@/lib/export/buildScorm12ExportZip'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { studioCourseEditorUrl } from '@/lib/urls/studioOrigin'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const QuerySchema = z.object({
  format: z.enum(['scorm-1.2', 'html']),
  delivery: z.enum(['file', 'json']).optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    format: searchParams.get('format'),
    delivery: searchParams.get('delivery') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing format. Use format=html or format=scorm-1.2' },
      { status: 400 },
    )
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: courseRow, error } = await admin
    .from('courses')
    .select('id, title, modules(title, order_index, content)')
    .eq('id', courseId)
    .eq('created_by', session.user.id)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single()

  if (error || !courseRow) {
    return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })
  }

  const course = courseRow as unknown as { id: string; title: string; modules: ModuleRow[] | null }
  const modules = course.modules ?? []
  if (modules.length === 0) {
    return NextResponse.json({ success: false, error: 'Course has no modules to export' }, { status: 400 })
  }

  const studioUrl = studioCourseEditorUrl(course.id, request.url)

  try {
    if (parsed.data.format === 'html') {
      return NextResponse.json({
        success: true,
        data: assembleHtmlExportPayload({
          courseId: course.id,
          courseTitle: course.title,
          studioUrl,
          modules,
        }),
      })
    }

    const wantJson = parsed.data.delivery === 'json'

    if (wantJson) {
      const data = await assembleScormJsonPayload({
        admin,
        courseId: course.id,
        courseTitle: course.title,
        studioUrl,
        modules,
      })
      return NextResponse.json({ success: true, data })
    }

    const buf = await buildScorm12ExportZip({
      admin,
      courseId: course.id,
      courseTitle: course.title,
      modules,
    })
    const name = `${sanitizeExportFilename(course.title)}-scorm12.zip`
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Export failed' },
      { status: 500 },
    )
  }
}
