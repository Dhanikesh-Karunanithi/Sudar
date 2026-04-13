'use client'

import React from 'react'
import { Code, Sparkles, Target, BookMarked } from 'lucide-react'
import {
  parseAdaptiveEngineMarkers,
  splitMarkdownByCodeFences,
  type AdaptiveMarkerSegment,
} from '@/lib/adaptiveEngineMarkers'

function StudioMarkerCallout({
  segment,
}: {
  segment: Exclude<AdaptiveMarkerSegment, { type: 'text' }>
}) {
  switch (segment.type) {
    case 'objective':
      return (
        <aside className="my-3 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 text-sm text-zinc-200">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
            <Target className="h-3.5 w-3.5" aria-hidden />
            Objective
          </div>
          <p className="text-zinc-300 leading-relaxed">{segment.value}</p>
        </aside>
      )
    case 'apply':
      return (
        <aside className="my-3 rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-2.5 text-sm text-zinc-200">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-cyan-300/90">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Try this
          </div>
          <p className="text-zinc-300 leading-relaxed">{segment.value}</p>
        </aside>
      )
    case 'concept': {
      const same =
        !segment.value.trim() || segment.value.trim().toLowerCase() === segment.label.trim().toLowerCase()
      return (
        <div
          className="my-3 rounded-lg border border-white/[0.08] bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-200"
          role="note"
        >
          <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            <BookMarked className="h-3.5 w-3.5 text-violet-400" aria-hidden />
            Key concept
          </div>
          <p>
            <span className="font-semibold text-violet-200">{segment.label}</span>
            {!same ? <span className="text-zinc-400"> — {segment.value}</span> : null}
          </p>
        </div>
      )
    }
    default:
      return null
  }
}

/** Legacy line-based markdown (subset) used in Studio before adaptive markers. */
function renderMarkdownLines(body: string): React.ReactNode {
  if (!body?.trim()) return null
  const lines = body.split('\n')
  const out: React.ReactNode[] = []
  let i = 0
  let key = 0
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (!t) {
      i++
      continue
    }
    if (t.startsWith('## ')) {
      out.push(
        <h2
          key={key++}
          className="mt-6 mb-2 border-b border-white/[0.08] pb-2 text-xl font-semibold tracking-tight text-zinc-100"
        >
          {t.slice(3)}
        </h2>
      )
      i++
      continue
    }
    if (t.startsWith('### ')) {
      out.push(
        <h3 key={key++} className="mt-4 mb-1.5 text-lg font-semibold tracking-tight text-zinc-100">
          {t.slice(4)}
        </h3>
      )
      i++
      continue
    }
    if (t.startsWith('- ') || t.startsWith('* ')) {
      const items: React.ReactNode[] = []
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(
          <li key={i} className="text-sm leading-relaxed text-zinc-400">
            {lines[i].trim().slice(2)}
          </li>
        )
        i++
      }
      out.push(
        <ul key={key++} className="my-2 list-inside list-disc space-y-1 text-zinc-400">
          {items}
        </ul>
      )
      continue
    }
    if (t.startsWith('```')) {
      const lang = t.slice(3)
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      out.push(
        <div key={key++} className="my-3 overflow-hidden rounded-xl border border-white/[0.08]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-zinc-900/80 px-3 py-1.5">
            <Code className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-mono text-xs text-zinc-500">{lang || 'code'}</span>
          </div>
          <pre className="overflow-x-auto p-3 font-mono text-sm text-zinc-300">{codeLines.join('\n')}</pre>
        </div>
      )
      i++
      continue
    }
    out.push(
      <p key={key++} className="my-2 text-sm leading-relaxed text-zinc-400">
        {t}
      </p>
    )
    i++
  }
  return <div className="space-y-0.5">{out}</div>
}

function ProseWithMarkers({ text }: { text: string }) {
  const segments = parseAdaptiveEngineMarkers(text)
  return (
    <>
      {segments.map((seg, si) =>
        seg.type === 'text' ? (
          <React.Fragment key={`t-${si}`}>{renderMarkdownLines(seg.value)}</React.Fragment>
        ) : (
          <StudioMarkerCallout key={`m-${si}`} segment={seg} />
        )
      )}
    </>
  )
}

/** Studio canvas / preview: same adaptive markers as Learn, zinc styling. */
export function renderStudioCourseMarkdown(body: string): React.ReactNode {
  if (!body?.trim()) return null
  const chunks = splitMarkdownByCodeFences(body)
  return (
    <div className="space-y-0.5">
      {chunks.map((chunk, ci) =>
        chunk.type === 'code' ? (
          <div key={`code-${ci}`} className="my-3 overflow-hidden rounded-xl border border-white/[0.08]">
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-zinc-900/80 px-3 py-1.5">
              <Code className="h-3.5 w-3.5 text-zinc-500" />
              <span className="font-mono text-xs text-zinc-500">{chunk.lang}</span>
            </div>
            <pre className="overflow-x-auto p-3 font-mono text-sm text-zinc-300">{chunk.value}</pre>
          </div>
        ) : (
          <ProseWithMarkers key={`text-${ci}`} text={chunk.value} />
        )
      )}
    </div>
  )
}
