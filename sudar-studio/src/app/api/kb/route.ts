import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { requireOrgContentEditor, getOrgIdAndRole } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  scope: z.enum(['org', 'subject', 'course']).default('org'),
  course_id: z.string().uuid().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgContentEditor(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data, error } = await admin
    .from('knowledge_bases')
    .select('id, name, description, scope, course_id, metadata, created_at, updated_at, created_by')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const kbIds = (data ?? []).map((k) => k.id as string)
  const docCounts: Record<string, number> = {}
  if (kbIds.length) {
    const { data: counts } = await admin
      .from('kb_ingest_queue')
      .select('kb_id')
      .in('kb_id', kbIds)
      .eq('status', 'completed')
    for (const row of counts ?? []) {
      const kid = row.kb_id as string
      docCounts[kid] = (docCounts[kid] ?? 0) + 1
    }
  }

  return NextResponse.json({
    knowledge_bases: (data ?? []).map((k) => ({
      ...k,
      completed_uploads: docCounts[k.id as string] ?? 0,
    })),
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgContentEditor(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, description, scope, course_id, metadata } = parsed.data
  if (scope === 'course' && !course_id) {
    return NextResponse.json({ error: 'course_id required for course-scoped KB' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  if (course_id) {
    const { data: course } = await admin.from('courses').select('org_id').eq('id', course_id).maybeSingle()
    if (!course || course.org_id !== orgId) {
      return NextResponse.json({ error: 'course not in org' }, { status: 400 })
    }
  }

  const { data, error } = await admin
    .from('knowledge_bases')
    .insert({
      org_id: orgId,
      name,
      description: description ?? null,
      scope,
      course_id: course_id ?? null,
      metadata: metadata ?? {},
      created_by: user.id,
    })
    .select('id, name, description, scope, course_id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ knowledge_base: data })
}
