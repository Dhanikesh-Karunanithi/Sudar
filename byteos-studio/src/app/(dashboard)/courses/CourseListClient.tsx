'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, BookOpen, Clock, Globe, FileText, Search, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusConfig = {
  draft: { label: 'Draft', class: 'bg-slate-700 text-slate-300' },
  published: { label: 'Published', class: 'bg-green-500/15 text-green-400 border border-green-500/20' },
  archived: { label: 'Archived', class: 'bg-slate-800 text-slate-500' },
}

const difficultyConfig: Record<string, string> = {
  beginner: 'text-emerald-400',
  intermediate: 'text-amber-400',
  advanced: 'text-red-400',
}

type SortKey = 'updated_at' | 'title' | 'status'

interface CourseRow {
  id: string
  title: string
  description: string | null
  status: string
  difficulty: string | null
  estimated_duration_mins: number | null
  updated_at: string
}

export function CourseListClient({ courses: initialCourses }: { courses: CourseRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortKey>('updated_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const filteredAndSorted = useMemo(() => {
    let list = [...initialCourses]
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter)
    }
    list.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'updated_at') cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      else if (sortBy === 'title') cmp = a.title.localeCompare(b.title)
      else if (sortBy === 'status') cmp = (a.status || '').localeCompare(b.status || '')
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [initialCourses, search, statusFilter, sortBy, sortAsc])

  async function handleDelete(courseId: string) {
    setDeletingId(courseId)
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' })
      if (res.ok) {
        setConfirmDeleteId(null)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Could not delete course')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search, filter, sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-sm">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="updated_at">Date updated</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
          <button
            type="button"
            onClick={() => setSortAsc((a) => !a)}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-sm"
            title={sortAsc ? 'Ascending' : 'Descending'}
          >
            {sortAsc ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Course grid */}
      {filteredAndSorted.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          {initialCourses.length === 0 ? 'No courses yet.' : 'No courses match your search or filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((course) => {
            const status = statusConfig[course.status as keyof typeof statusConfig] ?? statusConfig.draft
            const diffClass = difficultyConfig[course.difficulty ?? ''] ?? 'text-slate-400'
            const isDeleting = deletingId === course.id
            const showConfirm = confirmDeleteId === course.id

            return (
              <div
                key={course.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group relative"
              >
                {showConfirm ? (
                  <div className="absolute inset-0 bg-slate-900/95 rounded-xl p-4 flex flex-col items-center justify-center gap-3 z-10">
                    <p className="text-sm text-slate-300 text-center">Delete this course? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(course.id)}
                        disabled={isDeleting}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-1.5"
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/courses/${course.id}`}
                    className="flex-1 min-w-0 flex items-start gap-3 space-y-4 group/link"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <span className={cn('text-xs font-medium px-2 py-1 rounded-full shrink-0', status.class)}>
                        {status.label}
                      </span>
                      <h3 className="text-white font-medium text-sm leading-snug group-hover/link:text-indigo-300 transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>
                      )}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setConfirmDeleteId(course.id) }}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors shrink-0"
                    aria-label="Delete course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Link href={`/courses/${course.id}`} className="block mt-3">
                  <div className="flex items-center gap-3 pt-1">
                    {course.difficulty && (
                      <span className={cn('text-xs font-medium capitalize', diffClass)}>
                        {course.difficulty}
                      </span>
                    )}
                    {course.estimated_duration_mins != null && (
                      <span className="flex items-center gap-1 text-slate-500 text-xs">
                        <Clock className="w-3 h-3" />
                        {course.estimated_duration_mins}m
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-600 text-xs ml-auto">
                      {course.status === 'published' ? (
                        <Globe className="w-3 h-3" />
                      ) : (
                        <FileText className="w-3 h-3" />
                      )}
                      {new Date(course.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
