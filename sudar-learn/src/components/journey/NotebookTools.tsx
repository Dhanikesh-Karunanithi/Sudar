'use client'

import { useMemo, useState } from 'react'
import type { NotebookPage } from '@/types/journeyNotebook'
import type { TutorBlock } from '@/types/tutor'
import { acceptedNotebookPages } from '@/lib/journey/notebookStorage'
import { cn } from '@/lib/utils'

function pageTitle(page: NotebookPage): string {
  if (page.source === 'note') {
    const t = (page.noteText ?? '').trim()
    return t ? t.slice(0, 60) : 'Your note'
  }
  const b = page.blocks?.[0]
  if (!b) return 'Page'
  if (b.type === 'lesson_html' && typeof b.payload.title === 'string') return b.payload.title
  if (b.type === 'concept_card' && typeof b.payload.title === 'string') return b.payload.title
  if (b.type === 'video_embed' && typeof b.payload.title === 'string') return b.payload.title
  if (b.type === 'resource_card' && typeof b.payload.title === 'string') return b.payload.title
  if (b.type === 'quiz' && typeof b.payload.question === 'string') return b.payload.question.slice(0, 60)
  return page.preview?.slice(0, 60) || b.type
}

function collectNotebookDigest(pages: NotebookPage[]): string {
  const lines: string[] = []
  pages.forEach((p, i) => {
    const title = pageTitle(p)
    lines.push(`${i + 1}. ${title}`)
    if (p.source === 'note' && p.noteText?.trim()) {
      lines.push(`   Note: ${p.noteText.trim().slice(0, 200)}`)
    }
    if (p.blocks) {
      for (const b of p.blocks) {
        if (b.type === 'lesson_html' && typeof b.payload.objective === 'string') {
          lines.push(`   Goal: ${b.payload.objective}`)
        }
        if (b.type === 'concept_card' && typeof b.payload.key_idea === 'string') {
          lines.push(`   Idea: ${String(b.payload.key_idea).slice(0, 200)}`)
        }
      }
    }
  })
  return lines.join('\n')
}

function buildLearningMapBlock(pages: NotebookPage[]): TutorBlock {
  const nodes = pages.slice(0, 12).map((p, i) => ({
    id: `n${i + 1}`,
    label: pageTitle(p).slice(0, 40),
  }))
  const edges = nodes.slice(0, -1).map((n, i) => ({
    from: n.id,
    to: nodes[i + 1]!.id,
    label: 'next',
  }))
  return {
    id: `map-${Date.now()}`,
    type: 'diagram',
    payload: {
      title: 'Your learning path (accepted notes)',
      nodes,
      edges,
    },
  }
}

function buildCourseOutlineMarkdown(pages: NotebookPage[]): string {
  const modules = pages.map((p, i) => {
    const title = pageTitle(p)
    const objective =
      p.blocks?.find((b) => b.type === 'lesson_html' && typeof b.payload.objective === 'string')
        ?.payload.objective ??
      p.blocks?.find((b) => b.type === 'concept_card' && typeof b.payload.key_idea === 'string')
        ?.payload.key_idea ??
      ''
    return `### Module ${i + 1}: ${title}\n${objective ? `- Objective: ${String(objective).slice(0, 200)}\n` : ''}- Content: from your accepted SudarNotes\n`
  })
  return `# Course draft from SudarNotes\n\n${modules.join('\n') || '_No accepted notes yet._'}\n`
}

export interface NotebookToolsProps {
  pages: NotebookPage[]
  onAskSudar: (message: string) => void
  onAddGeneratedPage: (blocks: TutorBlock[], preview: string) => void
  className?: string
  /** Optional goal for Find resources (session working memory). */
  resourceTopicHint?: string | null
}

export function NotebookTools({
  pages,
  onAskSudar,
  onAddGeneratedPage,
  className,
  resourceTopicHint,
}: NotebookToolsProps) {
  const [showMapHint, setShowMapHint] = useState(false)
  const accepted = useMemo(() => acceptedNotebookPages(pages), [pages])
  const digest = useMemo(() => collectNotebookDigest(accepted), [accepted])
  const disabled = accepted.length === 0

  function summarize() {
    onAskSudar(
      `Summarize my accepted notebook notes as a short study recap (what I learned, what to practice next). Use only these accepted notes:\n\n${digest.slice(0, 3500)}`,
    )
  }

  function learningMap() {
    const block = buildLearningMapBlock(accepted)
    onAddGeneratedPage([block], 'Learning path from accepted notes')
    setShowMapHint(true)
    window.setTimeout(() => setShowMapHint(false), 4000)
  }

  function findResources() {
    const topic =
      (resourceTopicHint ?? '').trim() ||
      (accepted.length ? pageTitle(accepted[accepted.length - 1]!) : '')
    if (!topic) {
      onAskSudar(
        'I want verified YouTube and reading for what we are studying. Ask me the topic first if needed, then put resources in my notebook.',
      )
      return
    }
    onAskSudar(
      `Find a short YouTube explainer and one good article for: ${topic}. Put them in my notebook as verified resources.`,
    )
  }

  function draftCourse() {
    onAskSudar(
      `Turn my accepted notebook notes into a simple course outline (modules with titles and one-line objectives). Keep it beginner-friendly. Use only these accepted notes:\n\n${digest.slice(0, 3500)}`,
    )
  }

  function downloadOutline() {
    const md = buildCourseOutlineMarkdown(accepted)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sudar-notes-course-draft.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('space-y-1.5', className)} data-notebook-no-select>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={summarize}
          className="journey-action-btn inline-flex items-center gap-1"
          title="Study summary from accepted notes only"
        >
          Summary
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={learningMap}
          className="journey-action-btn inline-flex items-center gap-1"
          title="Map from accepted notes only"
        >
          Learning map
        </button>
        <button
          type="button"
          onClick={findResources}
          className="journey-action-btn inline-flex items-center gap-1"
          title="Find resources for your session goal"
        >
          Find resources
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={draftCourse}
          className="journey-action-btn inline-flex items-center gap-1"
          title="Course draft from accepted notes only"
        >
          Course draft
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={downloadOutline}
          className="journey-action-btn inline-flex items-center gap-1"
          title="Export accepted notes"
        >
          Export
        </button>
      </div>
      {showMapHint ? (
        <p className="journey-mono text-[10px] normal-case tracking-normal text-muted-foreground">
          Learning map added — built from accepted notes only.
        </p>
      ) : null}
      {disabled ? (
        <p className="text-[10px] text-muted-foreground">
          Accept a suggested note (or add your own) to unlock Summary, Map, Draft, and Export.
        </p>
      ) : null}
    </div>
  )
}
