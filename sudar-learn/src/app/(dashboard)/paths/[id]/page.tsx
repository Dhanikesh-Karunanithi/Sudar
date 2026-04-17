import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Route, BookOpen, Lock, Zap, Award, CheckCircle2, LockKeyhole } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PathEnrollButton } from './PathEnrollButton'
import { BentoCard } from '@/components/ui/BentoCard'
import { PathNodeGraph } from '@/components/paths/PathNodeGraph'

interface PathCourse {
  course_id: string
  order_index: number
  is_mandatory: boolean
  title: string
  difficulty: string | null
  skip_reason?: string | null
  seq_status?: string
}

export default async function LearnPathDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const { data: path } = await admin
    .from('learning_paths')
    .select('*')
    .eq('id', params.id)
    .eq('status', 'published')
    .single()

  if (!path) notFound()

  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id, status, progress_pct, personalized_sequence')
    .eq('user_id', user!.id)
    .eq('path_id', params.id)
    .single()

  // Get completion status for each course
  const { data: courseEnrollments } = await admin
    .from('enrollments')
    .select('course_id, status, progress_pct')
    .eq('user_id', user!.id)

  const courseStatusMap: Record<string, { status: string; progress_pct: number }> = {}
  for (const ce of courseEnrollments ?? []) {
    if (ce.course_id) courseStatusMap[ce.course_id] = { status: ce.status, progress_pct: ce.progress_pct }
  }

  // Use personalized sequence if enrolled, otherwise use path's default courses
  const displayCourses: PathCourse[] = enrollment?.personalized_sequence
    ? (enrollment.personalized_sequence as PathCourse[])
    : (path.courses as PathCourse[]) ?? []

  // Check for existing certificate
  const { data: cert } = await admin
    .from('certifications')
    .select('verification_code, issued_at')
    .eq('user_id', user!.id)
    .eq('path_id', params.id)
    .single()

  const mandatoryCompleted = displayCourses.filter((c) => c.is_mandatory).every(
    (c) => courseStatusMap[c.course_id]?.status === 'completed'
  )

  // Node status for PathNodeGraph: completed | current (next to do or in progress) | locked
  const nodeStatus: Record<string, 'completed' | 'current' | 'locked'> = {}
  let seenCurrent = false
  for (const c of displayCourses) {
    const cs = courseStatusMap[c.course_id]
    if (cs?.status === 'completed') {
      nodeStatus[c.course_id] = 'completed'
    } else if (!seenCurrent && enrollment) {
      nodeStatus[c.course_id] = 'current'
      seenCurrent = true
    } else {
      nodeStatus[c.course_id] = 'locked'
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link href="/paths" className="inline-flex items-center gap-2 text-muted-foreground hover:text-card-foreground text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />All paths
      </Link>

      {/* Hero */}
      <BentoCard padding="lg" className="rounded-card-xl space-y-5">
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-card flex items-center justify-center shrink-0',
            path.is_mandatory ? 'bg-warning/10 border border-warning/30' : 'bg-primary/10 border border-primary/20'
          )}>
            <Route className={cn('w-6 h-6', path.is_mandatory ? 'text-warning' : 'text-primary')} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-card-foreground">{path.title}</h1>
            {path.description && <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{path.description}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2.5 py-1 bg-muted text-muted-foreground rounded-pill flex items-center gap-1">
            <BookOpen className="w-3 h-3" />{displayCourses.length} courses · {displayCourses.filter((c) => c.is_mandatory).length} mandatory
          </span>
          {path.is_adaptive && (
            <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-pill flex items-center gap-1">
              <Zap className="w-3 h-3" />Sequence personalised for you
            </span>
          )}
          {path.is_mandatory && (
            <span className="text-xs px-2.5 py-1 bg-warning/10 text-warning-foreground rounded-pill flex items-center gap-1">
              <Lock className="w-3 h-3" />Required by your organisation
            </span>
          )}
          {path.issues_certificate && (
            <span className="text-xs px-2.5 py-1 bg-warning/10 text-warning-foreground rounded-pill flex items-center gap-1">
              <Award className="w-3 h-3" />Issues certificate on completion
            </span>
          )}
        </div>

        {/* Progress bar */}
        {enrollment && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Overall progress</span>
              <span className={cn('font-semibold', enrollment.status === 'completed' ? 'text-success' : 'text-primary')}>
                {enrollment.status === 'completed' ? '✓ Completed' : `${Math.round(enrollment.progress_pct)}%`}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className={cn('h-2 rounded-full transition-all', enrollment.status === 'completed' ? 'bg-success' : 'bg-primary')} style={{ width: `${enrollment.progress_pct}%` }} />
            </div>
          </div>
        )}

        {/* Certificate */}
        {cert ? (
          <div className="bg-warning/10 border border-warning/30 rounded-card p-4 flex items-center gap-3">
            <Award className="w-5 h-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-warning-foreground">Certificate earned!</p>
              <p className="text-xs text-warning-foreground/80">Issued {new Date(cert.issued_at).toLocaleDateString()}</p>
            </div>
            <Link href={`/cert/${cert.verification_code}`} target="_blank"
              className="text-xs px-3 py-1.5 bg-warning hover:opacity-90 text-warning-foreground rounded-button font-medium transition-colors">
              View →
            </Link>
          </div>
        ) : !enrollment ? (
          <PathEnrollButton pathId={params.id} />
        ) : null}
      </BentoCard>

      {/* Path node graph */}
      {enrollment && displayCourses.length > 0 && (
        <PathNodeGraph nodes={displayCourses} statusByCourseId={nodeStatus} />
      )}

      {/* Course sequence */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-card-foreground">
          {enrollment?.personalized_sequence ? 'Your personalised sequence' : 'Course sequence'}
        </h2>
        {path.is_adaptive && enrollment?.personalized_sequence && (
          <p className="text-xs text-primary flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-button px-3 py-2">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            Sudar reordered optional courses based on your knowledge and learning goals.
          </p>
        )}

        <div className="space-y-2">
          {displayCourses.map((course, idx) => {
            const cs = courseStatusMap[course.course_id]
            const isDone = cs?.status === 'completed'
            const inProgress = cs?.status === 'in_progress'
            const allPreviousDone = displayCourses.slice(0, idx).every((c) => courseStatusMap[c.course_id]?.status === 'completed')
            const isNext = !isDone && !inProgress && allPreviousDone
            const isLocked = enrollment && !isDone && !inProgress && !allPreviousDone

            return (
              <div key={course.course_id}
                className={cn('bg-card border rounded-card p-4 flex items-center gap-4 transition-all',
                  isDone ? 'border-success/30 bg-success/5' : isNext ? 'border-primary/30 shadow-sm' : isLocked ? 'border-border opacity-90' : 'border-border'
                )}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                  isDone ? 'bg-success/10 text-success' : isNext ? 'bg-primary/10 text-primary' : isLocked ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-success" /> : isLocked ? <LockKeyhole className="w-4 h-4 text-muted-foreground" /> : idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn('text-sm font-medium line-clamp-1', isDone ? 'text-muted-foreground line-through' : isLocked ? 'text-muted-foreground' : 'text-card-foreground')}>{course.title}</p>
                    {course.is_mandatory
                      ? <span className="text-[10px] px-1.5 py-0.5 bg-destructive/10 text-destructive rounded font-medium">Required</span>
                      : <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">Optional</span>}
                    {isLocked && <span className="text-[10px] px-1.5 py-0.5 bg-warning/10 text-warning-foreground rounded flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />Complete previous first</span>}
                  </div>
                  {course.skip_reason && !isDone && !isLocked && (
                    <p className="text-[11px] text-primary mt-0.5 flex items-center gap-1">
                      <Zap className="w-3 h-3" />{course.skip_reason}
                    </p>
                  )}
                  {inProgress && cs.progress_pct > 0 && (
                    <div className="mt-1 w-24 bg-muted rounded-full h-1">
                      <div className="bg-primary h-1 rounded-full" style={{ width: `${cs.progress_pct}%` }} />
                    </div>
                  )}
                </div>

                {enrollment && (
                  isLocked ? (
                    <span className="text-xs px-3 py-1.5 rounded-button font-medium shrink-0 text-muted-foreground bg-muted cursor-not-allowed">
                      Locked
                    </span>
                  ) : (
                    <Link href={isDone || inProgress ? `/courses/${course.course_id}/learn` : `/courses/${course.course_id}`}
                      className={cn('text-xs px-3 py-1.5 rounded-button font-medium transition-all shrink-0',
                        isDone ? 'text-muted-foreground hover:text-card-foreground' : isNext || inProgress ? 'bg-primary hover:opacity-90 text-primary-foreground' : 'text-muted-foreground hover:text-card-foreground'
                      )}>
                      {isDone ? 'Review' : inProgress ? 'Continue' : isNext ? 'Start →' : 'Preview'}
                    </Link>
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
