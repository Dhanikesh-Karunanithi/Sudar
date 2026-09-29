'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import { GenerativeBlockRenderer } from '@/components/tutor/GenerativeBlockRenderer'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { NotebookSelectionToolbar } from './NotebookSelectionToolbar'
import { NotebookTools } from './NotebookTools'
import type { NotebookPage } from '@/types/journeyNotebook'
import type { TutorBlock } from '@/types/tutor'
import type { SudarNotesWorkingMemory } from '@/types/sudarNotes'
import { cn, safeNotebookPreview } from '@/lib/utils'
import { OPEN_TUTOR_EVENT } from '@/lib/tutor/proactiveEvents'

function pageTypeLabel(page: NotebookPage): string {
  if (page.status === 'suggested') return 'Suggested'
  if (page.source === 'note') return 'Your note'
  if (page.source === 'keep') return 'Kept from chat'
  const type = page.blocks?.[0]?.type
  switch (type) {
    case 'lesson_html':
      return 'Mini lesson'
    case 'video_embed':
      return 'Video'
    case 'resource_card':
      return 'Resource'
    case 'quiz':
      return 'Check'
    case 'concept_card':
      return 'Concept'
    case 'diagram':
      return 'Diagram'
    case 'timeline':
      return 'Timeline'
    case 'choice_group':
      return 'Choices'
    default:
      return 'From Sudar'
  }
}

function formatPageTime(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(ts))
  } catch {
    return ''
  }
}

export interface LearningNotebookProps {
  pages: NotebookPage[]
  workingMemory?: SudarNotesWorkingMemory
  onClear: () => void
  onAddNote: () => void
  onUpdateNote: (pageId: string, noteText: string) => void
  onAcceptPage?: (pageId: string) => void
  onDismissPage?: (pageId: string) => void
  onAskFromSelection: (action: string, selectedText: string) => void
  onCustomAsk: (selectedText: string) => void
  onAskSudar?: (message: string) => void
  onAddGeneratedPage?: (blocks: TutorBlock[], preview: string) => void
  className?: string
  chatCollapsed?: boolean
  onExpandChat?: () => void
}

function isResourcePage(page: NotebookPage): boolean {
  if (!page.blocks?.length) return false
  return page.blocks.every(
    (b) => b.type === 'resource_card' || b.type === 'video_embed' || b.type === 'media_card',
  )
}

