'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  BookOpen, Clock, Search, X, LayoutGrid, List,
  CheckCircle2, PlayCircle, Sparkles, ChevronRight,
  GraduationCap, Filter,
} from 'lucide-react'

/* ── Types ──────────────────────────────────────────────────────────────── */

interface Course {
  id: string
  title: string
  description: string | null
  difficulty: string | null
  tags: string[] | null
  estimated_duration_mins: number | null
  published_at: string | null
}

interface Enrollment {
  course_id: string
  status: string
  progress_pct: number
}

interface Props {
  courses: Course[]
  enrollments: Enrollment[]
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

  return (
    <Link href={`/courses/${course.id}`} className="group block h-full">
      <div className="h-full bg-card rounded-card-lg border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
        {/* Accent strip */}
        <div className={`h-1 w-full bg-gradient-to-r ${diff?.strip ?? 'from-primary/40 to-primary/10'}`} />

        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
              <BookOpen className="w-4.5 h-4.5 text-primary" style={{ width: '1.125rem', height: '1.125rem' }} />
            </div>
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
      <div className="bg-card rounded-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden flex items-center gap-4 px-4 py-3">
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

export default function CourseCatalogClient({ courses, enrollments }: Props) {
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState<typeof DIFFICULTY_FILTERS[number]>('all')
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]['id']>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const enrollmentMap = useMemo(
    () => new Map(enrollments.map((e) => [e.course_id, e])),
    [enrollments]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return courses.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q) && !c.description?.toLowerCase().includes(q) && !c.tags?.some((t) => t.toLowerCase().includes(q))) return false
      if (diffFilter !== 'all' && c.difficulty !== diffFilter) return false
      const enrollment = enrollmentMap.get(c.id)
      if (statusFilter === 'enrolled' && (!enrollment || enrollment.status === 'completed')) return false
      if (statusFilter === 'completed' && enrollment?.status !== 'completed') return false
      if (statusFilter === 'new' && enrollment) return false
      return true
    })
  }, [courses, search, diffFilter, statusFilter, enrollmentMap])

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
              {courses.length} course{courses.length !== 1 ? 's' : ''} available
              {enrolledCount > 0 && (
                <> · <span className="text-primary font-medium">{enrolledCount} in progress</span></>
              )}
              {completedCount > 0 && (
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
          <div className="w-px h-4 bg-border" />
          {/* Status */}
          {STATUS_FILTERS.map((s) => (
            <FilterPill key={s.id} active={statusFilter === s.id} onClick={() => setStatusFilter(s.id)}>
              {s.label}
            </FilterPill>
          ))}
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
            <p className="text-sm font-semibold text-card-foreground">No courses match your filters</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
          </div>
          <button
            onClick={() => { setSearch(''); setDiffFilter('all'); setStatusFilter('all') }}
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
