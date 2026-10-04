import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getEditableCourse } from '@/lib/courses/courseAccess'
import { storedModuleQualitySchema, unresolvedCritical } from '@shared-content-generation/quality'
import type { Json } from '@/types/database'

export const dynamic = 'force-dynamic'

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve'), module_id: z.string().uuid() }),
  z.object({ action: z.literal('needs_review'), module_id: z.string().uuid() }),
  z.object({ action: z.literal('resolve_issue'), module_id: z.string().uuid(), issue_key: z.string().min(1).max(300) }),
])

async function auth(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) }
  const admin = createServiceRoleSupabaseClient()
  const course = await getEditableCourse(admin, id, user.id)
  if (!course) return { error: NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 }) }
  return { user, admin, course }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await auth(id)
  if ('error' in ctx) return ctx.error

  const { data, error } = await ctx.admin
    .from('modules')
    .select('id, title, order_index, review_status, quality, reviewed_at')
    .eq('course_id', id)
    .order('order_index', { ascending: true })
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  const modules = (data ?? []).map((m) => {
    const parsed = storedModuleQualitySchema.safeParse(m.quality)
    const quality = parsed.success ? parsed.data : null
    return {
      id: m.id,
      title: m.title,
      order_index: m.order_index,
      review_status: m.review_status,
      reviewed_at: m.reviewed_at,
      quality,
      unresolved_critical: unresolvedCritical(quality).length,
    }
  })
  return NextResponse.json({ success: true, data: { course: { id, title: ctx.course.title }, modules } })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await auth(id)
  if ('error' in ctx) return ctx.error

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  const body = parsed.data

  const { data: mod } = await ctx.admin
    .from('modules')
    .select('id, quality')
    .eq('id', body.module_id)
    .eq('course_id', id)
    .maybeSingle()
  if (!mod) return NextResponse.json({ success: false, error: 'Module not found' }, { status: 404 })

  const now = new Date().toISOString()
  if (body.action === 'resolve_issue') {
    const q = storedModuleQualitySchema.safeParse(mod.quality)
    if (!q.success) return NextResponse.json({ success: false, error: 'Module has no quality record' }, { status: 400 })
    const resolved = [...new Set([...q.data.resolved_issue_keys, body.issue_key])]
    const { error } = await ctx.admin
      .from('modules')
      .update({ quality: { ...q.data, resolved_issue_keys: resolved } as unknown as Json })
      .eq('id', mod.id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } else {
    const { error } = await ctx.admin
      .from('modules')
      .update({
        review_status: body.action === 'approve' ? 'approved' : 'needs_review',
        reviewed_by: ctx.user.id,
        reviewed_at: now,
      })
      .eq('id', mod.id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  await ctx.admin.from('audit_events').insert({
    actor_user_id: ctx.user.id,
    org_id: ctx.course.org_id,
    action: `module_quality_${body.action}`,
    payload: {
      course_id: id,
      module_id: mod.id,
      ...(body.action === 'resolve_issue' ? { issue_key: body.issue_key } : {}),
    },
  } as never)

  return NextResponse.json({ success: true })
}
