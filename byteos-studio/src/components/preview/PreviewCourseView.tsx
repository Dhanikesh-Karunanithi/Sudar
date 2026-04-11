'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CourseModuleContent,
  type PreviewCourse,
  type PreviewModule,
} from '@/components/course/CourseModuleContent'

export type { PreviewCourse, PreviewModule }

interface Props {
  course: PreviewCourse
}

export function PreviewCourseView({ course }: Props) {
  const [activeId, setActiveId] = useState<string | null>(course.modules[0]?.id ?? null)
  const activeModule = course.modules.find((m) => m.id === activeId) ?? course.modules[0]

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside className="w-64 border-r border-slate-800 flex flex-col shrink-0 bg-slate-900">
        <div className="p-4 border-b border-slate-800">
          <Link
            href={`/courses/${course.id}`}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to edit
          </Link>
        </div>
        <div className="p-3 flex-1 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Preview</p>
          <p className="text-slate-300 font-medium text-sm truncate" title={course.title}>
            {course.title}
          </p>
          {course.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
          )}
          <nav className="mt-4 space-y-0.5">
            {course.modules.map((mod, idx) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveId(mod.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  activeId === mod.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
              >
                <span className="text-slate-600 mr-1.5">{idx + 1}.</span>
                {mod.title}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8 max-w-3xl">
        {activeModule ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">{activeModule.title}</h1>
            <CourseModuleContent module={activeModule} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <BookOpen className="w-12 h-12 opacity-50" />
            <p className="text-sm mt-3">No modules yet. Add modules in the editor.</p>
          </div>
        )}
      </main>
    </div>
  )
}
