'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { TutorBlock, TutorAction } from '@/types/tutor'
import type { QuizBlockPayload, QuizOption } from '@/types/tutor'
import { TUTOR_BLOCK_TYPES } from '@/types/tutor'
import { ExternalLink, Loader2, CheckCircle2, XCircle, RefreshCw, Trophy, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatMarkdown } from './ChatMarkdown'

function renderTextContent(text: string): React.ReactNode {
  if (!text?.trim()) return null
  const lines = text.split('\n')
  return (
    <span className="whitespace-pre-wrap">
      {lines.map((line, i) => {
        const parts: React.ReactNode[] = []
        let remaining = line
        let key = 0
        while (remaining.length > 0) {
          const boldStart = remaining.indexOf('**')
          if (boldStart === -1) {
            parts.push(<span key={key++}>{remaining}</span>)
            break
          }
          if (boldStart > 0) parts.push(<span key={key++}>{remaining.slice(0, boldStart)}</span>)
          const boldEnd = remaining.indexOf('**', boldStart + 2)
          if (boldEnd === -1) {
            parts.push(<span key={key++}>{remaining.slice(boldStart)}</span>)
            break
          }
          parts.push(<strong key={key++} className="font-semibold">{remaining.slice(boldStart + 2, boldEnd)}</strong>)
          remaining = remaining.slice(boldEnd + 2)
        }
        return (
          <span key={i}>
            {i > 0 ? <br /> : null}
            {parts.length === 1 ? parts[0] : parts}
          </span>
        )
      })}
    </span>
  )
}

function TextBlock({ payload }: { payload: Record<string, unknown> }) {
  const content = (payload.content as string) ?? ''
  return <div className="text-sm">{content.trim() ? <ChatMarkdown text={content} /> : null}</div>
}

function ActionGroupBlock({
  payload,
  onActionClick,
}: {
  payload: Record<string, unknown>
  onActionClick?: (action: TutorAction) => void
}) {
  const actions = (payload.actions as TutorAction[]) ?? []
  if (actions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((action, aIdx) => (
        <Link
          key={aIdx}
          href={action.href}
          onClick={() => onActionClick?.(action)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {action.label}
        </Link>
      ))}
    </div>
  )
}

function CardBlock({ payload }: { payload: Record<string, unknown> }) {
  const title = (payload.title as string) ?? ''
  const description = (payload.description as string) ?? ''
  const imageUrl = payload.image_url as string | undefined
  const action = payload.action as TutorAction | undefined
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm mt-2">
      {imageUrl && (
        <div className="h-24 bg-muted bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
      )}
      <div className="p-3">
        <h4 className="font-semibold text-card-foreground">{title}</h4>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {action.label}
          </Link>
        )}
      </div>
    </div>
  )
}

