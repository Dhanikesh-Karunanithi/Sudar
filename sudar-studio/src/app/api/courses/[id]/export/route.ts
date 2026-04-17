import { createClient, createAdminClient } from '@/lib/supabase/server'
import { buildScorm12ExportZip, type ModuleRow } from '@/lib/export/buildScorm12ExportZip'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const QuerySchema = z.object({
  format: z.enum(['scorm-1.2']),
})

function sanitizeFilename(title: string): string {
  const s = title
    .replace(/[^\w\s\-().]/g, '')
    .replace(/\s+/g, '-')
    .trim()
    .slice(0, 80)
  return s || 'course'
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params
  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({ format: searchParams.get('format') })
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing format. Use format=scorm-1.2' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: courseRow, error } = await admin
    .from('courses')
    .select('id, title, modules(title, order_index, content)')
    .eq('id', courseId)
    .eq('created_by', user.id)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single()

  if (error || !courseRow) {
    return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })
  }

  const course = courseRow as { id: string; title: string; modules: ModuleRow[] | null }
  const modules = course.modules ?? []
  if (modules.length === 0) {
    return NextResponse.json({ success: false, error: 'Course has no modules to export' }, { status: 400 })
  }

  try {
    const buf = await buildScorm12ExportZip({
      admin,
      courseId,
      courseTitle: course.title,
      modules,
    })
    const name = `${sanitizeFilename(course.title)}-scorm12.zip`
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
      { status: 500 }
    )
  }
}
