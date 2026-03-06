import { authorizeCourseAccess } from '@/lib/courseAccess'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const { id, moduleId } = await params
  const access = await authorizeCourseAccess(id, 'update_module')
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

  const admin = createAdminClient()
  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if ('title' in body) updates.title = body.title
  if ('content' in body) updates.content = body.content
  if ('order_index' in body) updates.order_index = body.order_index
  if ('quiz' in body) updates.quiz = body.quiz

  const { data, error } = await admin
    .from('modules')
    .update(updates)
    .eq('id', moduleId)
    .eq('course_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const { id, moduleId } = await params
  const access = await authorizeCourseAccess(id, 'delete_module')
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

  const admin = createAdminClient()

  const { error } = await admin
    .from('modules')
    .delete()
    .eq('id', moduleId)
    .eq('course_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