function WorkingMemoryStrip({ wm }: { wm: SudarNotesWorkingMemory }) {
  const hasAnything =
    Boolean(wm.goal?.trim()) ||
    Boolean(wm.active_concept?.trim()) ||
    wm.open_questions.length > 0 ||
    wm.gaps.length > 0
  if (!hasAnything) {
    return (
      <div className="border-b border-border px-4 py-2.5 md:px-6">
        <p className="journey-mono text-[10px] text-muted-foreground">Working memory</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Your goal and open questions appear here as you talk with Sudar.
        </p>
      </div>
    )
  }
  return (
    <div className="border-b border-border px-4 py-2.5 md:px-6" aria-label="Working memory">
      <p className="journey-mono text-[10px] text-muted-foreground">Working memory</p>
      <dl className="mt-1.5 space-y-1 text-xs text-card-foreground">
        {wm.goal?.trim() ? (
          <div>
            <dt className="inline font-medium text-muted-foreground">Goal · </dt>
            <dd className="inline">{wm.goal}</dd>
          </div>
        ) : null}
        {wm.active_concept?.trim() ? (
          <div>
            <dt className="inline font-medium text-muted-foreground">Now · </dt>
            <dd className="inline">{wm.active_concept}</dd>
          </div>
        ) : null}
        {wm.open_questions.length > 0 ? (
          <div>
            <dt className="font-medium text-muted-foreground">Open</dt>
            <dd className="mt-0.5 text-muted-foreground">
              {wm.open_questions.slice(0, 3).join(' · ')}
            </dd>
          </div>
        ) : null}
        {wm.gaps.length > 0 ? (
          <div>
            <dt className="inline font-medium text-muted-foreground">Gaps · </dt>
            <dd className="inline text-muted-foreground">{wm.gaps.slice(0, 3).join(', ')}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}

export function LearningNotebook({
  pages,
  workingMemory,
  onClear,
  onAddNote,
  onUpdateNote,
  onAcceptPage,
  onDismissPage,
  onAskFromSelection,
  onCustomAsk,
  onAskSudar,
  onAddGeneratedPage,
  className,
  chatCollapsed,
  onExpandChat,
}: LearningNotebookProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)
  const [resourceIdx, setResourceIdx] = useState(0)

  const visiblePages = pages.filter((p) => p.status !== 'dismissed')
  const lessonPages = visiblePages.filter((p) => !isResourcePage(p))
  const resourcePages = visiblePages.filter(isResourcePage)
  const suggestedCount = visiblePages.filter((p) => p.status === 'suggested').length

  useEffect(() => {
    if (pages.length > prevCountRef.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
    prevCountRef.current = pages.length
  }, [pages.length])

  useEffect(() => {
    if (resourcePages.length > 0) setResourceIdx(resourcePages.length - 1)
  }, [resourcePages.length])

  function askSudar(message: string) {
    if (onAskSudar) {
      onAskSudar(message)
      return
    }
    window.dispatchEvent(
      new CustomEvent(OPEN_TUTOR_EVENT, {
        detail: { message, trigger: 'notebook_tools' },
      }),
    )
  }

  return (
    <section
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-[2px] border border-border bg-card shadow-none',
        className,
      )}
      aria-label="SudarNotes notebook"
    >
      <header className="flex shrink-0 flex-col border-b border-border">
        <div className="journey-panel-head-primary">
          <div className="min-w-0">
            <p className="journey-mono text-[11px] text-muted-foreground">SudarNotes</p>
            <h2 className="text-sm font-medium leading-snug text-card-foreground">
              Your living notebook
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Sudar suggests · you accept and edit
              {suggestedCount > 0 ? ` · ${suggestedCount} pending` : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onAddNote}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-card-foreground"
              aria-label="Add a note"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Note
            </button>
            {pages.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-card-foreground"
                aria-label="Clear notebook"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Clear
              </button>
            )}
            {chatCollapsed && onExpandChat && (
              <button
                type="button"
                onClick={onExpandChat}
                className="journey-action-btn lg:hidden"
              >
                Chat
              </button>
            )}
          </div>
        </div>
        {workingMemory ? <WorkingMemoryStrip wm={workingMemory} /> : null}
        <div className="journey-panel-head-secondary flex-col items-stretch !min-h-0 py-2.5">
          <NotebookTools
            pages={pages}
            onAskSudar={askSudar}
            onAddGeneratedPage={(blocks, preview) => onAddGeneratedPage?.(blocks, preview)}
            resourceTopicHint={
              workingMemory?.active_concept || workingMemory?.goal || null
            }
          />
        </div>
      </header>

      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 md:px-6"
      >
        <NotebookSelectionToolbar
          containerRef={scrollRef}
          onAction={onAskFromSelection}
          onCustomAsk={onCustomAsk}
        />

        {lessonPages.length === 0 ? (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <SudarLogoMark className="h-10 w-auto text-muted-foreground/50" starFill="var(--card)" />
            <p className="max-w-sm font-medium text-card-foreground">Your notebook is empty</p>
            <p className="max-w-sm text-xs">
              Tell Sudar what you want to get better at. Suggested notes appear here for you to
              accept — chat stays the conversation.
            </p>
          </div>
        ) : (
          <div className="relative space-y-0 pl-4">
            <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" aria-hidden />
            {lessonPages.map((page) => (
              <NotebookPageRow
                key={page.id}
                page={page}
                onUpdateNote={onUpdateNote}
                onAccept={onAcceptPage}
                onDismiss={onDismissPage}
                onLessonAction={askSudar}
                onTutorChoice={(msg) => askSudar(msg)}
              />
            ))}
            <div ref={endRef} className="h-1" aria-hidden />
          </div>
        )}
      </div>

      {resourcePages.length > 0 && (
        <div className="shrink-0 border-t border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <p className="journey-mono text-[10px] text-muted-foreground">
              Resources · {resourceIdx + 1} / {resourcePages.length}
            </p>
            <div className="flex items-center gap-1">
              {resourcePages[resourceIdx]?.status === 'suggested' && onAcceptPage ? (
                <button
                  type="button"
                  onClick={() => onAcceptPage(resourcePages[resourceIdx]!.id)}
                  className="journey-action-btn mr-1"
                >
                  Accept
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setResourceIdx((i) => Math.max(0, i - 1))}
                disabled={resourceIdx === 0}
                className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-card-foreground disabled:opacity-30"
                aria-label="Previous resource"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setResourceIdx((i) => Math.min(resourcePages.length - 1, i + 1))}
                disabled={resourceIdx === resourcePages.length - 1}
                className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-card-foreground disabled:opacity-30"
                aria-label="Next resource"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="px-4 py-3">
            {resourcePages[resourceIdx] && (
              <GenerativeBlockRenderer
                blocks={resourcePages[resourceIdx].blocks as TutorBlock[]}
                onLessonAction={askSudar}
                onTutorChoice={(d) => askSudar(d.followUpMessage)}
                onQuizRetry={() => {}}
              />
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function NotebookPageRow({
  page,
  onUpdateNote,
  onAccept,
  onDismiss,
  onLessonAction,
  onTutorChoice,
}: {
  page: NotebookPage
  onUpdateNote: (pageId: string, noteText: string) => void
  onAccept?: (pageId: string) => void
  onDismiss?: (pageId: string) => void
  onLessonAction: (prompt: string) => void
  onTutorChoice: (message: string) => void
}) {
  const label = pageTypeLabel(page)
  const time = formatPageTime(page.createdAt)
  const preview = safeNotebookPreview(page.preview)
  const suggested = page.status === 'suggested'

  return (
    <article
      className={cn(
        'relative pb-7 pl-5',
        suggested && 'rounded-[2px] border border-dashed border-border/80 bg-muted/20 pr-2 pt-2',
      )}
    >
      <span
        className="absolute left-0 top-2 h-2 w-2 -translate-x-[3px] rounded-full border border-border bg-card"
        aria-hidden
      />
      <header className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="journey-mono text-[10px] text-muted-foreground">{label}</span>
        {time ? (
          <span className="font-mono text-[10px] normal-case tracking-normal text-muted-foreground">
            {time}
          </span>
        ) : null}
        {page.source === 'sudar' && preview ? (
          <p className="w-full line-clamp-2 text-[11px] text-muted-foreground">
            From Sudar: {preview}
          </p>
        ) : null}
        {suggested && (onAccept || onDismiss) ? (
          <div className="mt-1 flex w-full gap-1.5" data-notebook-no-select>
            {onAccept ? (
              <button
                type="button"
                onClick={() => onAccept(page.id)}
                className="journey-action-btn inline-flex items-center gap-1"
                aria-label="Accept note into your notebook"
              >
                <Check className="h-3 w-3" aria-hidden />
                Accept
              </button>
            ) : null}
            {onDismiss ? (
              <button
                type="button"
                onClick={() => onDismiss(page.id)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-card-foreground"
                aria-label="Dismiss suggested note"
              >
                <X className="h-3 w-3" aria-hidden />
                Dismiss
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {page.source === 'note' ? (
        <div
          className="overflow-hidden rounded-[2px] border border-dashed border-border bg-transparent p-3"
          data-notebook-no-select
        >
          <label className="sr-only" htmlFor={`notebook-note-${page.id}`}>
            Your note
          </label>
          <textarea
            id={`notebook-note-${page.id}`}
            value={page.noteText ?? ''}
            onChange={(e) => onUpdateNote(page.id, e.target.value)}
            rows={4}
            placeholder="Jot something you want to remember…"
            className="w-full resize-y bg-transparent text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      ) : page.blocks && page.blocks.length > 0 ? (
        <div className="space-y-2">
          <GenerativeBlockRenderer
            blocks={page.blocks as TutorBlock[]}
            onLessonAction={onLessonAction}
            onTutorChoice={(d) => onTutorChoice(d.followUpMessage)}
            onQuizRetry={() => onLessonAction('Give me another soft check on what we just covered.')}
          />
        </div>
      ) : (
        <div className="rounded-[2px] border border-border px-3 py-2 text-xs text-muted-foreground">
          Empty page
        </div>
      )}
    </article>
  )
}
