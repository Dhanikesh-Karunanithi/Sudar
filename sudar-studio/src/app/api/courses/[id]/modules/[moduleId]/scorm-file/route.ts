import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { listStorageFilesRecursive } from '@/lib/export/listStorageFilesRecursive'
import { injectScormShim } from '@/lib/scorm/scormApiShim'
import { isPathUnderCourseScormPackage, normalizeScormStoragePath } from '@/lib/scorm/storagePath'
import { validateHtmlForScormStorage } from '@/lib/scorm/validateHtmlForStorage'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const putBodySchema = z.object({
  path: z.string().min(1),
  content: z.string(),
})

async function getAuthorizedScormModule(
  admin: ReturnType<typeof createServiceRoleSupabaseClient>,
  userId: string,
  courseId: string,
  moduleId: string
): Promise<{ launch_url: string } | null> {
  const { data: course } = await admin
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('created_by', userId)
    .maybeSingle()

  if (!course) return null

  const { data: row } = await admin
    .from('modules')
    .select('content')
    .eq('id', moduleId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (!row?.content || typeof row.content !== 'object') return null
  const c = row.content as { type?: string; launch_url?: string }
  if (c.type !== 'scorm' || !c.launch_url) return null
  return { launch_url: c.launch_url }
}

/**
 * GET (no query): list HTML file paths under this course's SCORM package.
 * GET ?path=encoded: fetch UTF-8 file contents for editing.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const { id: courseId, moduleId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const scorm = await getAuthorizedScormModule(admin, user.id, courseId, moduleId)
  if (!scorm) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const pathParam = request.nextUrl.searchParams.get('path')
  const packageRoot = `scorm-packages/${courseId}`

  if (!pathParam) {
    const all = await listStorageFilesRecursive(admin, 'course-media', packageRoot)
    const htmlFiles = all
      .filter((p) => /\.html?$/i.test(p))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 400)
    return NextResponse.json({ files: htmlFiles, packageRoot, launchUrl: scorm.launch_url })
  }

  const normalized = normalizeScormStoragePath(pathParam)
  if (!normalized || !isPathUnderCourseScormPackage(normalized, courseId)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }
  if (!/\.html?$/i.test(normalized)) {
    return NextResponse.json({ error: 'Only HTML files can be edited in this flow' }, { status: 400 })
  }

  const { data: file, error } = await admin.storage.from('course-media').download(normalized)
  if (error || !file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const content = await file.text()
  return NextResponse.json({ path: normalized, content })
}

/**
 * PUT: validate HTML, re-inject SCORM API shim, upload to course-media.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const { id: courseId, moduleId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = putBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body: path and content are required' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const scorm = await getAuthorizedScormModule(admin, user.id, courseId, moduleId)
  if (!scorm) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const normalized = normalizeScormStoragePath(parsed.data.path)
  if (!normalized || !isPathUnderCourseScormPackage(normalized, courseId)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }
  if (!/\.html?$/i.test(normalized)) {
    return NextResponse.json({ error: 'Only HTML files are supported' }, { status: 400 })
  }

  const check = validateHtmlForScormStorage(parsed.data.content)
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 })

  const withShim = injectScormShim(parsed.data.content)
  const buffer = Buffer.from(withShim, 'utf8')

  const { error: uploadError } = await admin.storage.from('course-media').upload(normalized, buffer, {
    contentType: 'text/html; charset=utf-8',
    upsert: true,
  })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true as const, path: normalized })
}
