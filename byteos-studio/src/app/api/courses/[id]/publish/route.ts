import { authorizeCourseAccess } from '@/lib/courseAccess'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await authorizeCourseAccess(id, 'publish')
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

  const admin = createAdminClient()

  const { count } = await admin
    .from('modules')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id)

  if (!count || count === 0) {
    return NextResponse.json(
      { error: 'Add at least one module before publishing.' },
      { status: 400 }
    )
  }

  const { data, error } = await admin
    .from('courses')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await authorizeCourseAccess(id, 'publish')
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('courses')
    .update({ status: 'draft', published_at: null })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
