'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import {
  BookOpen, Clock, Search, X, LayoutGrid, List,
  CheckCircle2, PlayCircle, Sparkles, ChevronRight,
  GraduationCap, Filter, Globe,
} from 'lucide-react'
import { EXTERNAL_PROVIDERS, type ExternalProviderId } from '@/lib/courses/externalProviders'
import { ExternalCourseLabel } from '@/components/courses/ExternalCourseLabel'
import { SudarCourseThumbnailArt } from '@/components/branding/SudarCourseDefaultArt'
import { CourseArtPatternSelect } from '@/components/branding/CourseArtPatternSelect'

/* ── Types ──────────────────────────────────────────────────────────────── */

interface Course {
  id: string
  title: string
  description: string | null
  difficulty: string | null
  tags: string[] | null
  estimated_duration_mins: number | null
  published_at: string | null
  thumbnail_url?: string | null
  banner_url?: string | null
  module_count?: number
  is_external?: boolean
  external_provider?: string | null
}

interface Enrollment {
  course_id: string
  status: string
  progress_pct: number
}

type CatalogTab = 'org' | 'discover'

interface Props {
  courses: Course[]
  enrollments: Enrollment[]
  initialSearch?: string
  initialTab?: CatalogTab
}

/* ── Config ─────────────────────────────────────────────────────────────── */

