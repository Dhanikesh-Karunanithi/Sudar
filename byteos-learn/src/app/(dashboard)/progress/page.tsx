import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart2,
  BookOpen,
  Route,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
} from 'lucide-react'
import { BentoCard } from '@/components/ui/BentoCard'
import { ProgressPieChartClient } from '@/components/progress/ProgressPieChartClient'

export const metadata: Metadata = { title: 'Progress' }

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createAdminClient()

  const [
    { data: courseEnrollments },
    { data: pathEnrollments },
    { data: certifications },
  ] = await Promise.all([
    admin
      .from('enrollments')
      .select('id, course_id, status, progress_pct, completed_at')
      .eq('user_id', user.id)
      .not('course_id', 'is', null)
      .order('updated_at', { ascending: false }),
    admin
      .from('enrollments')
      .select('id, path_id, status, progress_pct, completed_at, personalized_sequence')
      .eq('user_id', user.id)
      .not('path_id', 'is', null)
      .order('created_at', { ascending: false }),
    admin
      .from('certifications')
      .select('id, path_id, path_title, issued_at, verification_code')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false }),
  ])

  // Deduplicate enrollments by course_id (keep most recently updated first due to order above)
  const courseEnrollmentsDeduped = (() => {
    const byCourse = new Map<string, (typeof courseEnrollments extends Array<infer T> ? T : any)>()
    for (const e of courseEnrollments ?? []) {
      const cid = e.course_id as string | null
      if (!cid) continue
      if (!byCourse.has(cid)) byCourse.set(cid, e)
    }
    return Array.from(byCourse.values())
  })()

  const courseIds = [...new Set(courseEnrollmentsDeduped.map((e) => e.course_id).filter(Boolean))]
  const pathIds = [...new Set((pathEnrollments ?? []).map((e) => e.path_id).filter(Boolean))]

  let courses: Array<{ id: string; title: string; description: string | null }> = []
  let paths: Array<{ id: string; title: string; description: string | null }> = []

  if (courseIds.length > 0) {
    const { data } = await admin.from('courses').select('id, title, description').in('id', courseIds)
    courses = data ?? []
  }
  if (pathIds.length > 0) {
    const { data } = await admin.from('learning_paths').select('id, title, description').in('id', pathIds)
    paths = data ?? []
  }

  const courseProgress = courseEnrollmentsDeduped.map((e) => {
    const c = courses.find((x) => x.id === e.course_id)
    return { ...e, title: c?.title ?? 'Course', description: c?.description }
  })
  const pathProgress = (pathEnrollments ?? []).map((e) => {
    const p = paths.find((x) => x.id === e.path_id)
    return { ...e, title: p?.title ?? 'Path', description: p?.description }
  })

  const inProgressCourses = courseProgress.filter((e) => e.status !== 'completed')
  const completedCourses = courseProgress.filter((e) => e.status === 'completed')
  const inProgressPaths = pathProgress.filter((e) => e.status !== 'completed')
  const completedPaths = pathProgress.filter((e) => e.status === 'completed')

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-card-foreground flex items-center gap-2">
          <BarChart2 className="w-7 h-7 text-primary" />
          My Progress
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your courses, learning paths, and certificates
        </p>
      </div>

      {/* Summary stats + Pie chart row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="kpi-card !p-5">
            <p className="text-muted-foreground text-xs font-medium">Courses in progress</p>
            <p className="text-2xl font-bold text-card-foreground mt-1">{inProgressCourses.length}</p>
          </div>
          <div className="kpi-card !p-5">
            <p className="text-muted-foreground text-xs font-medium">Courses completed</p>
            <p className="text-2xl font-bold text-success mt-1">{completedCourses.length}</p>
          </div>
          <div className="kpi-card !p-5">
            <p className="text-muted-foreground text-xs font-medium">Paths in progress</p>
            <p className="text-2xl font-bold text-card-foreground mt-1">{inProgressPaths.length}</p>
          </div>
          <div className="kpi-card !p-5">
            <p className="text-muted-foreground text-xs font-medium">Certificates</p>
            <p className="text-2xl font-bold text-warning mt-1">{certifications?.length ?? 0}</p>
          </div>
        </div>
        <div className="kpi-card flex flex-col" id="certifications">
          <h3 className="font-display text-xl font-bold text-card-foreground mb-4">Distribution</h3>
          <ProgressPieChartClient
            data={[
              { name: 'Courses in progress', value: inProgressCourses.length, color: 'var(--primary)' },
              { name: 'Courses completed', value: completedCourses.length, color: 'var(--success)' },
              { name: 'Paths in progress', value: inProgressPaths.length, color: 'var(--accent)' },
              { name: 'Certificates', value: certifications?.length ?? 0, color: 'var(--warning)' },
            ].filter((d) => d.value > 0)}
        />
        </div>
      </div>

      {/* Certificates */}
      {certifications && certifications.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-warning" />
            Certificates earned
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((cert) => (
              <Link key={cert.id} href={`/cert/${cert.verification_code}`} target="_blank">
                <BentoCard padding="sm" className="flex items-center gap-4 hover:shadow-md hover:border-warning/50 transition-all group">
                  <div className="w-12 h-12 rounded-card bg-warning/10 border border-warning/30 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {cert.path_title ?? 'Learning Path'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Issued {new Date(cert.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </BentoCard>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Learning paths */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
          <Route className="w-4 h-4 text-primary" />
          Learning paths
        </h2>
        {pathProgress.length === 0 ? (
          <BentoCard padding="lg" className="text-center text-muted-foreground text-sm">
            No path enrollments yet. <Link href="/paths" className="text-primary hover:underline">Browse paths</Link>
          </BentoCard>
        ) : (
          <div className="space-y-3">
            {inProgressPaths.map((p) => (
              <Link key={p.id} href={`/paths/${p.path_id}`}>
                <BentoCard padding="sm" className="hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-card bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Route className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-card-foreground line-clamp-1">{p.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{Math.round(p.progress_pct)}% complete</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress_pct}%` }} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </BentoCard>
              </Link>
            ))}
            {completedPaths.map((p) => (
              <Link key={p.id} href={`/paths/${p.path_id}`}>
                <BentoCard padding="sm" className="border-success/30 hover:border-success/50 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-card bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-card-foreground line-clamp-1">{p.title}</p>
                        <p className="text-xs text-success mt-0.5">Completed</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </BentoCard>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Courses */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Courses
        </h2>
        {courseProgress.length === 0 ? (
          <BentoCard padding="lg" className="text-center text-muted-foreground text-sm">
            No course enrollments yet. <Link href="/courses" className="text-primary hover:underline">Browse courses</Link>
          </BentoCard>
        ) : (
          <div className="space-y-3">
            {inProgressCourses.map((e) => (
              <Link key={e.id} href={`/courses/${e.course_id}/learn`}>
                <BentoCard padding="sm" className="hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-card bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-card-foreground line-clamp-1">{e.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{Math.round(e.progress_pct)}% complete</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${e.progress_pct}%` }} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </BentoCard>
              </Link>
            ))}
            {completedCourses.map((e) => (
              <Link key={e.id} href={`/courses/${e.course_id}/learn`}>
                <BentoCard padding="sm" className="border-success/30 hover:border-success/50 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-card bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-success" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-card-foreground line-clamp-1">{e.title}</p>
                        <p className="text-xs text-success mt-0.5">Completed</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </BentoCard>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
