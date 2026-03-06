import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CourseViewer } from './CourseViewer'
import type { ModuleContent, ModalityVariants } from '@/types/content'

interface ViewerCourse {
  id: string
  title: string
  settings?: {
    module_completion?: Record<string, { type: 'mark_button' | 'min_time'; min_time_secs?: number }>
  } | null
  modules: {
    id: string
    title: string
    content: ModuleContent | null
    modality_variants?: ModalityVariants | null
    order_index: number
    quiz?: { questions: unknown[] } | null
  }[]
}

export default async function CourseLearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ module?: string }>
}) {
  const { id } = await params
  const { module } = await searchParams
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
    .eq('course_id', id)
    .single()

  if (!enrollment) redirect(`/courses/${id}`)

  const { data: course } = await admin
    .from('courses')
    .select('id, title, settings, modules(id, title, content, modality_variants, order_index, quiz)')
    .eq('id', id)
    .eq('status', 'published')
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single()

  if (!course || !course.modules?.length) notFound()

  const { data: completedEvents } = await admin
    .from('learning_events')
    .select('module_id')
    .eq('user_id', user.id)
    .eq('course_id', id)
    .eq('event_type', 'module_complete')

  const completedModuleIds = new Set(completedEvents?.map((e) => e.module_id) ?? [])

  const activeModuleId = module ?? course.modules[0].id

  // Only show welcome on first-ever visit (before any module completion)
  const isFirstVisit = completedModuleIds.size === 0 && enrollment.status !== 'completed'
  const welcome = isFirstVisit ? (enrollment.personalized_welcome as Record<string, unknown> | null) : null

  return (
    <CourseViewer
      course={course as ViewerCourse}
      activeModuleId={activeModuleId}
      completedModuleIds={Array.from(completedModuleIds)}
      enrollmentProgress={Math.round(enrollment.progress_pct)}
      personalizedWelcome={welcome}
      learnerName={learnerName}
    />
  )
}