function WorkflowStatusBlock({ payload }: { payload: Record<string, unknown> }) {
  const name = (payload.name as string) ?? 'Workflow'
  const steps = (payload.steps as string[]) ?? []
  const currentStepIndex = (payload.current_step_index as number) ?? 0
  const status = (payload.status as 'running' | 'done' | 'error') ?? 'running'
  const summary = payload.summary as string | undefined
  return (
    <div className="rounded-xl border border-border bg-card p-3 mt-2 space-y-2">
      <div className="flex items-center gap-2">
        {status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        {status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
        {status === 'error' && <XCircle className="w-4 h-4 text-destructive" />}
        <span className="font-medium text-card-foreground">{name}</span>
      </div>
      {steps.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {steps.map((step, i) => (
            <li key={i} className={cn(i === currentStepIndex && status === 'running' && 'text-primary font-medium')}>
              {i < currentStepIndex ? '✓ ' : ''}
              {step}
            </li>
          ))}
        </ul>
      )}
      {summary && <p className="text-xs text-muted-foreground">{summary}</p>}
    </div>
  )
}

function ExternalActionBlock({ payload }: { payload: Record<string, unknown> }) {
  const appId = (payload.app_id as string) ?? 'app'
  const label = (payload.label as string) ?? 'Open'
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2 mt-2 text-xs text-muted-foreground">
      Connected app: {appId} — {label}
    </div>
  )
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

const DIFFICULTY_CONFIG = {
  recall: { label: 'Recall', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  application: { label: 'Application', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  challenge: { label: 'Challenge', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
} as const

function QuizBlock({
  payload,
  onRetry,
}: {
  payload: Record<string, unknown>
  onRetry?: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const data = payload as unknown as QuizBlockPayload
  const { question, options, topic, difficulty } = data
  if (!question || !Array.isArray(options) || options.length === 0) return null

  const diffConfig = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.recall
  const answered = selectedId !== null
  const selectedOption = options.find((o: QuizOption) => o.id === selectedId)
  const isCorrect = selectedOption?.correct === true

  function handleSelect(option: QuizOption) {
    if (answered) return
    setSelectedId(option.id)
    setShowAll(true)
  }

  function getOptionStyle(option: QuizOption): string {
    if (!answered) {
      return 'border-border bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer'
    }
    if (option.correct) {
      return 'border-green-500 bg-green-500/10 cursor-default'
    }
    if (option.id === selectedId && !option.correct) {
      return 'border-red-400 bg-red-400/10 cursor-default'
    }
    return 'border-border bg-muted/50 opacity-60 cursor-default'
  }

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-border/60">
        <Brain className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs font-semibold text-card-foreground truncate flex-1">{topic}</span>
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', diffConfig.color)}>
          {diffConfig.label}
        </span>
      </div>

      {/* Question */}
      <div className="px-3 pt-3 pb-2">
        <p className="text-sm font-medium text-card-foreground leading-snug">{question}</p>
      </div>

      {/* Options */}
      <div className="px-3 pb-3 space-y-2">
        {options.map((option: QuizOption, idx: number) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            disabled={answered}
            className={cn(
              'w-full text-left rounded-xl border px-3 py-2 transition-all duration-150',
              getOptionStyle(option)
            )}
          >
            <div className="flex items-start gap-2.5">
              {/* Label badge */}
              <span
                className={cn(
                  'shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 border',
                  !answered && 'border-border text-muted-foreground bg-muted',
                  answered && option.correct && 'border-green-500 text-green-600 bg-green-500/20',
                  answered && option.id === selectedId && !option.correct && 'border-red-400 text-red-500 bg-red-400/20',
                  answered && !option.correct && option.id !== selectedId && 'border-border text-muted-foreground/50 bg-muted',
                )}
              >
                {OPTION_LABELS[idx] ?? option.id.toUpperCase()}
              </span>

              <div className="flex-1 min-w-0">
                <span className={cn(
                  'text-xs leading-snug',
                  !answered && 'text-card-foreground',
                  answered && option.correct && 'text-green-700 font-medium',
                  answered && option.id === selectedId && !option.correct && 'text-red-600',
                  answered && !option.correct && option.id !== selectedId && 'text-muted-foreground',
                )}>
                  {option.text}
                </span>

                {/* Explanation — shown after answering */}
                {showAll && (
                  <p className={cn(
                    'text-[11px] mt-1 leading-snug',
                    option.correct ? 'text-green-600' : 'text-muted-foreground',
                  )}>
                    {option.explanation}
                  </p>
                )}
              </div>

              {/* Result icon */}
              {answered && (
                <span className="shrink-0 mt-0.5">
                  {option.correct
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : option.id === selectedId
                      ? <XCircle className="w-4 h-4 text-red-400" />
                      : null}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Result banner + Try another */}
      {answered && (
        <div className={cn(
          'px-3 py-2.5 border-t flex items-center justify-between gap-2',
          isCorrect ? 'bg-green-500/10 border-green-200' : 'bg-amber-500/10 border-amber-200',
        )}>
          <div className="flex items-center gap-1.5">
            {isCorrect
              ? <><Trophy className="w-3.5 h-3.5 text-green-600" /><span className="text-xs font-semibold text-green-700">Correct!</span></>
              : <><XCircle className="w-3.5 h-3.5 text-amber-600" /><span className="text-xs font-semibold text-amber-700">Not quite — review the explanations above.</span></>
            }
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Try another
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const BLOCK_RENDERERS: Record<
  string,
  (props: { payload: Record<string, unknown>; onActionClick?: (action: TutorAction) => void; onQuizRetry?: () => void }) => React.ReactNode
> = {
  text: ({ payload }) => <TextBlock payload={payload} />,
  action_group: (props) => <ActionGroupBlock {...props} />,
  card: ({ payload }) => <CardBlock payload={payload} />,
  workflow_status: ({ payload }) => <WorkflowStatusBlock payload={payload} />,
  external_action: ({ payload }) => <ExternalActionBlock payload={payload} />,
  quiz: ({ payload, onQuizRetry }) => <QuizBlock payload={payload} onRetry={onQuizRetry} />,
}

export interface GenerativeBlockRendererProps {
  blocks: TutorBlock[]
  onActionClick?: (action: TutorAction) => void
  onQuizRetry?: () => void
  className?: string
}

export function GenerativeBlockRenderer({ blocks, onActionClick, onQuizRetry, className }: GenerativeBlockRendererProps) {
  if (!blocks?.length) return null
  return (
    <div className={cn('space-y-2', className)}>
      {blocks.map((block) => {
        const Renderer = TUTOR_BLOCK_TYPES.includes(block.type as (typeof TUTOR_BLOCK_TYPES)[number])
          ? BLOCK_RENDERERS[block.type]
          : null
        if (!Renderer) return <div key={block.id} className="text-xs text-muted-foreground" />
        return (
          <div key={block.id}>
            <Renderer payload={block.payload} onActionClick={onActionClick} onQuizRetry={onQuizRetry} />
          </div>
        )
      })}
    </div>
  )
}
