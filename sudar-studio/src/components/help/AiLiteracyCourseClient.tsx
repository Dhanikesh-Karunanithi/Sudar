'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, ChevronRight, BookOpen } from 'lucide-react'
import type { AdminAiLiteracyLesson } from '@/lib/helpCenter/types'

type Props = {
  lessons: AdminAiLiteracyLesson[]
}

export function AiLiteracyCourseClient({ lessons }: Props) {
  const [activeId, setActiveId] = useState(lessons[0]?.id ?? '')
  const lesson = lessons.find((l) => l.id === activeId) ?? lessons[0]
  const idx = lessons.findIndex((l) => l.id === activeId)
  const progressPct =
    lessons.length > 0 ? Math.round(((idx + 1) / lessons.length) * 100) : 0

  if (!lesson || lessons.length === 0) {
    return (
      <p className="text-slate-400 text-sm">
        No lessons found. Confirm the Sudar{' '}
        <code className="text-slate-300">help-center/articles/ai-literacy</code> folder is deployed with Sudar Studio.
      </p>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm">
        <Link href="/help" className="hover:text-indigo-400">
          Sudar Help Center
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-300">Understanding AI in Sudar</span>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Understanding AI in Sudar</h1>
          <p className="text-slate-400 text-sm">
            A short course for admins—no engineering background required.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progress</span>
          <span>
            Lesson {idx + 1} of {lessons.length}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <nav className="lg:w-64 shrink-0 space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-2">Lessons</p>
          {lessons.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setActiveId(l.id)}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                l.id === activeId
                  ? 'bg-indigo-500/20 text-white border border-indigo-500/40'
                  : 'text-slate-400 hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <span className="text-slate-500 mr-2 tabular-nums">{i + 1}.</span>
              {l.title}
            </button>
          ))}
        </nav>

        <article className="flex-1 min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-white mt-0 mb-2">{lesson.title}</h2>
          <p className="text-slate-400 text-sm mb-6">{lesson.summary}</p>
          {lesson.sections.map((sec, si) => (
            <div key={si} className="mb-6 last:mb-0">
              {sec.heading ? <h3 className="text-base font-medium text-slate-200 mt-0 mb-3">{sec.heading}</h3> : null}
              {sec.paragraphs.map((p, pi) => (
                <p key={pi} className="text-slate-300 leading-relaxed mb-3 last:mb-0">
                  {p}
                </p>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap gap-3 pt-6 mt-6 border-t border-slate-800">
            {idx > 0 && (
              <button
                type="button"
                onClick={() => setActiveId(lessons[idx - 1]!.id)}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800"
              >
                Previous lesson
              </button>
            )}
            {idx < lessons.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveId(lessons[idx + 1]!.id)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
              >
                Next lesson
              </button>
            )}
            <Link
              href="/help/ai-literacy/connecting-a-private-server"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800"
            >
              Private server setup (article)
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800"
            >
              Org settings
            </Link>
            <Link
              href="/settings/keys"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800"
            >
              AI &amp; API Keys
            </Link>
          </div>
        </article>
      </div>

      <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/30 p-4 flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-500">
          Printable reference for operators: see{' '}
          <code className="text-slate-400">docs/admin/AI_LITERACY_AND_LOCAL_MODELS.md</code> in the Sudar repository.
          Lessons are synced from{' '}
          <code className="text-slate-400">help-center/articles/ai-literacy/</code>.
        </p>
      </div>
    </div>
  )
}
