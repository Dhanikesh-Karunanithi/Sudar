'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CourseModuleContent,
  type PreviewCourse,
  type PreviewModule,
} from '@/components/course/CourseModuleContent'
import { ScormExtractedTextEditor } from '@/components/course/ScormExtractedTextEditor'
import { ScormPackageHtmlEditor } from '@/components/course/ScormPackageHtmlEditor'
import { isScormContent } from '@/types/content'

export type { PreviewCourse, PreviewModule }

interface Props {
  course: PreviewCourse
}

export function PreviewCourseView({ course }: Props) {
  const [modules, setModules] = useState<PreviewModule[]>(course.modules)
  const [activeId, setActiveId] = useState<string | null>(course.modules[0]?.id ?? null)

  const activeModule = modules.find((m) => m.id === activeId) ?? modules[0]
  const activeScorm =
    activeModule?.content && isScormContent(activeModule.content) ? activeModule.content : null

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col bg-background text-foreground overflow-hidden">
      <div
        className="shrink-0 border-b border-amber-500/35 bg-amber-500/10 px-4 py-3 sm:px-6"
        role="region"
        aria-label="Preview mode notice"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm text-amber-100/95">
            <span className="font-semibold text-amber-50">Read-only preview</span> — this matches what learners see.
            There is no WYSIWYG here. Use the course editor to change content, images, and publish.
          </p>
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Open course editor
          </Link>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="w-64 border-r border-border flex flex-col shrink-0 bg-surface-elevated">
        <div className="p-4 border-b border-border">
          <Link
            href={`/courses/${course.id}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Course editor
          </Link>
        </div>
        <div className="p-3 flex-1 min-h-0 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Preview</p>
          <p className="text-card-foreground font-medium text-sm truncate" title={course.title}>
            {course.title}
          </p>
          {course.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
          )}
          <nav className="mt-4 space-y-0.5">
            {modules.map((mod, idx) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveId(mod.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border border-transparent',
                  activeId === mod.id
                    ? 'bg-primary/15 text-primary border-primary/35'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                {mod.title}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto p-8 max-w-3xl">
        {activeModule ? (
          <>
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">{activeModule.title}</h1>
            <CourseModuleContent module={activeModule} />
            {activeScorm ? (
              <>
                <ScormExtractedTextEditor
                  courseId={course.id}
                  moduleId={activeModule.id}
                  content={activeScorm}
                  onSaved={(next) => {
                    setModules((prev) =>
                      prev.map((m) => (m.id === activeModule.id ? { ...m, content: next } : m))
                    )
                  }}
                />
                <ScormPackageHtmlEditor courseId={course.id} moduleId={activeModule.id} />
              </>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 opacity-50" />
            <p className="text-sm mt-3">No modules yet. Add modules in the editor.</p>
          </div>
        )}
      </main>
      </div>
    </div>
  )
}
