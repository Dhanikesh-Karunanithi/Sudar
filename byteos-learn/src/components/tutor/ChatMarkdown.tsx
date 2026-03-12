'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Inline parser — **bold**, *italic*, `code`
// ---------------------------------------------------------------------------
function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[0].startsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>)
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={match.index} className="italic opacity-90">{match[3]}</em>)
    } else {
      parts.push(
        <code key={match.index} className="bg-primary/15 text-primary text-[10px] px-1 py-0.5 rounded font-mono border border-primary/20">
          {match[4]}
        </code>
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 0 ? null : parts.length === 1 ? parts[0] : <>{parts}</>
}

// ---------------------------------------------------------------------------
// Table — styled card with colored header + striped rows
// ---------------------------------------------------------------------------
function StyledTable({ headers, bodyRows }: { headers: string[]; bodyRows: string[][] }) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const parseRow = (row: string) =>
    row.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-border shadow-sm">
      <table className="w-full text-[0.72rem] border-collapse">
        <thead>
          <tr className="bg-primary/90">
            {headers.map((h, hi) => (
              <th
                key={hi}
                className="px-3 py-2 text-left font-semibold text-white whitespace-nowrap text-[0.7rem] uppercase tracking-wide"
              >
                {parseInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((rawRow, ri) => {
            const cells = parseRow(rawRow)
            const isHovered = hoveredRow === ri
            return (
              <tr
                key={ri}
                onMouseEnter={() => setHoveredRow(ri)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`border-t border-border/50 transition-colors cursor-default ${
                  isHovered ? 'bg-primary/5' : ri % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                }`}
              >
                {cells.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-3 py-2 align-top leading-relaxed ${
                      ci === 0 ? 'font-semibold text-primary text-[0.72rem]' : 'text-card-foreground/90'
                    }`}
                  >
                    {parseInline(cell)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Callout — detected by "Note:", "Tip:", "Remember:", "> " prefix
// ---------------------------------------------------------------------------
const CALLOUT_PATTERNS: { prefix: RegExp; emoji: string; color: string }[] = [
  { prefix: /^(>|\u203a)\s+/, emoji: '💬', color: 'border-primary/40 bg-primary/5 text-primary/80' },
  { prefix: /^(note|📝):\s*/i, emoji: '📝', color: 'border-blue-400/40 bg-blue-500/5 text-blue-600' },
  { prefix: /^(tip|💡):\s*/i, emoji: '💡', color: 'border-amber-400/40 bg-amber-500/5 text-amber-700' },
  { prefix: /^(remember|🔖):\s*/i, emoji: '🔖', color: 'border-violet-400/40 bg-violet-500/5 text-violet-700' },
  { prefix: /^(warning|⚠️):\s*/i, emoji: '⚠️', color: 'border-red-400/40 bg-red-500/5 text-red-700' },
]

function detectCallout(trimmed: string) {
  for (const p of CALLOUT_PATTERNS) {
    if (p.prefix.test(trimmed)) {
      return { text: trimmed.replace(p.prefix, ''), emoji: p.emoji, color: p.color }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Collapsible section — Apple-style disclosure (soft, rounded, chevron)
// ---------------------------------------------------------------------------
function CollapsibleSection({
  title,
  level,
  children,
}: {
  title: React.ReactNode
  level: 1 | 2 | 3 | 4
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)

  const headerClasses: Record<number, string> = {
    1: 'text-[0.88rem] font-bold text-card-foreground',
    2: 'text-[0.84rem] font-bold text-card-foreground',
    3: 'text-[0.8rem] font-semibold text-card-foreground',
    4: 'text-[0.76rem] font-semibold text-muted-foreground',
  }

  return (
    <div className={`mt-3 mb-1 ${level <= 2 ? 'rounded-2xl overflow-hidden bg-muted/30' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 text-left transition-colors duration-150 ${
          level <= 2
            ? 'px-4 py-2.5 hover:bg-muted/50 active:bg-muted/70'
            : 'py-1 pr-1 hover:opacity-90'
        }`}
      >
        <span className={`flex items-center gap-2 ${headerClasses[level]}`}>
          {level <= 2 && (
            <span className="w-1 h-1 rounded-full bg-primary/60 shrink-0" />
          )}
          {title}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 shrink-0 text-muted-foreground/80 transition-transform duration-200 ease-out',
            open && 'rotate-180'
          )}
          strokeWidth={2.25}
          aria-hidden
        />
      </button>
      {open && (
        <div className={level <= 2 ? 'px-4 pb-3 pt-0.5' : 'pl-4 border-l border-muted-foreground/20 mt-1 ml-1'}>
          {children}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ChatMarkdown component
// ---------------------------------------------------------------------------

interface Props {
  text: string
  className?: string
}

type Block =
  | { kind: 'h1' | 'h2' | 'h3' | 'h4'; text: string }
  | { kind: 'hr' }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'table'; headers: string[]; bodyRows: string[] }
  | { kind: 'callout'; text: string; emoji: string; color: string }
  | { kind: 'p'; text: string }

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()

    if (!t) { i++; continue }

    // Headings
    if (t.startsWith('#### ')) { blocks.push({ kind: 'h4', text: t.slice(5) }); i++; continue }
    if (t.startsWith('### ')) { blocks.push({ kind: 'h3', text: t.slice(4) }); i++; continue }
    if (t.startsWith('## ')) { blocks.push({ kind: 'h2', text: t.slice(3) }); i++; continue }
    if (t.startsWith('# ')) { blocks.push({ kind: 'h1', text: t.slice(2) }); i++; continue }

    // Horizontal rule
    if (/^[-_*]{3,}$/.test(t)) { blocks.push({ kind: 'hr' }); i++; continue }

    // Unordered list
    if (t.startsWith('- ') || t.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(lines[i].trim().slice(2))
        i++
      }
      blocks.push({ kind: 'ul', items })
      continue
    }

    // Ordered list
    if (/^\d+[.)]\s/.test(t)) {
      const items: string[] = []
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s/, ''))
        i++
      }
      blocks.push({ kind: 'ol', items })
      continue
    }

    // Table
    if (t.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }
      const parseRow = (row: string) => row.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
      const isSep = (row: string) => /^\|[-:| ]+\|$/.test(row)
      if (tableLines.length >= 2 && isSep(tableLines[1])) {
        blocks.push({ kind: 'table', headers: parseRow(tableLines[0]), bodyRows: tableLines.slice(2) })
      } else {
        for (const tl of tableLines) blocks.push({ kind: 'p', text: tl })
      }
      continue
    }

    // Callout
    const callout = detectCallout(t)
    if (callout) {
      blocks.push({ kind: 'callout', ...callout })
      i++; continue
    }

    // Paragraph
    blocks.push({ kind: 'p', text: t })
    i++
  }

  return blocks
}

// Group blocks under their nearest heading for collapsible sections
type Section = {
  heading?: Block & { kind: 'h1' | 'h2' | 'h3' | 'h4' }
  children: Block[]
}

function groupIntoSections(blocks: Block[]): Section[] {
  const sections: Section[] = []
  let current: Section = { children: [] }

  for (const block of blocks) {
    if (block.kind === 'h1' || block.kind === 'h2' || block.kind === 'h3' || block.kind === 'h4') {
      if (current.heading || current.children.length > 0) sections.push(current)
      current = { heading: block as Section['heading'], children: [] }
    } else {
      current.children.push(block)
    }
  }
  if (current.heading || current.children.length > 0) sections.push(current)
  return sections
}

function renderBlock(block: Block, key: number): React.ReactNode {
  switch (block.kind) {
    case 'hr':
      return (
        <div key={key} className="my-2 flex items-center gap-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      )

    case 'ul':
      return (
        <ul key={key} className="space-y-1 my-1.5">
          {block.items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2 text-[0.75rem] leading-relaxed text-card-foreground/90">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0 mt-[0.42rem]" />
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol key={key} className="space-y-1.5 my-1.5">
          {block.items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2 text-[0.75rem] leading-relaxed text-card-foreground/90">
              <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 mt-px border border-primary/20">
                {ii + 1}
              </span>
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      )

    case 'table':
      return <StyledTable key={key} headers={block.headers} bodyRows={block.bodyRows} />

    case 'callout':
      return (
        <div key={key} className={`my-2 flex items-start gap-2 px-3 py-2 rounded-lg border-l-2 text-[0.74rem] leading-relaxed ${block.color}`}>
          <span className="shrink-0">{block.emoji}</span>
          <span>{parseInline(block.text)}</span>
        </div>
      )

    case 'p':
      return (
        <p key={key} className="text-[0.75rem] leading-relaxed text-card-foreground/90 my-0.5">
          {parseInline(block.text)}
        </p>
      )

    default:
      return null
  }
}

export function ChatMarkdown({ text, className }: Props) {
  if (!text?.trim()) return null

  const blocks = parseBlocks(text.split('\n'))
  const sections = groupIntoSections(blocks)

  // Decide whether to use collapsible sections: only when there are 2+ headings
  const headingCount = sections.filter((s) => s.heading).length
  const useCollapsible = headingCount >= 2

  let key = 0

  const rendered = sections.map((section) => {
    const sectionKey = key++

    const childNodes = section.children.map((b) => renderBlock(b, key++))

    if (!section.heading) {
      return <React.Fragment key={sectionKey}>{childNodes}</React.Fragment>
    }

    const level = Number(section.heading.kind.slice(1)) as 1 | 2 | 3 | 4
    const titleNode = parseInline(section.heading.text)

    if (!useCollapsible || level >= 4) {
      // Non-collapsible: render heading + children directly
      const headingEl =
        level <= 2 ? (
          <div key={`h-${sectionKey}`} className="flex items-center gap-1.5 mt-3 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className={`${level === 1 ? 'text-[0.88rem]' : 'text-[0.82rem]'} font-bold text-card-foreground`}>
              {titleNode}
            </span>
          </div>
        ) : (
          <p key={`h-${sectionKey}`} className="text-[0.78rem] font-semibold text-card-foreground/80 mt-2 mb-0.5">
            {titleNode}
          </p>
        )

      return (
        <React.Fragment key={sectionKey}>
          {headingEl}
          {childNodes}
        </React.Fragment>
      )
    }

    return (
      <CollapsibleSection key={sectionKey} title={titleNode} level={level}>
        {childNodes}
      </CollapsibleSection>
    )
  })

  return (
    <div className={`space-y-0.5 text-[inherit] ${className ?? ''}`}>
      {rendered}
    </div>
  )
}
