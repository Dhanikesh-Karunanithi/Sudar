import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { getOrCreateOrg } from '@/lib/org'
import { BookOpen, Users, BarChart2, Plus, ArrowRight, Sparkles, Globe, Activity, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Greeting } from '@/components/dashboard/Greeting'

export const metadata: Metadata = { title: 'Dashboard' }

function StatCard({
  label,
  value,
  icon: Icon,
  description,
  accent,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description: string
  accent?: boolean
}) {
  return (
    <div className={cn(
      'bg-card border rounded-xl p-5 space-y-3',
      accent ? 'border-indigo-500/30' : 'border-border'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          accent ? 'bg-indigo-600/15' : 'bg-muted'
        )}>
          <Icon className={cn('w-4 h-4', accent ? 'text-indigo-400' : 'text-muted-foreground')} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-card-foreground">{value}</p>
        <p className="text-muted-foreground text-xs mt-1">{description}</p>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, orgId] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
    getOrCreateOrg(user!.id),
  ])
  const admin = createServiceRoleSupabaseClient()

  const { data: orgCourseIds } = await admin
    .from('courses')
    .select('id')
    .eq('org_id', orgId)

  const courseIdList = orgCourseIds?.map((c) => c.id) ?? []

  const [
    { count: totalCourses },
    { count: publishedCourses },
    { count: totalLearners },
    { count: completions },
    { data: recentCourses },
    { count: draftCourses },
  ] = await Promise.all([
    admin.from('courses').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    admin.from('courses').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'published'),
    courseIdList.length > 0
      ? admin.from('enrollments').select('user_id', { count: 'exact', head: true }).in('course_id', courseIdList)
      : Promise.resolve({ count: 0 }),
    courseIdList.length > 0
      ? admin.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed').in('course_id', courseIdList)
      : Promise.resolve({ count: 0 }),
    admin.from('courses').select('id, title, status, updated_at').eq('org_id', orgId).order('updated_at', { ascending: false }).limit(5),
    admin.from('courses').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'draft'),
  ])

  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  let newEnrollmentsThisWeek = 0
  let completionsThisWeek = 0
  let recentActivity: Array<{ label: string; href: string; at: string }> = []

  if (courseIdList.length > 0) {
    const [{ count: enrollWeek }, { count: completeWeek }, { data: recentEnrollments }] = await Promise.all([
      admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .in('course_id', courseIdList)
        .gte('created_at', weekStart.toISOString()),
      admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .in('course_id', courseIdList)
        .gte('updated_at', weekStart.toISOString()),
      admin
        .from('enrollments')
        .select('created_at, courses(title)')
        .in('course_id', courseIdList)
        .order('created_at', { ascending: false })
        .limit(5),
    ])
    newEnrollmentsThisWeek = enrollWeek ?? 0
    completionsThisWeek = completeWeek ?? 0
    recentActivity = (recentEnrollments ?? []).map((row) => {
      const course = row.courses as { title?: string } | null
      return {
        label: `New enrollment · ${course?.title ?? 'Course'}`,
        href: '/users',
        at: row.created_at as string,
      }
    })
  }

  for (const course of recentCourses ?? []) {
    recentActivity.push({
      label: `${course.status === 'published' ? 'Updated' : 'Edited'} · ${course.title}`,
      href: `/courses/${course.id}`,
      at: course.updated_at as string,
    })
  }
  recentActivity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  recentActivity = recentActivity.slice(0, 6)

  const avgCompletionRate =
    (totalLearners ?? 0) > 0 ? Math.round(((completions ?? 0) / (totalLearners ?? 1)) * 100) : 0

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            <Greeting
              firstName={firstName}
              context={{
                publishedCourses: publishedCourses ?? 0,
                draftCourses: draftCourses ?? 0,
                newEnrollmentsThisWeek,
                completionsThisWeek,
              }}
            />
          </h1>
          <p className="text-muted-foreground text-sm">
            Here&apos;s an overview of your Sudar Studio workspace.
          </p>
        </div>
        <Link
          href="/courses/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New course
        </Link>
      </div>

      {/* Stats — clickable to navigate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/courses" className="block transition-opacity hover:opacity-90">
          <StatCard
            label="Total courses"
            value={totalCourses ?? 0}
            icon={BookOpen}
            description={publishedCourses ? `${publishedCourses} published` : 'No courses yet'}
            accent={(totalCourses ?? 0) > 0}
          />
        </Link>
        <Link href="/courses" className="block transition-opacity hover:opacity-90">
          <StatCard
            label="Published"
            value={publishedCourses ?? 0}
            icon={Globe}
            description="Live in Learn"
          />
        </Link>
        <Link href="/users" className="block transition-opacity hover:opacity-90">
          <StatCard
            label="Learners"
            value={totalLearners ?? 0}
            icon={Users}
            description="Across all courses"
          />
        </Link>
        <Link href="/analytics" className="block transition-opacity hover:opacity-90">
          <StatCard
            label="Completions"
            value={completions ?? 0}
            icon={BarChart2}
            description="Total course completions"
          />
        </Link>
      </div>

      {/* Analytics strip */}
      {(totalCourses ?? 0) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground font-medium">Completion rate</p>
            <p className="text-2xl font-bold text-foreground mt-1">{avgCompletionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Enrollments that reached completed</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> This week
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{newEnrollmentsThisWeek}</p>
            <p className="text-xs text-muted-foreground mt-1">New enrollments</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground font-medium">Completions this week</p>
            <p className="text-2xl font-bold text-foreground mt-1">{completionsThisWeek}</p>
            <Link href="/analytics" className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 inline-block">
              Open analytics →
            </Link>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Recent activity</h2>
          </div>
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {recentActivity.map((item) => (
              <Link
                key={`${item.label}-${item.at}`}
                href={item.href}
                className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-muted/60 transition-colors text-sm"
              >
                <span className="text-card-foreground">{item.label}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(item.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA or recent courses */}
      {!recentCourses || recentCourses.length === 0 ? (
        <div className="bg-gradient-to-br from-indigo-600/10 via-card to-purple-600/10 border border-indigo-500/20 rounded-2xl p-8">
          <div className="max-w-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Create your first course</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Build a course, add modules, and publish it to Sudar Learn. Learners can
                enroll, track progress, and have every event recorded for analytics.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/courses/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create course
              </Link>
              <Link
                href="/courses"
                className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
              >
                View all courses
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Recent courses</h2>
            <Link href="/courses" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {recentCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/60 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="flex-1 text-sm font-medium text-card-foreground group-hover:text-foreground transition-colors truncate">
                  {course.title}
                </span>
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                  course.status === 'published'
                    ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                    : 'bg-muted text-muted-foreground border border-border'
                )}>
                  {course.status === 'published' ? 'Live' : 'Draft'}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-card-foreground transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
