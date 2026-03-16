import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CourseViewer } from './CourseViewer'

export default async function CourseLearnPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { module?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).single()
  const learnerName = profile?.full_name?.split(' ')[0] ?? undefined

  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id, progress_pct, status, personalized_welcome')
    .eq('user_id', user.id)
    .eq('course_id', params.id)
    .single()

  if (!enrollment) redirect(`/courses/${params.id}`)

  const { data: course } = await admin
    .from('courses')
    .select('id, title, template, settings, modules(id, title, content, modality_variants, order_index, quiz, sudarplay_map_url, sudarplay_map_id)')
    .eq('id', params.id)
    .eq('status', 'published')
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single()

  if (!course || !course.modules?.length) notFound()

  const { data: completedEvents } = await admin
    .from('learning_events')
    .select('module_id')
    .eq('user_id', user.id)
    .eq('course_id', params.id)
    .eq('event_type', 'module_complete')

  const completedModuleIds = new Set(completedEvents?.map((e) => e.module_id) ?? [])

  const activeModuleId = searchParams.module ?? course.modules[0].id

  // Only show welcome on first-ever visit (before any module completion)
  const isFirstVisit = completedModuleIds.size === 0 && enrollment.status !== 'completed'
  const welcome = isFirstVisit ? (enrollment.personalized_welcome as Record<string, unknown> | null) : null

  return (
    <CourseViewer
      course={course as any}
      activeModuleId={activeModuleId}
      completedModuleIds={Array.from(completedModuleIds)}
      enrollmentProgress={Math.round(enrollment.progress_pct)}
      personalizedWelcome={welcome}
      learnerName={learnerName}
    />
  )
}