const DIFFICULTY = {
  beginner:     { label: 'Beginner',     dot: 'bg-success',     text: 'text-success',     bg: 'bg-success/10 border-success/30',     strip: 'from-success/40 to-success/10' },
  intermediate: { label: 'Intermediate', dot: 'bg-warning',     text: 'text-warning',     bg: 'bg-warning/10 border-warning/30',     strip: 'from-warning/40 to-warning/10' },
  advanced:     { label: 'Advanced',     dot: 'bg-destructive', text: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', strip: 'from-destructive/40 to-destructive/10' },
} as const

const STATUS_FILTERS = [
  { id: 'all',         label: 'All courses' },
  { id: 'enrolled',    label: 'In progress' },
  { id: 'completed',   label: 'Completed' },
  { id: 'new',         label: 'Not started' },
] as const

const DIFFICULTY_FILTERS = ['all', 'beginner', 'intermediate', 'advanced'] as const

function formatDuration(mins: number) {
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`
  return `${mins}m`
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-pill text-xs font-semibold border transition-all duration-200 whitespace-nowrap',
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-card-foreground',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function CourseCardGrid({ course, enrollment }: { course: Course; enrollment?: Enrollment }) {
  const diff = DIFFICULTY[course.difficulty as keyof typeof DIFFICULTY]
  const isCompleted = enrollment?.status === 'completed'
  const inProgress = enrollment && !isCompleted
  const tags = course.tags?.slice(0, 3) ?? []
  const openCourse = course.is_external

  return (
    <Link href={`/courses/${course.id}`} className="group block h-full">
      <div
        className={[
          'h-full bg-card rounded-card-lg border hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col',
          openCourse
            ? 'border-dashed border-amber-500/45 hover:border-amber-500/60'
            : 'border-border hover:border-primary/30',
        ].join(' ')}
      >
        {/* Accent strip */}
        <div className={`h-1 w-full bg-gradient-to-r ${diff?.strip ?? 'from-primary/40 to-primary/10'}`} />

        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt=""
              fill
              className="object-cover"
              unoptimized
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <SudarCourseThumbnailArt
              courseId={course.id}
              title={course.title}
              difficulty={course.difficulty}
              estimatedDurationMins={course.estimated_duration_mins}
              moduleCount={course.module_count ?? null}
            />
          )}
        </div>

        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
              <BookOpen className="h-[1.125rem] w-[1.125rem] text-primary" />
            </div>
            <div className="flex flex-col items-end gap-1">
              {openCourse && (
                <ExternalCourseLabel provider={course.external_provider} />
              )}
              {isCompleted ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success/10 border border-success/30 px-2 py-0.5 rounded-pill">
                  <CheckCircle2 className="w-3 h-3" /> Done
                </span>
              ) : inProgress ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-pill">
                  <PlayCircle className="w-3 h-3" /> {Math.round(enrollment.progress_pct)}%
                </span>
              ) : null}
            </div>
          </div>

          {/* Title + description */}
          <div className="flex-1">
            <h3 className="font-display font-bold text-sm text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1.5">
              {course.title}
            </h3>
            {course.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {course.description}
              </p>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-pill">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-2.5">
              {diff && (
                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${diff.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                  {diff.label}
                </span>
              )}
              {course.estimated_duration_mins != null && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                  <Clock className="w-3 h-3" />
                  {formatDuration(course.estimated_duration_mins)}
                </span>
              )}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-200" />
          </div>

          {/* Progress bar */}
          {inProgress && (
            <div className="w-full bg-muted rounded-full h-1">
              <div
                className="bg-primary h-1 rounded-full transition-all"
                style={{ width: `${enrollment.progress_pct}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function CourseCardList({ course, enrollment }: { course: Course; enrollment?: Enrollment }) {
  const diff = DIFFICULTY[course.difficulty as keyof typeof DIFFICULTY]
  const isCompleted = enrollment?.status === 'completed'
  const inProgress = enrollment && !isCompleted
  const tags = course.tags?.slice(0, 4) ?? []

  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <div
        className={[
          'bg-card rounded-card border hover:shadow-md transition-all duration-200 overflow-hidden flex items-center gap-4 px-4 py-3',
          course.is_external
            ? 'border-dashed border-amber-500/45 hover:border-amber-500/55'
            : 'border-border hover:border-primary/30',
        ].join(' ')}
      >
        {/* Left accent bar */}
        <div className={`w-1 self-stretch rounded-full bg-gradient-to-b ${diff?.strip ?? 'from-primary/40 to-primary/10'} flex-shrink-0`} />

        {/* Icon */}
        <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-display font-bold text-sm text-card-foreground group-hover:text-primary transition-colors truncate">
              {course.title}
            </h3>
            {course.is_external && (
              <ExternalCourseLabel provider={course.external_provider} className="hidden sm:inline-flex" />
            )}
            {isCompleted && (
              <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
            )}
          </div>
          {course.description && (
            <p className="text-xs text-muted-foreground truncate">{course.description}</p>
          )}
          {inProgress && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 max-w-[120px] bg-muted rounded-full h-1">
                <div className="bg-primary h-1 rounded-full" style={{ width: `${enrollment.progress_pct}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-primary">{Math.round(enrollment.progress_pct)}%</span>
            </div>
          )}
        </div>

        {/* Right metadata */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {tags.length > 0 && (
            <div className="hidden md:flex flex-wrap gap-1 justify-end max-w-[160px]">
              {tags.map((tag) => (
                <span key={tag} className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-pill">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {diff && (
            <span className={`hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${diff.text} whitespace-nowrap`}>
              <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
              {diff.label}
            </span>
          )}
          {course.estimated_duration_mins != null && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium whitespace-nowrap">
              <Clock className="w-3 h-3" />
              {formatDuration(course.estimated_duration_mins)}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  )
}

/* ── Main component ─────────────────────────────────────────────────────── */

export default function CourseCatalogClient({
  courses,
  enrollments,
  initialSearch = '',
  initialTab = 'org',
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)
  const [catalogTab, setCatalogTab] = useState<CatalogTab>(initialTab)
  const [diffFilter, setDiffFilter] = useState<typeof DIFFICULTY_FILTERS[number]>('all')
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]['id']>('all')
  const [providerFilter, setProviderFilter] = useState<'all' | ExternalProviderId>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    setCatalogTab(initialTab)
  }, [initialTab])

  const setTab = useCallback(
    (tab: CatalogTab) => {
      setCatalogTab(tab)
      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'discover') params.set('tab', 'discover')
      else params.delete('tab')
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const enrollmentMap = useMemo(
    () => new Map(enrollments.map((e) => [e.course_id, e])),
    [enrollments]
  )

  const orgCourses = useMemo(() => courses.filter((c) => !c.is_external), [courses])
  const discoverCourses = useMemo(() => courses.filter((c) => c.is_external), [courses])

  const tabCourses = catalogTab === 'discover' ? discoverCourses : orgCourses

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return tabCourses.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q) && !c.description?.toLowerCase().includes(q) && !c.tags?.some((t) => t.toLowerCase().includes(q))) return false
      if (catalogTab === 'org') {
        if (diffFilter !== 'all' && c.difficulty !== diffFilter) return false
        const enrollment = enrollmentMap.get(c.id)
        if (statusFilter === 'enrolled' && (!enrollment || enrollment.status === 'completed')) return false
        if (statusFilter === 'completed' && enrollment?.status !== 'completed') return false
        if (statusFilter === 'new' && enrollment) return false
      }
      if (catalogTab === 'discover' && providerFilter !== 'all' && c.external_provider !== providerFilter) {
        return false
      }
      if (catalogTab === 'discover' && diffFilter !== 'all' && c.difficulty !== diffFilter) return false
      return true
    })
  }, [tabCourses, search, diffFilter, statusFilter, enrollmentMap, catalogTab, providerFilter])

  const clearSearch = useCallback(() => setSearch(''), [])

  const enrolledCount = enrollments.filter((e) => e.status !== 'completed').length
  const completedCount = enrollments.filter((e) => e.status === 'completed').length

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-card-foreground">Course Catalog</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {catalogTab === 'discover'
                ? `${discoverCourses.length} open course${discoverCourses.length !== 1 ? 's' : ''} from external providers`
                : `${orgCourses.length} organisation course${orgCourses.length !== 1 ? 's' : ''}`}
              {catalogTab === 'org' && enrolledCount > 0 && (
                <> · <span className="text-primary font-medium">{enrolledCount} in progress</span></>
              )}
              {catalogTab === 'org' && completedCount > 0 && (
                <> · <span className="text-success font-medium">{completedCount} completed</span></>
              )}
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-button p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-md transition-all ${view === 'grid' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-card-foreground'}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-card-foreground'}`}
              aria-label="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <CourseArtPatternSelect
          compact
          id="catalog-course-art-pattern"
          className="rounded-lg border border-border/80 bg-muted/25 px-3 py-2.5"
        />
      </div>

      {/* ── Catalog tabs ── */}
      <div className="flex flex-col gap-3">
        <div className="flex p-1 bg-muted rounded-button gap-1" role="tablist" aria-label="Course catalog sections">
          <button
            type="button"
            role="tab"
            aria-selected={catalogTab === 'org'}
            onClick={() => setTab('org')}
            className={[
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all',
              catalogTab === 'org'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-card-foreground',
            ].join(' ')}
          >
            <BookOpen className="w-4 h-4" />
            Organisation
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={catalogTab === 'discover'}
            onClick={() => setTab('discover')}
            className={[
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all',
              catalogTab === 'discover'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-card-foreground',
            ].join(' ')}
          >
            <Globe className="w-4 h-4" />
            Open courses
            {discoverCourses.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-pill bg-amber-500/20 text-amber-800 dark:text-amber-200">
                {discoverCourses.length}
              </span>
            )}
          </button>
        </div>

        {catalogTab === 'discover' && (
          <div className="rounded-lg border border-dashed border-amber-500/35 bg-amber-500/5 px-4 py-3">
            <p className="text-sm text-card-foreground font-medium">Discover free courses from trusted providers</p>
            <p className="text-xs text-muted-foreground mt-1">
              External courses are clearly labelled and play inside Sudar when embedding is supported. Your progress
              is tracked when you mark complete.
            </p>
          </div>
        )}

        {catalogTab === 'discover' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setProviderFilter('all')}
              className={[
                'text-left rounded-lg border px-3 py-2.5 transition-all',
                providerFilter === 'all'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/30',
              ].join(' ')}
            >
              <p className="text-xs font-bold text-card-foreground">All providers</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{discoverCourses.length} courses</p>
            </button>
            {EXTERNAL_PROVIDERS.map((p) => {
              const count = discoverCourses.filter((c) => c.external_provider === p.id).length
              if (count === 0) return null
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProviderFilter(p.id)}
                  className={[
                    'text-left rounded-lg border px-3 py-2.5 transition-all',
                    providerFilter === p.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/30',
                  ].join(' ')}
                >
                  <p className={`text-xs font-bold ${p.accentClass.split(' ').find((c) => c.startsWith('text-')) ?? 'text-card-foreground'}`}>
                    {p.shortLabel}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground mt-1">{count} course{count !== 1 ? 's' : ''}</p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Search + Filters ── */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search courses, topics, or tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-9 rounded-button bg-card border border-border text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
          />
          {search && (
            <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Filter className="w-3 h-3" /> Filter
          </span>
          <div className="w-px h-4 bg-border" />
          {/* Difficulty */}
          {DIFFICULTY_FILTERS.map((d) => (
            <FilterPill key={d} active={diffFilter === d} onClick={() => setDiffFilter(d)}>
              {d === 'all' ? 'All levels' : DIFFICULTY[d as keyof typeof DIFFICULTY]?.label ?? d}
            </FilterPill>
          ))}
          {catalogTab === 'org' && (
            <>
              <div className="w-px h-4 bg-border" />
              {STATUS_FILTERS.map((s) => (
                <FilterPill key={s.id} active={statusFilter === s.id} onClick={() => setStatusFilter(s.id)}>
                  {s.label}
                </FilterPill>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <h2 className="sr-only">Course list</h2>
      {filtered.length === 0 ? (
        <div className="bg-card rounded-card-lg border border-border p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">
              {catalogTab === 'discover' ? 'No open courses match your filters' : 'No courses match your filters'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
          </div>
          <button
            onClick={() => {
              setSearch('')
              setDiffFilter('all')
              setStatusFilter('all')
              setProviderFilter('all')
            }}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((course) => (
            <CourseCardGrid key={course.id} course={course} enrollment={enrollmentMap.get(course.id)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((course) => (
            <CourseCardList key={course.id} course={course} enrollment={enrollmentMap.get(course.id)} />
          ))}
        </div>
      )}

      {/* ── My enrollments summary ── */}
      {enrollments.length > 0 && (
        <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground border-t border-border">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>
            You are enrolled in <span className="font-semibold text-card-foreground">{enrollments.length}</span> course{enrollments.length !== 1 ? 's' : ''} ·{' '}
            <span className="text-success font-semibold">{completedCount}</span> completed
          </span>
        </div>
      )}
    </div>
  )
}
