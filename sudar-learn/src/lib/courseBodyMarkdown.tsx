'use client'

import React from 'react'
import { BookOpen, Code, Quote, Target, Sparkles, BookMarked } from 'lucide-react'
import {
  parseAdaptiveEngineMarkers,
  splitMarkdownByCodeFences,
  type AdaptiveMarkerSegment,
} from '@/lib/adaptiveEngineMarkers'

function AdaptiveMarkerCallout({
  segment,
  parseInlineBasic,
}: {
  segment: Exclude<AdaptiveMarkerSegment, { type: 'text' }>
  parseInlineBasic: (text: string) => React.ReactNode
}) {
  switch (segment.type) {
    case 'objective':
      return (
        <aside
          className="my-4 rounded-xl border border-border bg-primary/5 px-4 py-3 text-sm leading-relaxed text-card-foreground shadow-sm"
          aria-label="Learning objective"
        >
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Target className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Objective
          </div>
          <div>{parseInlineBasic(segment.value)}</div>
        </aside>
      )
    case 'apply':
      return (
        <aside
          className="my-4 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-sm leading-relaxed text-card-foreground shadow-sm"
          aria-label="Try this"
        >
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Try this
          </div>
          <div>{parseInlineBasic(segment.value)}</div>
        </aside>
      )
    case 'concept': {
      const same =
        !segment.value.trim() || segment.value.trim().toLowerCase() === segment.label.trim().toLowerCase()
      return (
        <div
          className="my-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed text-card-foreground"
          role="note"
        >
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <BookMarked className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            Key concept
          </div>
          <p className="text-card-foreground">
            <span className="font-semibold text-primary">{parseInlineBasic(segment.label)}</span>
            {!same ? (
              <span className="text-muted-foreground">
                {' '}
                — {parseInlineBasic(segment.value)}
              </span>
            ) : null}
          </p>
        </div>
      )
    }
    default:
      return null
  }
}

/**
 * Renders course module body text: markdown (subset) + adaptive engine markers as accessible callouts.
 */
export function renderCourseMarkdown(body: string, opts?: { showEmptyState?: boolean }): React.ReactNode {
  const showEmptyState = opts?.showEmptyState !== false
  if (!body?.trim()) {
    if (!showEmptyState) return null
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
        <BookOpen className="w-10 h-10 opacity-50" />
        <p className="text-sm">This module has no content yet.</p>
      </div>
    )
  }

  const chunks = splitMarkdownByCodeFences(body)

  return (
    <div className="space-y-0.5">
      {chunks.map((chunk, ci) =>
        chunk.type === 'code' ? (
          <div
            key={`code-${ci}`}
            className="my-4 rounded-xl overflow-hidden border border-border shadow-sm"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
              <Code className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono">{chunk.lang}</span>
            </div>
            <pre className="bg-card p-4 overflow-x-auto">
              <code className="text-sm text-card-foreground font-mono leading-relaxed">{chunk.value}</code>
            </pre>
          </div>
        ) : (
          <ProseWithMarkers key={`text-${ci}`} text={chunk.value} />
        )
      )}
    </div>
  )
}

const MAX_CONCEPT_CALLOUTS_PER_BLOCK = 2

function ProseWithMarkers({ text }: { text: string }) {
  const segments = parseAdaptiveEngineMarkers(text)
  let conceptCallouts = 0
  return (
    <>
      {segments.map((seg, si) => {
        if (seg.type === 'text') {
          return <MarkdownLineBlocks key={`t-${si}`} body={seg.value} />
        }
        if (seg.type === 'concept') {
          const same =
            !seg.value.trim() ||
            seg.value.trim().toLowerCase() === seg.label.trim().toLowerCase()
          if (same || seg.label.trim().length < 4) {
            return (
              <p key={`inline-c-${si}`} className="text-card-foreground text-sm leading-relaxed my-3">
                <strong className="font-semibold text-primary">{parseInlineBasic(seg.label)}</strong>
              </p>
            )
          }
          if (conceptCallouts >= MAX_CONCEPT_CALLOUTS_PER_BLOCK) {
            return (
              <p key={`inline-c2-${si}`} className="text-card-foreground text-sm leading-relaxed my-3">
                <strong className="font-semibold">{parseInlineBasic(seg.label)}</strong>
                {' — '}
                {parseInlineBasic(seg.value)}
              </p>
            )
          }
          conceptCallouts++
        }
        return (
          <AdaptiveMarkerCallout key={`m-${si}`} segment={seg} parseInlineBasic={parseInlineBasic} />
        )
      })}
    </>
  )
}

