import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getEditableCourse } from '@/lib/courses/courseAccess'
import { storedModuleQualitySchema, unresolvedCritical } from '@shared-content-generation/quality'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const course = await getEditableCourse(admin, id, user.id)
  if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })

  const { data: modules, error: modErr } = await admin
    .from('modules')
    .select('id, title, review_status, quality')
    .eq('course_id', id)
  if (modErr) return NextResponse.json({ success: false, error: modErr.message }, { status: 500 })

  if (!modules || modules.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Add at least one module before publishing.' },
      { status: 400 }
    )
  }

  const blocking = modules
    .filter((m) => m.review_status !== 'approved')
    .map((m) => {
      const parsed = storedModuleQualitySchema.safeParse(m.quality)
      return { id: m.id, title: m.title, critical: parsed.success ? unresolvedCritical(parsed.data).length : 0 }
    })
    .filter((m) => m.critical > 0)

  if (blocking.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `${blocking.length} module(s) have unresolved critical quality issues. Review them on the Quality page before publishing.`,
        data: { blocking_modules: blocking },
      },
      { status: 409 }
    )
  }

  const { data, error } = await admin
    .from('courses')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const course = await getEditableCourse(admin, id, user.id)
  if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })

  const { data, error } = await admin
    .from('courses')
    .update({ status: 'draft', published_at: null })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
