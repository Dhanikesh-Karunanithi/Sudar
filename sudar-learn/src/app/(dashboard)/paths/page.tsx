import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Route, BookOpen, Lock, Zap, Award, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BentoCard } from '@/components/ui/BentoCard'
import { getCachedPublishedPaths } from '@/lib/cache'

interface PathCourse { course_id: string; order_index: number; is_mandatory: boolean; title: string }

export default async function LearnPathsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>
}) {
  const { q } = (await searchParams) ?? {}
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceRoleSupabaseClient()

  const [paths, { data: myEnrollments }] = await Promise.all([
    getCachedPublishedPaths(),
    admin.from('enrollments').select('path_id, status, progress_pct, personalized_sequence').eq('user_id', user!.id).not('path_id', 'is', null),
  ])

  const searchQuery = (q ?? '').trim().toLowerCase()
  const visiblePaths = (paths ?? []).filter((p) => {
    if (!searchQuery) return true
    const title = (p.title ?? '').toLowerCase()
    const description = (p.description ?? '').toLowerCase()
    const courseTitles = Array.isArray(p.courses)
      ? p.courses.map((c) => String(c.title ?? '').toLowerCase())
      : []
    return (
      title.includes(searchQuery) ||
      description.includes(searchQuery) ||
      courseTitles.some((courseTitle) => courseTitle.includes(searchQuery))
    )
  })

  const mandatory = visiblePaths.filter((p) => p.is_mandatory)
  const optional = visiblePaths.filter((p) => !p.is_mandatory)

  function EnrollmentStatus({ pathId }: { pathId: string }) {
    const e = myEnrollments?.find((en) => en.path_id === pathId)
    if (!e) return null
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className={cn('font-semibold', e.status === 'completed' ? 'text-success' : 'text-primary')}>{e.status === 'completed' ? '✓ Complete' : `${Math.round(e.progress_pct)}%`}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div className={cn('h-1.5 rounded-full', e.status === 'completed' ? 'bg-success' : 'bg-primary')} style={{ width: `${e.progress_pct}%` }} />
        </div>
      </div>
    )
  }

  function PathCard({ path }: { path: Record<string, unknown> }) {
    const courses = (path.courses as PathCourse[]) ?? []
    const mandatoryCount = courses.filter((c) => c.is_mandatory).length
    const e = myEnrollments?.find((en) => en.path_id === path.id)
    const enrolled = !!e
    const isMandatory = path.is_mandatory as boolean

    return (
      <Link href={`/paths/${path.id}`}>
        <div
          className={cn(
            'kpi-card space-y-4 transition-all hover:scale-[1.02]',
            isMandatory ? 'border-warning/50 hover:border-warning/70' : 'hover:border-primary/30'
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', isMandatory ? 'bg-warning/10 border border-warning/30' : 'bg-primary/10 border border-primary/20')}>
              <Route className={cn('w-6 h-6', isMandatory ? 'text-warning' : 'text-primary')} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg font-bold text-card-foreground line-clamp-1">{path.title as string}</h3>
              {(path.description as string) && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{path.description as string}</p>}
            </div>
            {enrolled && e.status === 'completed' && <CheckCircle2 className="w-6 h-6 text-success shrink-0" />}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-[11px] px-2.5 py-1 bg-muted text-muted-foreground rounded-pill flex items-center gap-1 font-semibold">
              <BookOpen className="w-3 h-3" />{courses.length} courses · {mandatoryCount} mandatory
            </span>
            {(path.is_adaptive as boolean) && (
              <span className="text-[11px] px-2.5 py-1 bg-primary/10 text-primary rounded-pill flex items-center gap-1 font-semibold">
                <Zap className="w-3 h-3" />Personalised
              </span>
            )}
            {isMandatory && (
              <span className="text-[11px] px-2.5 py-1 bg-warning/10 text-warning rounded-pill flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" />Required
              </span>
            )}
            {(path.issues_certificate as boolean) && (
              <span className="text-[11px] px-2.5 py-1 bg-warning/10 text-warning rounded-pill flex items-center gap-1 font-semibold">
                <Award className="w-3 h-3" />Certificate
              </span>
            )}
          </div>

          {enrolled && <EnrollmentStatus pathId={path.id as string} />}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-muted-foreground">{enrolled ? 'Continue path' : 'View path'}</span>
            <ChevronRight className="w-4 h-4 text-primary" />
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-card-foreground">Learning Paths</h1>
        <p className="text-muted-foreground text-sm mt-1">Structured programmes that guide you through multiple courses</p>
        {searchQuery && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing results for <span className="font-semibold text-card-foreground">&quot;{q}&quot;</span>
          </p>
        )}
      </div>

      {mandatory.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-warning" />
            <h2 className="text-base font-semibold text-card-foreground">Required by your organisation</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mandatory.map((p) => <PathCard key={p.id} path={p as Record<string, unknown>} />)}
          </div>
        </div>
      )}

      {optional.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-card-foreground">Available paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {optional.map((p) => <PathCard key={p.id} path={p as Record<string, unknown>} />)}
          </div>
        </div>
      )}

      {searchQuery && visiblePaths.length === 0 && (
        <BentoCard padding="lg" className="rounded-5xl py-16 text-center space-y-3">
          <Route className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No paths matched your search.</p>
          <Link href="/paths" className="text-xs font-medium text-primary hover:underline">
            Clear search
          </Link>
        </BentoCard>
      )}

      {!searchQuery && (!paths || paths.length === 0) && (
        <BentoCard padding="lg" className="rounded-5xl py-16 text-center space-y-3">
          <Route className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No learning paths published yet.</p>
        </BentoCard>
      )}
    </div>
  )
}