function parseInlineBasic(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = new RegExp('(\\*\\*(.+?)\\*\\*|\\*(.+?)\\*|`(.+?)`)', 'g')
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[0].startsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-card-foreground">{match[2]}</strong>)
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={match.index} className="italic text-card-foreground">{match[3]}</em>)
    } else if (match[0].startsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="bg-muted text-primary text-xs px-1.5 py-0.5 rounded font-mono border border-border"
        >
          {match[4]}
        </code>
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

function MarkdownLineBlocks({ body }: { body: string }) {
  const lines = body.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let key = 0

  function nextKey() {
    return key++
  }

  function parseInline(text: string): React.ReactNode {
    return parseInlineBasic(text)
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'code'
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <div key={nextKey()} className="my-4 rounded-xl overflow-hidden border border-border shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
            <Code className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-mono">{lang}</span>
          </div>
          <pre className="bg-card p-4 overflow-x-auto">
            <code className="text-sm text-card-foreground font-mono leading-relaxed">{codeLines.join('\n')}</code>
          </pre>
        </div>
      )
      i++
      continue
    }

    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={nextKey()} className="text-base font-semibold text-card-foreground mt-5 mb-1.5">
          {parseInline(trimmed.slice(5))}
        </h4>
      )
      i++
      continue
    }
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={nextKey()} className="text-lg font-semibold text-card-foreground mt-6 mb-2">
          {parseInline(trimmed.slice(4))}
        </h3>
      )
      i++
      continue
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={nextKey()}
          className="text-xl font-bold text-card-foreground mt-8 mb-3 pb-2 border-b border-border"
        >
          {parseInline(trimmed.slice(3))}
        </h2>
      )
      i++
      continue
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={nextKey()} className="text-2xl font-bold text-card-foreground mt-6 mb-3">
          {parseInline(trimmed.slice(2))}
        </h1>
      )
      i++
      continue
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(<hr key={nextKey()} className="my-6 border-border" />)
      i++
      continue
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2))
        i++
      }
      elements.push(
        <blockquote
          key={nextKey()}
          className="my-4 border-l-4 border-primary/30 bg-primary/10 rounded-r-lg pl-4 pr-3 py-3 flex gap-3"
        >
          <Quote className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-card-foreground italic leading-relaxed">{parseInline(quoteLines.join(' '))}</p>
        </blockquote>
      )
      continue
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items: React.ReactNode[] = []
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        const itemText = lines[i].trim().slice(2)
        const subItems: React.ReactNode[] = []
        i++
        while (i < lines.length && (lines[i].startsWith('  - ') || lines[i].startsWith('  * '))) {
          subItems.push(
            <li key={i} className="flex items-start gap-2 text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0 mt-2" />
              <span>{parseInline(lines[i].trim().slice(2))}</span>
            </li>
          )
          i++
        }
        items.push(
          <li key={i} className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/100 shrink-0 mt-2" />
            <span className="flex-1">
              {parseInline(itemText)}
              {subItems.length > 0 && <ul className="mt-1.5 ml-2 space-y-1">{subItems}</ul>}
            </span>
          </li>
        )
      }
      elements.push(
        <ul key={nextKey()} className="my-3 space-y-2 text-card-foreground text-sm leading-relaxed">
          {items}
        </ul>
      )
      continue
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: React.ReactNode[] = []
      let num = 1
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s/, '')
        items.push(
          <li key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {num}
            </span>
            <span className="flex-1 text-card-foreground">{parseInline(itemText)}</span>
          </li>
        )
        num++
        i++
      }
      elements.push(
        <ol key={nextKey()} className="my-3 space-y-2.5 text-sm leading-relaxed">
          {items}
        </ol>
      )
      continue
    }

    if (trimmed.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }
      if (tableLines.length >= 2) {
        const parseRow = (row: string) =>
          row.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
        const isSeparator = (row: string) => /^\|[-:| ]+\|$/.test(row)

        const headerRow = tableLines[0]
        const sepIdx = tableLines.findIndex(isSeparator)
        if (sepIdx === 1) {
          const headers = parseRow(headerRow)
          const bodyRows = tableLines.slice(2)
          elements.push(
            <div key={nextKey()} className="my-4 overflow-x-auto rounded-xl border border-border shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/70 border-b border-border">
                    {headers.map((h, hi) => (
                      <th
                        key={hi}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-card-foreground uppercase tracking-wide whitespace-nowrap"
                      >
                        {parseInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                      {parseRow(row).map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-4 py-2.5 text-card-foreground border-b border-border/50 leading-relaxed align-top"
                        >
                          {parseInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
          continue
        }
      }
      for (const tl of tableLines) {
        elements.push(
          <p key={nextKey()} className="text-card-foreground text-sm leading-relaxed my-3">
            {parseInline(tl)}
          </p>
        )
      }
      continue
    }

    elements.push(
      <p key={nextKey()} className="text-card-foreground text-sm leading-relaxed my-3">
        {parseInline(trimmed)}
      </p>
    )
    i++
  }

  return <div className="space-y-0.5">{elements}</div>
}
