import { authorizeCourseAccess } from '@/lib/courseAccess'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await authorizeCourseAccess(id, 'add_module')
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

  const admin = createAdminClient()

  const { data: lastModule } = await admin
    .from('modules')
    .select('order_index')
    .eq('course_id', id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const nextIndex = (lastModule?.order_index ?? -1) + 1
  const body = await request.json()

  const { data, error } = await admin
    .from('modules')
    .insert({
      course_id: id,
      title: body.title ?? 'Untitled Module',
      content: body.content ?? { type: 'text', body: '' },
      order_index: nextIndex,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
