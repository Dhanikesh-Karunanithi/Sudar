'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Route,
  Plus,
  BookOpen,
  Lock,
  Zap,
  CheckCircle2,
  Award,
  Trash2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PathCourse {
  course_id: string
  order_index: number
  is_mandatory: boolean
  title: string
}

interface PathRow {
  id: string
  title: string
  description: string | null
  status?: string
  is_adaptive?: boolean
  is_mandatory?: boolean
  issues_certificate?: boolean
  courses?: PathCourse[]
}

export function PathListClient({
  paths,
  enrollmentsByPath,
}: {
  paths: PathRow[]
  enrollmentsByPath: Record<string, Array<{ status: string }>>
}) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function handleDelete(pathId: string) {
    setDeletingId(pathId)
    try {
      const res = await fetch(`/api/paths/${pathId}`, { method: 'DELETE' })
      if (res.ok) {
        setConfirmDeleteId(null)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Could not delete path')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {paths.map((path) => {
        const courses = path.courses ?? []
        const mandatoryCount = courses.filter((c) => c.is_mandatory).length
        const pe = enrollmentsByPath[path.id] ?? []
        const completedCount = pe.filter((e) => e.status === 'completed').length
        const isDeleting = deletingId === path.id
        const showConfirm = confirmDeleteId === path.id

        return (
          <div
            key={path.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-6 space-y-4 transition-all group relative"
          >
            {showConfirm ? (
              <div className="absolute inset-0 bg-slate-900/95 rounded-xl p-4 flex flex-col items-center justify-center gap-3 z-10">
                <p className="text-sm text-slate-300 text-center">Delete this learning path? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(path.id)}
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

            <div className="flex items-start gap-3">
              <Link href={`/paths/${path.id}`} className="flex-1 min-w-0 flex items-start gap-3 group/link">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Route className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm group-hover/link:text-indigo-300 transition-colors line-clamp-1">
                    {path.title}
                  </h3>
                  {path.description && (
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{path.description}</p>
                  )}
                </div>
              </Link>
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0',
                  path.status === 'published'
                    ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                    : 'bg-slate-700 text-slate-400'
                )}
              >
                {path.status ?? 'draft'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setConfirmDeleteId(path.id)
                }}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors shrink-0"
                aria-label="Delete path"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {courses.length} courses
              </span>
              {mandatoryCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {mandatoryCount} mandatory
                </span>
              )}
              {path.is_adaptive && (
                <span className="text-[11px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Adaptive
                </span>
              )}
              {path.issues_certificate && (
                <span className="text-[11px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Certificate
                </span>
              )}
            </div>

            {pe.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                {completedCount}/{pe.length} learners completed
              </div>
            )}

            <Link
              href={`/paths/${path.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Edit path <span aria-hidden>→</span>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
