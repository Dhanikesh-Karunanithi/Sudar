'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModuleTime {
  module_id: string
  module_title: string
  order_index: number
  total_secs: number
  active_secs: number
  idle_secs: number
  completed: boolean
  possible_skip: boolean
  over_time: boolean
}

interface LearnerRow {
  user_id: string
  name: string
  modules: ModuleTime[]
  any_possible_skip: boolean
  any_over_time: boolean
}

interface CourseTimeData {
  course_id: string
  course_title: string
  estimated_duration_mins: number | null
  estimated_secs_per_module: number
  skip_threshold_secs: number
  modules: { id: string; title: string; order_index: number }[]
  learners: LearnerRow[]
}

interface Course {
  id: string
  title: string
  status?: string
}

function formatSecs(secs: number): string {
  if (secs <= 0) return '—'
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export function CourseTimeSection({ courses }: { courses: Course[] }) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [data, setData] = useState<CourseTimeData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedCourseId) {
      setData(null)
      return
    }
    setLoading(true)
    fetch(`/api/analytics/course-time?course_id=${encodeURIComponent(selectedCourseId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setData(null)
        else setData(d)
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [selectedCourseId])

  const publishedCourses = courses.filter((c) => c.status === 'published')
  if (publishedCourses.length === 0) return null

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-white flex items-center gap-2">
        <Clock className="w-4 h-4 text-indigo-400" />Time per section
      </h2>
      <p className="text-xs text-slate-500">
        Track time spent per module per learner. Active time excludes when the tab is in the background. &quot;Possible skip&quot; = very low active time; &quot;Over time&quot; = much longer than estimated.
      </p>
      <div className="flex items-center gap-2">
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 max-w-xs"
        >
          <option value="">Select a course…</option>
          {publishedCourses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        {data && (
          <span className="text-xs text-slate-500">
            Est. {data.estimated_duration_mins ?? '—'} min total · {data.estimated_secs_per_module}s per section · skip if active &lt; {data.skip_threshold_secs}s
          </span>
        )}
      </div>

      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-8 text-center text-slate-500 text-sm">Loading…</div>
      )}

      {!loading && data && data.learners.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-8 text-center text-slate-500 text-sm">
          No learner activity for this course yet.
        </div>
      )}

      {!loading && data && data.learners.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium sticky left-0 bg-slate-900 z-10">Learner</th>
                {data.modules.map((m) => (
                  <th key={m.id} className="text-left px-3 py-3 text-xs text-slate-500 font-medium whitespace-nowrap" title={m.title}>
                    <span className="block truncate max-w-[100px]">{m.title}</span>
                  </th>
                ))}
                <th className="text-left px-3 py-3 text-xs text-slate-500 font-medium">Skip?</th>
                <th className="text-left px-3 py-3 text-xs text-slate-500 font-medium">Over time?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.learners.map((row) => (
                <tr key={row.user_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-200 sticky left-0 bg-slate-900/95 z-10">{row.name}</td>
                  {row.modules.map((mod) => (
                    <td key={mod.module_id} className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className={cn(
                          'text-xs font-medium',
                          mod.possible_skip ? 'text-amber-400' : 'text-slate-300'
                        )}>
                          {formatSecs(mod.active_secs)} active
                        </span>
                        {mod.total_secs > 0 && (
                          <span className="text-[10px] text-slate-600">
                            {formatSecs(mod.total_secs)} total
                            {mod.idle_secs > 0 && ` · ${formatSecs(mod.idle_secs)} idle`}
                          </span>
                        )}
                        {mod.completed && (
                          <span className="text-[10px] text-green-500/80">Done</span>
                        )}
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    {row.any_possible_skip ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded">
                        <AlertTriangle className="w-3 h-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.any_over_time ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded">
                        <Timer className="w-3 h-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
