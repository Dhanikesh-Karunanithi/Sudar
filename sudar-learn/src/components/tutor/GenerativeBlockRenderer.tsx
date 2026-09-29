'use client'

import { useState } from 'react'
import Link from 'next/link'
import type {
  TutorBlock,
  TutorAction,
  ChoiceGroupBlockPayload,
  ConceptCardBlockPayload,
  DiagramBlockPayload,
  TimelineBlockPayload,
  MediaCardBlockPayload,
  InteractiveDemoBlockPayload,
  LessonHtmlBlockPayload,
  VideoEmbedBlockPayload,
  ResourceCardBlockPayload,
} from '@/types/tutor'
import type { QuizBlockPayload, QuizOption } from '@/types/tutor'
import { TUTOR_BLOCK_TYPES } from '@/types/tutor'
import { ExternalLink, CheckCircle2, XCircle, RefreshCw, Trophy, Brain, Sparkles, Clock, Atom } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { cn } from '@/lib/utils'
import { ChatMarkdown } from './ChatMarkdown'
import { youtubeWatchUrlFromEmbed } from '@/lib/tutor/youtubeEmbed'
import { normalizeTutorDisplayText } from '@/lib/tutor/normalizeTutorDisplayText'

function isSafeHref(href: string): boolean {
  if (href.startsWith('/')) return true
  return /^https?:\/\//i.test(href)
}

function isSafeImageUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false
  return /^https:\/\//i.test(url.trim())
}

function TextBlock({ payload }: { payload: Record<string, unknown> }) {
  const content = (payload.content as string) ?? ''
  const normalized = normalizeTutorDisplayText(content)
  return <div className="text-sm">{normalized.trim() ? <ChatMarkdown text={normalized} /> : null}</div>
}

