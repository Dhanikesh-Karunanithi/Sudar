import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, Clock, List, CheckCircle2, Globe } from 'lucide-react'
import { ExternalCourseDetailSection } from './ExternalCourseDetailSection'
import { ExternalCourseLabel } from '@/components/courses/ExternalCourseLabel'
import { cn } from '@/lib/utils'
import { SudarCourseBannerArt } from '@/components/branding/SudarCourseDefaultArt'
import { CourseArtPatternSelect } from '@/components/branding/CourseArtPatternSelect'
import { EnrollButton } from './EnrollButton'
import { getExternalProviderMeta } from '@/lib/courses/externalProviders'

const difficultyConfig = {
  beginner: { label: 'Beginner', class: 'text-success bg-success/10 border border-success/30' },
  intermediate: { label: 'Intermediate', class: 'text-warning bg-warning/10 border border-warning/30' },
  advanced: { label: 'Advanced', class: 'text-destructive bg-destructive/10 border border-destructive/30' },
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceRoleSupabaseClient()

  const { data: course } = await admin
    .from('courses')
    .select(
      'id, title, description, difficulty, estimated_duration_mins, tags, thumbnail_url, banner_url, is_external, external_provider, external_url, embed_url, modules(id, title, order_index)',
    )
    .eq('id', id)
    .eq('status', 'published')
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single()

  if (!course) notFound()

  const isExternal = Boolean(course.is_external)
  const providerMeta = isExternal ? getExternalProviderMeta(course.external_provider) : null

  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id, status, progress_pct, started_at, completed_at')
    .eq('user_id', user!.id)
    .eq('course_id', id)
    .single()

  const { data: completedEvents } = await admin
    .from('learning_events')
    .select('module_id')
    .eq('user_id', user!.id)
    .eq('course_id', id)
    .eq('event_type', 'module_complete')

  const completedModuleIds = new Set(completedEvents?.map((e) => e.module_id) ?? [])
  const diff = difficultyConfig[course.difficulty as keyof typeof difficultyConfig]

  return (
    <div className={isExternal ? 'max-w-6xl mx-auto space-y-8' : 'max-w-3xl mx-auto space-y-8'}>
      {/* Back */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-card-foreground text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Course catalog
      </Link>

      <CourseArtPatternSelect
        compact
        id="course-detail-art-pattern"
        className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5"
      />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-card-xl border border-primary/20 bg-primary/5">
        {course.banner_url ? (
          <div className="relative h-40 w-full sm:h-48">
            <Image
              src={course.banner_url}
              alt=""
              fill
              className="object-cover"
              unoptimized
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-background/20" />
          </div>
        ) : (
          <div className="relative h-40 w-full sm:h-48">
            <SudarCourseBannerArt
              courseId={course.id}
              title={course.title}
              difficulty={course.difficulty}
              estimatedDurationMins={course.estimated_duration_mins}
              moduleCount={course.modules?.length ?? null}
            />
          </div>
        )}
        <div className={cn('p-8', course.banner_url && '-mt-12 relative')}>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-card bg-card shadow-sm border border-border flex items-center justify-center shrink-0">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold text-card-foreground">{course.title}</h1>
              {course.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">{course.description}</p>
              )}
              {Array.isArray(course.tags) && course.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {course.tags.slice(0, 8).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-pill"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap pt-1">
                {isExternal && providerMeta && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-pill border',
                      providerMeta.accentClass,
                    )}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {providerMeta.label}
                  </span>
                )}
                {diff && (
                  <span className={cn('text-xs font-medium px-2.5 py-1 rounded-pill', diff.class)}>
                    {diff.label}
                  </span>
                )}
                {course.estimated_duration_mins && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {course.estimated_duration_mins} minutes
                  </span>
                )}
                {!isExternal && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <List className="w-4 h-4" />
                    {course.modules?.length ?? 0} modules
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar (if enrolled) */}
      {enrollment && (
        <div className="bg-card border border-border rounded-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-card-foreground">Your progress</span>
            <span className="text-sm font-semibold text-primary">{Math.round(enrollment.progress_pct)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${enrollment.progress_pct}%` }}
            />
          </div>
          {enrollment.status === 'completed' && (
            <div className="flex items-center gap-2 text-success text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Completed!
            </div>
          )}
        </div>
      )}

      {isExternal && (
        <ExternalCourseDetailSection
          title={course.title}
          externalProvider={course.external_provider}
          externalUrl={course.external_url}
          embedUrl={course.embed_url}
        />
      )}

      {/* Modules list */}
      {!isExternal && (
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-card-foreground">Course content</h2>
        {(!course.modules || course.modules.length === 0) ? (
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">No modules yet.</p>
            <p className="text-muted-foreground">
              Try another published course from the{' '}
              <Link href="/courses" className="text-primary font-medium hover:underline">
                course catalog
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-card overflow-hidden divide-y divide-border">
            {course.modules.map((mod, idx) => {
              const isComplete = completedModuleIds.has(mod.id)
              const canView = !!enrollment

              return (
                <div key={mod.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                    isComplete ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  )}>
                    {isComplete ? <CheckCircle2 className="w-4 h-4 text-success" /> : idx + 1}
                  </div>
                  <span className={cn(
                    'flex-1 text-sm font-medium',
                    isComplete ? 'text-muted-foreground line-through' : 'text-card-foreground'
                  )}>
                    {mod.title}
                  </span>
                  {canView ? (
                    <Link
                      href={`/courses/${course.id}/learn?module=${mod.id}`}
                      className="text-xs font-medium text-primary hover:opacity-90 px-3 py-1.5 rounded-button hover:bg-primary/10 transition-all"
                    >
                      {isComplete ? 'Review' : 'Start →'}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">Enroll to unlock</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      )}

      {/* Primary CTA: Enrol / Start / Continue / Review */}
      <div className="flex justify-center pb-8">
        <EnrollButton
          courseId={course.id}
          isEnrolled={!!enrollment}
          isExternal={isExternal}
          hasModules={isExternal || (course.modules?.length ?? 0) > 0}
          firstModuleId={course.modules?.[0]?.id}
          progressPct={enrollment?.progress_pct ?? 0}
          enrollmentStatus={enrollment?.status}
        />
      </div>
    </div>
  )
}
