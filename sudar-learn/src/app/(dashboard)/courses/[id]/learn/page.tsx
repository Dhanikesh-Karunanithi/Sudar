import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CourseViewer, type ModulePersonalizationOverlay } from './CourseViewer'
import type { ComponentProps } from 'react'
import { resolvePersonalizationAccess } from '@/lib/personalization/eligibility'
import type { PersonalizationEligibility } from '@/lib/personalization/eligibility'

function serializeGate(e: PersonalizationEligibility): { allowed: boolean; reason?: string } {
  return e.allowed ? { allowed: true } : { allowed: false, reason: e.reason }
}

type CourseForViewer = ComponentProps<typeof CourseViewer>['course']

export default async function CourseLearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ module?: string }>
}) {
  const { id } = await params
  const { module: selectedModuleId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).single()
  const learnerName = profile?.full_name?.split(' ')[0] ?? undefined

  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id, progress_pct, status, personalized_welcome, personalization_overlays')
    .eq('user_id', user.id)
    .eq('course_id', id)
    .single()

  if (!enrollment) redirect(`/courses/${id}`)

  const personalizationAccess = await resolvePersonalizationAccess(admin, user.id, id)

  const { data: course } = await admin
    .from('courses')
    .select('id, title, template, settings, modules(id, title, content, modality_variants, order_index, quiz, sudarplay_map_url, sudarplay_map_id)')
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

  const completedModuleIds = new Set(
    (completedEvents ?? [])
      .map((e) => e.module_id)
      .filter((id): id is string => typeof id === 'string')
  )

  const activeModuleId = selectedModuleId ?? course.modules[0].id

  const welcomeRaw = enrollment.personalized_welcome as Record<string, unknown> | null
  const hasStoredWelcome =
    typeof welcomeRaw?.message === 'string' && (welcomeRaw.message as string).trim().length > 0

  // Only auto-show stored welcome on first stretch of the course (before any module completion)
  const isFirstVisit = completedModuleIds.size === 0 && enrollment.status !== 'completed'
  const welcome = isFirstVisit ? welcomeRaw : null

  const personalizeOffered =
    !hasStoredWelcome
    && enrollment.status !== 'completed'
    && personalizationAccess.courseWelcome.allowed

  return (
    <CourseViewer
      course={course as unknown as CourseForViewer}
      activeModuleId={activeModuleId}
      completedModuleIds={Array.from(completedModuleIds)}
      enrollmentProgress={Math.round(enrollment.progress_pct)}
      enrollmentId={enrollment.id}
      personalizeOffered={personalizeOffered}
      personalizedWelcome={welcome}
      learnerName={learnerName}
      personalizationAccess={{
        courseWelcome: serializeGate(personalizationAccess.courseWelcome),
        moduleRoleExplain: serializeGate(personalizationAccess.moduleRoleExplain),
        moduleBrief: serializeGate(personalizationAccess.moduleBrief),
        orgRequiresConsent: personalizationAccess.orgRequiresConsent,
        hasConsent: personalizationAccess.hasConsent,
      }}
      personalizationOverlays={
        (enrollment.personalization_overlays as Record<string, ModulePersonalizationOverlay> | null) ?? null
      }
    />
  )
}
