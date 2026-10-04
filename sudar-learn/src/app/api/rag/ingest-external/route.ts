import { timingSafeEqual } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ingestExternalCourseRag } from '@/lib/rag/ingestExternalCourse'
import { courseBelongsToOrg, resolveContentEditorScope } from '@/lib/security/contentEditorAccess'

const bodySchema = z.object({
  course_id: z.string().uuid(),
})

function authorizeInternal(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_SERVICE_SECRET?.trim()
  if (!secret) return false
  const provided = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

export async function POST(request: NextRequest) {
  const internal = authorizeInternal(request)
  const admin = createServiceRoleSupabaseClient()

  let editorOrgId: string | null = null
  if (!internal) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const scope = await resolveContentEditorScope(admin as unknown as SupabaseClient, user.id)
    if (!scope) {
      return NextResponse.json({ error: 'Only org admins and creators can re-index content' }, { status: 403 })
    }
    editorOrgId = scope.orgId
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  if (
    editorOrgId &&
    !(await courseBelongsToOrg(admin as unknown as SupabaseClient, parsed.data.course_id, editorOrgId))
  ) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  try {
    const result = await ingestExternalCourseRag(admin, parsed.data.course_id)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
