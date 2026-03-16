import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Clock, List, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EnrollButton } from './EnrollButton'

const difficultyConfig = {
  beginner: { label: 'Beginner', class: 'text-success bg-success/10 border border-success/30' },
  intermediate: { label: 'Intermediate', class: 'text-warning bg-warning/10 border border-warning/30' },
  advanced: { label: 'Advanced', class: 'text-destructive bg-destructive/10 border border-destructive/30' },
}

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const { data: course } = await admin
    .from('courses')
    .select('id, title, description, difficulty, estimated_duration_mins, modules(id, title, order_index)')
    .eq('id', params.id)
    .eq('status', 'published')
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single()

  if (!course) notFound()

  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id, status, progress_pct, started_at, completed_at')
    .eq('user_id', user!.id)
    .eq('course_id', params.id)
    .single()

  const { data: completedEvents } = await admin
    .from('learning_events')
    .select('module_id')
    .eq('user_id', user!.id)
    .eq('course_id', params.id)
    .eq('event_type', 'module_complete')

  const completedModuleIds = new Set(completedEvents?.map((e) => e.module_id) ?? [])
  const diff = difficultyConfig[course.difficulty as keyof typeof difficultyConfig]

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-card-foreground text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Course catalog
      </Link>

      {/* Hero */}
      <div className="bg-primary/5 rounded-card-xl p-8 border border-primary/20">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-card bg-card shadow-sm border border-border flex items-center justify-center shrink-0">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold text-card-foreground">{course.title}</h1>
            {course.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">{course.description}</p>
            )}
            <div className="flex items-center gap-3 flex-wrap pt-1">
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
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <List className="w-4 h-4" />
                {course.modules?.length ?? 0} modules
              </span>
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

      {/* Modules list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-card-foreground">Course content</h2>
        {(!course.modules || course.modules.length === 0) ? (
          <p className="text-muted-foreground text-sm">No modules yet.</p>
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

      {/* Primary CTA: Enrol / Start / Continue / Review */}
      <div className="flex justify-center pb-8">
        <EnrollButton
          courseId={course.id}
          isEnrolled={!!enrollment}
          hasModules={(course.modules?.length ?? 0) > 0}
          firstModuleId={course.modules?.[0]?.id}
          progressPct={enrollment?.progress_pct ?? 0}
          enrollmentStatus={enrollment?.status}
        />
      </div>
    </div>
  )
}