function LessonHtmlBlock({
  payload,
  onLessonAction,
}: {
  payload: Record<string, unknown>
  onLessonAction?: (prompt: string) => void
}) {
  const p = payload as LessonHtmlBlockPayload
  const title = p.title
  const html = p.html
  const objective = p.objective
  const durationMins = p.duration_mins
  const tryThis = p.try_this
  if (!html?.trim()) return null
  const topic = title?.trim() || 'this lesson'
  return (
    <article className="journey-lesson mt-2 overflow-hidden rounded-[2px] border border-border bg-card">
      <header className="space-y-2 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="journey-mono text-[10px] text-muted-foreground">
            {typeof durationMins === 'number' ? `Lesson · ${durationMins} min` : 'Lesson'}
          </span>
        </div>
        {title ? (
          <h3 className="text-[17px] font-medium text-card-foreground">{title}</h3>
        ) : null}
        {objective ? (
          <p className="journey-lesson-objective text-sm leading-relaxed">{objective}</p>
        ) : null}
      </header>
      <div
        className="lesson-html max-w-none space-y-2 px-4 py-3 text-sm leading-relaxed text-card-foreground
          [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold
          [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
          [&_a]:text-primary [&_a]:underline [&_code]:rounded-[2px] [&_code]:bg-muted [&_code]:px-1
          [&_pre]:overflow-x-auto [&_pre]:rounded-[2px] [&_pre]:bg-muted [&_pre]:p-3
          [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1
          [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {tryThis ? (
        <div className="border-t border-border px-4 py-3">
          <p className="journey-mono text-[10px] text-muted-foreground">Try this</p>
          <p className="mt-1 text-sm text-card-foreground">{tryThis}</p>
        </div>
      ) : null}
      {onLessonAction ? (
        <div
          className="flex flex-wrap gap-2 border-t border-border px-3 py-3"
          data-notebook-no-select
        >
          <button
            type="button"
            onClick={() =>
              onLessonAction(
                tryThis
                  ? `I am working on: "${tryThis}". Check my understanding of ${topic} and help if I am stuck.`
                  : `Quiz me lightly on ${topic} to check I understood.`,
              )
            }
            className="inline-flex items-center gap-1 rounded-[2px] border border-border px-2.5 py-1.5 text-[11px] font-medium text-card-foreground journey-action-btn"
          >
            Check with Sudar
          </button>
          <button
            type="button"
            onClick={() =>
              onLessonAction(
                `Explain ${topic} more simply with a beginner analogy, then one tiny practice step.`,
              )
            }
            className="inline-flex items-center gap-1 rounded-[2px] border border-border px-2.5 py-1.5 text-[11px] font-medium text-card-foreground journey-action-btn"
          >
            Go deeper
          </button>
          <button
            type="button"
            onClick={() =>
              onLessonAction(
                `Find a short YouTube explainer and one good article about ${topic}. Put them in my notebook.`,
              )
            }
            className="inline-flex items-center gap-1 rounded-[2px] border border-border px-2.5 py-1.5 text-[11px] font-medium text-card-foreground journey-action-btn"
          >
            Find video & reading
          </button>
        </div>
      ) : null}
    </article>
  )
}

function VideoEmbedBlock({ payload }: { payload: Record<string, unknown> }) {
  const title = (payload as VideoEmbedBlockPayload & { embed_url?: string }).title
  const why = (payload as VideoEmbedBlockPayload).why
  const embedUrl = (payload as { embed_url?: string }).embed_url
  if (!embedUrl || !/^https:\/\/www\.youtube\.com\/embed\//i.test(embedUrl)) return null
  const watchUrl = youtubeWatchUrlFromEmbed(embedUrl)
  return (
    <article className="journey-lesson mt-2 overflow-hidden rounded-[2px] border border-border bg-card">
      <header className="flex items-start justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="min-w-0">
          <p className="journey-mono text-[10px] text-muted-foreground">Video</p>
          {title ? (
            <h3 className="truncate text-sm font-medium text-card-foreground">{title}</h3>
          ) : null}
        </div>
        {watchUrl && (
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="journey-resource-open inline-flex shrink-0 items-center gap-1 text-xs font-medium hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            YouTube
          </a>
        )}
      </header>
      <div className="relative aspect-video w-full bg-black">
        <iframe
          src={embedUrl}
          title={title ?? 'YouTube video'}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {why ? (
        <p className="px-4 py-2.5 text-xs text-muted-foreground">
          <span className="font-medium text-card-foreground">Why this helps: </span>
          {why}
        </p>
      ) : null}
    </article>
  )
}

function ResourceCardBlock({ payload }: { payload: Record<string, unknown> }) {
  const p = payload as ResourceCardBlockPayload
  if (!p.title?.trim() || !isSafeHref(p.url) || !/^https:\/\//i.test(p.url)) return null
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="journey-resource mt-2 block rounded-[2px] border border-border bg-card p-4 transition-colors hover:border-primary"
    >
      <p className="journey-mono text-[10px] text-muted-foreground">
        {p.source_label?.trim() || 'Resource'}
      </p>
      <h3 className="mt-1 text-sm font-medium text-card-foreground">{p.title}</h3>
      {p.why ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.why}</p> : null}
      <p className="journey-resource-open mt-2 inline-flex items-center gap-1 text-xs">
        Open link →
      </p>
    </a>
  )
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
  const safeActions = actions.filter((action) => action?.label?.trim() && isSafeHref(action.href))
  if (safeActions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {safeActions.map((action, aIdx) => (
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
  const rawImage = payload.image_url as string | undefined
  const imageUrl = isSafeImageUrl(rawImage) ? rawImage : undefined
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
        {status === 'running' && <SudarInlineLoader size="sm" />}
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

function ChoiceGroupBlock({
  blockId,
  payload,
  onTutorChoice,
}: {
  blockId: string
  payload: Record<string, unknown>
  onTutorChoice?: (d: TutorChoiceDetail) => void
}) {
  const data = payload as unknown as ChoiceGroupBlockPayload
  const choices = data.choices ?? []
  if (!Array.isArray(choices) || choices.length === 0) return null
  return (
    <div className="mt-3 space-y-2">
      {data.question ? (
        <p className="text-xs font-medium text-card-foreground">{data.question}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() =>
              onTutorChoice?.({
                blockId,
                choiceId: c.id,
                followUpMessage: c.follow_up_message,
                label: c.label,
              })
            }
            className="rounded-full bg-card/90 border border-border px-3.5 py-2 text-xs sm:text-sm text-card-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors text-left"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ConceptCardBlock({ payload }: { payload: Record<string, unknown> }) {
  const p = payload as unknown as ConceptCardBlockPayload
  if (!p.title || !p.key_idea) return null
  return (
    <div className="mt-2 rounded-xl border border-primary/25 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="w-4 h-4 shrink-0" />
        <h4 className="text-sm font-semibold text-card-foreground">{p.title}</h4>
      </div>
      <p className="text-xs text-card-foreground/90 leading-relaxed">{p.key_idea}</p>
      {p.analogy && (
        <p className="text-[11px] text-muted-foreground border-l-2 border-primary/30 pl-2">
          <span className="font-medium text-primary/90">Analogy: </span>
          {p.analogy}
        </p>
      )}
      {p.misconception && (
        <p className="text-[11px] text-amber-700/90 bg-amber-500/10 rounded-lg px-2 py-1.5">
          <span className="font-medium">Common mix-up: </span>
          {p.misconception}
        </p>
      )}
    </div>
  )
}

function DiagramBlock({ payload }: { payload: Record<string, unknown> }) {
  const p = payload as unknown as DiagramBlockPayload
  const nodes = p.nodes ?? []
  if (nodes.length === 0) return null
  return (
    <div className="mt-2 rounded-xl border border-border bg-muted/20 p-3 space-y-2">
      {p.title && <p className="text-xs font-semibold text-card-foreground">{p.title}</p>}
      <div className="flex flex-wrap gap-2 justify-center">
        {nodes.map((n) => (
          <div
            key={n.id}
            className="rounded-lg border border-primary/30 bg-card px-2.5 py-1.5 text-[11px] font-medium text-center max-w-[140px] text-card-foreground"
          >
            {n.label}
          </div>
        ))}
      </div>
      {p.edges && p.edges.length > 0 && (
        <ul className="text-[10px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/60">
          {p.edges.map((e, i) => (
            <li key={i}>
              {e.from} → {e.to}
              {e.label ? ` (${e.label})` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TimelineBlock({ payload }: { payload: Record<string, unknown> }) {
  const p = payload as unknown as TimelineBlockPayload
  const items = p.items ?? []
  if (items.length === 0) return null
  return (
    <div className="mt-2 rounded-xl border border-border bg-card/80 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-card-foreground">
        <Clock className="w-3.5 h-3.5 text-primary" />
        {p.title ?? 'Order of ideas'}
      </div>
      <ol className="space-y-2">
        {items.map((it, idx) => (
          <li key={it.id} className="flex gap-2 text-xs">
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">
              {idx + 1}
            </span>
            <div>
              <p className="font-medium text-card-foreground">{it.title}</p>
              {it.description && <p className="text-[11px] text-muted-foreground mt-0.5">{it.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function MediaCardBlock({ payload }: { payload: Record<string, unknown> }) {
  const p = payload as unknown as MediaCardBlockPayload
  if (!p.title) return null
  const img = isSafeImageUrl(p.image_url) ? p.image_url : undefined
  const link = p.link_url && isSafeHref(p.link_url) ? p.link_url : undefined
  return (
    <div className="mt-2 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="w-full h-32 object-cover bg-muted" loading="lazy" referrerPolicy="no-referrer" />
      )}
      <div className="p-3 space-y-1.5">
        <p className="text-xs font-semibold text-card-foreground">{p.title}</p>
        {p.snippet && <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-4">{p.snippet}</p>}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          {p.source_label && <span className="rounded bg-muted px-1.5 py-0.5">{p.source_label}</span>}
          {p.attribution && <span>{p.attribution}</span>}
        </div>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Open link
          </a>
        )}
      </div>
    </div>
  )
}

function InteractiveDemoBlock({ payload }: { payload: Record<string, unknown> }) {
  const p = payload as unknown as InteractiveDemoBlockPayload
  const id = p.component_id
  const copy: Record<string, string> = {
    molecule_viewer: '3D-style molecule view is a curated add-on. Ask Sudar to describe bonds and geometry in text for now.',
    cell_model: 'Cell explorer runs as a guided lesson. Sudar can walk you through organelles step by step in chat.',
    physics_demo: 'Interactive physics here means guided prompts — ask for a concrete scenario and Sudar will work through it.',
    placeholder: p.label || 'This interactive is coming soon. Ask Sudar to explain the concept in words or a mini quiz.',
  }
  return (
    <div className="mt-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 flex gap-2">
      <Atom className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-medium text-card-foreground capitalize">{id.replace(/_/g, ' ')}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{copy[id] ?? copy.placeholder}</p>
      </div>
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

export type TutorChoiceDetail = {
  blockId: string
  choiceId: string
  followUpMessage: string
  label: string
}

type BlockRendererProps = {
  blockId: string
  payload: Record<string, unknown>
  onActionClick?: (action: TutorAction) => void
  onQuizRetry?: () => void
  onTutorChoice?: (d: TutorChoiceDetail) => void
  onLessonAction?: (prompt: string) => void
}

const BLOCK_RENDERERS: Record<string, (props: BlockRendererProps) => React.ReactNode> = {
  text: ({ payload }) => <TextBlock payload={payload} />,
  action_group: (props) => <ActionGroupBlock payload={props.payload} onActionClick={props.onActionClick} />,
  card: ({ payload }) => <CardBlock payload={payload} />,
  workflow_status: ({ payload }) => <WorkflowStatusBlock payload={payload} />,
  external_action: ({ payload }) => <ExternalActionBlock payload={payload} />,
  quiz: ({ payload, onQuizRetry }) => <QuizBlock payload={payload} onRetry={onQuizRetry} />,
  choice_group: ({ blockId, payload, onTutorChoice }) => (
    <ChoiceGroupBlock blockId={blockId} payload={payload} onTutorChoice={onTutorChoice} />
  ),
  concept_card: ({ payload }) => <ConceptCardBlock payload={payload} />,
  diagram: ({ payload }) => <DiagramBlock payload={payload} />,
  timeline: ({ payload }) => <TimelineBlock payload={payload} />,
  media_card: ({ payload }) => <MediaCardBlock payload={payload} />,
  interactive_demo: ({ payload }) => <InteractiveDemoBlock payload={payload} />,
  lesson_html: ({ payload, onLessonAction }) => (
    <LessonHtmlBlock payload={payload} onLessonAction={onLessonAction} />
  ),
  video_embed: ({ payload }) => <VideoEmbedBlock payload={payload} />,
  resource_card: ({ payload }) => <ResourceCardBlock payload={payload} />,
}

export interface GenerativeBlockRendererProps {
  blocks: TutorBlock[]
  onActionClick?: (action: TutorAction) => void
  onQuizRetry?: () => void
  /** Fired when learner taps an inline clarification choice (sends follow-up to tutor). */
  onTutorChoice?: (d: TutorChoiceDetail) => void
  /** Notebook mini-lesson actions (check / deeper / find resources). */
  onLessonAction?: (prompt: string) => void
  className?: string
}

export function GenerativeBlockRenderer({
  blocks,
  onActionClick,
  onQuizRetry,
  onTutorChoice,
  onLessonAction,
  className,
}: GenerativeBlockRendererProps) {
  if (!blocks?.length) return null
  return (
    <div className={cn('space-y-2', className)}>
      {blocks.map((block) => {
        const Renderer = TUTOR_BLOCK_TYPES.includes(block.type as (typeof TUTOR_BLOCK_TYPES)[number])
          ? BLOCK_RENDERERS[block.type]
          : null
        if (!Renderer) {
          return (
            <div key={block.id} className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              I could not render one part of this answer. Please ask Sudar to try again.
            </div>
          )
        }
        return (
          <div key={block.id}>
            <Renderer
              blockId={block.id}
              payload={block.payload}
              onActionClick={onActionClick}
              onQuizRetry={onQuizRetry}
              onTutorChoice={onTutorChoice}
              onLessonAction={onLessonAction}
            />
          </div>
        )
      })}
    </div>
  )
}
