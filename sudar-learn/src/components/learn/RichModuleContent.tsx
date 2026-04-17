'use client'

import { useState } from 'react'
import { Code, ChevronDown, ChevronRight, Sparkles, Quote, BarChart3, FileText, Lightbulb, ArrowRight, Clock, HelpCircle, HelpCircleIcon, Globe, Brain, QuoteIcon, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RichContent, EntryState, ExitState } from '@/types/content'
import { QuizCard } from '@/app/(dashboard)/courses/[id]/learn/QuizCard'
import { TimelineBlock } from '@/components/learn/blocks/TimelineBlock'
import { FlipcardBlock } from '@/components/learn/blocks/FlipcardBlock'
import { HotspotBlock } from '@/components/learn/blocks/HotspotBlock'
import { MatchingBlock } from '@/components/learn/blocks/MatchingBlock'
import { TabsBlock } from '@/components/learn/blocks/TabsBlock'
import { AudioBlock } from '@/components/learn/blocks/AudioBlock'
import { FlashcardBlock } from '@/components/learn/blocks/FlashcardBlock'

interface RichModuleContentProps {
  content: RichContent
  renderMarkdown: (body: string, opts?: { showEmptyState?: boolean }) => React.ReactNode
  onExplain?: (context: string) => void
  courseId: string
  moduleId: string
  moduleTitle: string
  learnerName?: string
  onQuizComplete?: (score: number, wrongTopics: string[]) => void
  onAskByte?: (prompt: string) => void
}

function ExpandableBlock({
  title,
  content,
  renderMarkdown,
  defaultOpen = false,
}: {
  title: string
  content: string
  renderMarkdown: (body: string, opts?: { showEmptyState?: boolean }) => React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="my-4 rounded-xl border border-border overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left font-medium text-card-foreground hover:bg-muted/50 transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-border text-sm text-muted-foreground">
          {renderMarkdown(content, { showEmptyState: false })}
        </div>
      )}
    </div>
  )
}

function CodeDemoBlock({
  code,
  language = 'code',
  onExplain,
}: {
  code: string
  language?: string
  onExplain?: (context: string) => void
}) {
  return (
    <div className="my-4 rounded-xl overflow-hidden border border-border shadow-sm">
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono">{language}</span>
        </div>
        {onExplain && (
          <button
            type="button"
            onClick={() => onExplain(`Explain this code:\n\n${code}`)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Sparkles className="w-3 h-3" /> Explain with Sudar
          </button>
        )}
      </div>
      <pre className="bg-card p-4 overflow-x-auto">
        <code className="text-sm text-card-foreground font-mono leading-relaxed whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  )
}

function DiagramBlock({
  explanation,
  onAskByte,
}: {
  explanation: string
  onAskByte?: (prompt: string) => void
}) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="my-4 rounded-xl border border-border bg-muted/30 p-4">
      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="text-sm font-medium text-primary hover:underline"
        >
          Click to see explanation
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-card-foreground">{explanation}</p>
          {onAskByte && (
            <button
              type="button"
              onClick={() => onAskByte('Explain this diagram or concept in more detail.')}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Sparkles className="w-3 h-3" /> Ask Sudar for more
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SideCardBlock({ title, content, tips, noteType }: { title: string; content: string; tips?: string[]; noteType?: string }) {
  const isWaitWhy = noteType === 'wait-but-why'
  const isRealWorld = noteType === 'real-world'
  const isBrainMoment = noteType === 'brain-moment'
  const isExpertVoice = noteType === 'expert-voice'
  const isRabbitHole = noteType === 'rabbit-hole'
  const accentClass = isWaitWhy
    ? 'border-amber-200/50 bg-amber-50/30 dark:border-amber-700/40 dark:bg-amber-950/20'
    : isRealWorld
      ? 'border-blue-200/50 bg-blue-50/30 dark:border-blue-700/40 dark:bg-blue-950/20'
      : isBrainMoment
        ? 'border-violet-200/50 bg-violet-50/30 dark:border-violet-700/40 dark:bg-violet-950/20'
        : isExpertVoice
          ? 'border-slate-200/50 bg-slate-50/50 dark:border-slate-600/40 dark:bg-slate-900/30'
          : isRabbitHole
            ? 'border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-700/40 dark:bg-emerald-950/20'
            : 'border-primary/20 bg-primary/5'
  return (
    <aside className={cn('my-4 rounded-xl border p-4', accentClass)}>
      {noteType && (
        <div className="flex items-center gap-2 mb-2">
          {isWaitWhy && <HelpCircleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
          {isRealWorld && <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
          {isBrainMoment && <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />}
          {isExpertVoice && <QuoteIcon className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />}
          {isRabbitHole && <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
          <span className="text-xs font-medium uppercase tracking-wider opacity-90">
            {isWaitWhy && 'Wait, but why?'}
            {isRealWorld && 'Real world'}
            {isBrainMoment && 'Your brain just did something'}
            {isExpertVoice && 'The expert would say'}
            {isRabbitHole && 'Rabbit hole'}
          </span>
        </div>
      )}
      <h4 className="text-sm font-semibold text-card-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
      {tips && tips.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground list-disc list-inside">
          {tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      )}
    </aside>
  )
}

function EntryStateBlock({ entry, renderMarkdown }: { entry: EntryState; renderMarkdown: (body: string, opts?: { showEmptyState?: boolean }) => React.ReactNode }) {
  const isProvocation = entry.type === 'provocation'
  const isDataDrop = entry.type === 'data-drop'
  const isScenario = entry.type === 'scenario-fragment'
  const isContrarian = entry.type === 'contrarian-claim'
  return (
    <div
      className={cn(
        'rounded-xl border p-5',
        isProvocation && 'border-primary/30 bg-primary/5',
        isDataDrop && 'border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20',
        isScenario && 'border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/20',
        isContrarian && 'border-orange-200/50 bg-orange-50/30 dark:bg-orange-950/20'
      )}
    >
      {isProvocation && <Quote className="w-5 h-5 text-primary mb-2 opacity-80" />}
      {isDataDrop && <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2 opacity-80" />}
      {isScenario && <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-2 opacity-80" />}
      {isContrarian && <HelpCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mb-2 opacity-80" />}
      <div className={cn(
        'text-sm leading-relaxed',
        isProvocation && 'text-lg text-card-foreground font-medium',
        (isDataDrop || isScenario || isContrarian) && 'text-muted-foreground'
      )}>
        {renderMarkdown(entry.content, { showEmptyState: false })}
      </div>
    </div>
  )
}

function ExitStateBlock({ exit, renderMarkdown }: { exit: ExitState; renderMarkdown: (body: string, opts?: { showEmptyState?: boolean }) => React.ReactNode }) {
  const isReflection = exit.type === 'reflection'
  const isApply24h = exit.type === 'apply-24h'
  const isTeaser = exit.type === 'next-conflict-teaser'
  const isWhatChanged = exit.type === 'what-changed'
  return (
    <div
      className={cn(
        'rounded-xl border p-5',
        isReflection && 'border-primary/20 bg-primary/5',
        isApply24h && 'border-green-200/50 bg-green-50/30 dark:bg-green-950/20',
        isTeaser && 'border-violet-200/50 bg-violet-50/30 dark:bg-violet-950/20',
        isWhatChanged && 'border-sky-200/50 bg-sky-50/30 dark:bg-sky-950/20'
      )}
    >
      {isApply24h && <Clock className="w-5 h-5 text-green-600 dark:text-green-400 mb-2 opacity-80" />}
      {isTeaser && <ArrowRight className="w-5 h-5 text-violet-600 dark:text-violet-400 mb-2 opacity-80" />}
      {isWhatChanged && <Lightbulb className="w-5 h-5 text-sky-600 dark:text-sky-400 mb-2 opacity-80" />}
      <div className="text-sm text-muted-foreground leading-relaxed">
        {renderMarkdown(exit.content, { showEmptyState: false })}
      </div>
    </div>
  )
}

export function RichModuleContent({
  content,
  renderMarkdown,
  onExplain,
  courseId,
  moduleId,
  moduleTitle,
  learnerName,
  onQuizComplete,
  onAskByte,
}: RichModuleContentProps) {
  const hasSideCard = content.sideCard && (content.sideCard.title || content.sideCard.content)

  return (
    <div className="space-y-8">
      {content.entryState ? (
        <EntryStateBlock entry={content.entryState} renderMarkdown={renderMarkdown} />
      ) : content.introduction ? (
        <div className="text-sm text-muted-foreground leading-relaxed">
          {renderMarkdown(content.introduction, { showEmptyState: false })}
        </div>
      ) : null}

      <div className={cn('space-y-8', hasSideCard && 'lg:grid lg:grid-cols-[1fr,280px] lg:gap-8 lg:items-start')}>
        <div className="space-y-8">
          {content.sections.map((section, idx) => (
            <section key={idx}>
              <h3 className="text-lg font-semibold text-card-foreground mt-6 mb-2 first:mt-0">
                {section.heading}
              </h3>
              {section.type === 'code' ? (
                <CodeDemoBlock
                  code={section.content}
                  language={section.heading}
                  onExplain={onExplain}
                />
              ) : section.type === 'diagram' ? (
                <DiagramBlock
                  explanation={section.content}
                  onAskByte={onExplain}
                />
              ) : (
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {renderMarkdown(section.content, { showEmptyState: false })}
                </div>
              )}
              {section.image?.url && (() => {
                const align = section.image.alignment ?? 'center'
                const size = section.image.size ?? 'medium'
                const alignClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : align === 'full' ? 'w-full' : 'justify-center'
                const sizeClass = size === 'small' ? 'max-w-xs' : size === 'medium' ? 'max-w-md' : size === 'large' ? 'max-w-2xl' : 'w-full max-w-full'
                return (
                  <figure className={align !== 'full' ? `my-4 flex ${alignClass}` : 'my-4 w-full'}>
                    <span className={cn('block', sizeClass)}>
                      <img
                        src={section.image.url}
                        alt={section.image.alt ?? section.heading}
                        className="rounded-lg border border-border w-full h-auto"
                      />
                      {section.image.attribution && (
                        <figcaption className="text-xs text-muted-foreground mt-1">
                          {section.image.attribution}
                        </figcaption>
                      )}
                    </span>
                  </figure>
                )
              })()}
              {section.items && section.items.length > 0 && (
                <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
              {idx < content.sections.length - 1 && (
                <hr className="border-border/70 my-6" />
              )}
            </section>
          ))}

          {content.interactiveElements?.map((el, idx) => {
            if (el.type === 'expandable' && el.data?.title && el.data?.content) {
              return (
                <ExpandableBlock
                  key={idx}
                  title={String(el.data.title)}
                  content={String(el.data.content)}
                  renderMarkdown={renderMarkdown}
                />
              )
            }
            if (el.type === 'code-demo' && el.data?.code) {
              return (
                <CodeDemoBlock
                  key={idx}
                  code={String(el.data.code)}
                  language={el.data.language ? String(el.data.language) : 'code'}
                  onExplain={onExplain}
                />
              )
            }
            if (el.type === 'diagram' && el.data?.explanation) {
              return (
                <DiagramBlock
                  key={idx}
                  explanation={String(el.data.explanation)}
                  onAskByte={onExplain}
                />
              )
            }
            if (el.type === 'video' && el.data?.url) {
              const url = String(el.data.url).trim()
              const title = el.data?.title ? String(el.data.title) : 'Video'
              const isYouTube = /youtube\.com\/watch\?v=([^&]+)|youtu\.be\/([^?]+)/.exec(url)
              const isVimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url)
              const isDirect = /\.(mp4|webm|ogg)(\?|$)/i.test(url)
              if (isYouTube) {
                const id = isYouTube[1] || isYouTube[2]
                return (
                  <div key={idx} className="my-4 rounded-xl overflow-hidden border border-border bg-muted/30">
                    {title && <p className="px-4 py-2 text-sm font-medium text-card-foreground border-b border-border">{title}</p>}
                    <div className="aspect-video">
                      <iframe
                        title={title}
                        src={`https://www.youtube.com/embed/${id}`}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  </div>
                )
              }
              if (isVimeo) {
                return (
                  <div key={idx} className="my-4 rounded-xl overflow-hidden border border-border bg-muted/30">
                    {title && <p className="px-4 py-2 text-sm font-medium text-card-foreground border-b border-border">{title}</p>}
                    <div className="aspect-video">
                      <iframe
                        title={title}
                        src={`https://player.vimeo.com/video/${isVimeo[1]}`}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )
              }
              if (isDirect) {
                return (
                  <div key={idx} className="my-4 rounded-xl overflow-hidden border border-border bg-muted/30">
                    {title && <p className="px-4 py-2 text-sm font-medium text-card-foreground border-b border-border">{title}</p>}
                    <video controls className="w-full" src={url}>
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )
              }
              return (
                <div key={idx} className="my-4 p-4 rounded-xl border border-border bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{title}</a>
                  </p>
                </div>
              )
            }
            if (el.type === 'quiz' && el.data?.question && Array.isArray(el.data.options) && onQuizComplete && onAskByte) {
              const options = el.data.options as string[]
              const correctAnswer = String(el.data.correctAnswer ?? options[0])
              const correctIndex = options.findIndex((o) => String(o).trim() === correctAnswer.trim())
              const quiz = {
                questions: [
                  {
                    id: `rich-quiz-${idx}`,
                    question: String(el.data.question),
                    options,
                    correct: correctIndex >= 0 ? correctIndex : 0,
                    explanation: String(el.data.explanation ?? ''),
                    topic: '',
                  },
                ],
              }
              const quizMode = el.quizMode ?? 'standard'
              return (
                <div key={idx} className="my-6">
                  <QuizCard
                    quiz={quiz}
                    courseId={courseId}
                    moduleId={moduleId}
                    moduleTitle={moduleTitle}
                    learnerName={learnerName}
                    onComplete={onQuizComplete}
                    onAskByte={onAskByte}
                    onSkip={() => {}}
                    quizMode={quizMode}
                    peerWrongPercent={el.data.peerWrongPercent != null ? Number(el.data.peerWrongPercent) : undefined}
                  />
                </div>
              )
            }
            if (el.type === 'timeline' && Array.isArray(el.data?.steps)) {
              return (
                <div key={idx}>
                  <TimelineBlock steps={el.data.steps as { title: string; description: string; icon?: string }[]} />
                </div>
              )
            }
            if (el.type === 'flipcard' && Array.isArray(el.data?.cards)) {
              return (
                <div key={idx}>
                  <FlipcardBlock cards={el.data.cards as { front: string; back: string }[]} />
                </div>
              )
            }
            if (el.type === 'hotspot' && el.data?.imageUrl && Array.isArray(el.data?.spots)) {
              return (
                <div key={idx}>
                  <HotspotBlock
                    imageUrl={String(el.data.imageUrl)}
                    spots={el.data.spots as { x: number; y: number; label: string; content: string }[]}
                  />
                </div>
              )
            }
            if (el.type === 'matching' && Array.isArray(el.data?.pairs)) {
              return (
                <div key={idx}>
                  <MatchingBlock
                    pairs={el.data.pairs as { term: string; definition: string }[]}
                    instruction={el.data?.instruction != null ? String(el.data.instruction) : undefined}
                  />
                </div>
              )
            }
            if (el.type === 'tabs' && Array.isArray(el.data?.tabs)) {
              return (
                <div key={idx}>
                  <TabsBlock tabs={el.data.tabs as { label: string; content: string }[]} />
                </div>
              )
            }
            if (el.type === 'audio' && el.data?.url) {
              return (
                <div key={idx}>
                  <AudioBlock
                    url={String(el.data.url)}
                    title={el.data?.title != null ? String(el.data.title) : undefined}
                    transcript={el.data?.transcript != null ? String(el.data.transcript) : undefined}
                  />
                </div>
              )
            }
            if (el.type === 'flashcard' && Array.isArray(el.data?.cards)) {
              return (
                <div key={idx}>
                  <FlashcardBlock cards={el.data.cards as { front: string; back: string }[]} />
                </div>
              )
            }
            return null
          })}

          {content.exitState ? (
            <ExitStateBlock exit={content.exitState} renderMarkdown={renderMarkdown} />
          ) : content.summary ? (
            <div className="text-sm text-muted-foreground leading-relaxed">
              {renderMarkdown(content.summary, { showEmptyState: false })}
            </div>
          ) : null}
        </div>

        {hasSideCard && content.sideCard && (
          <div className="lg:sticky lg:top-4">
            <SideCardBlock
              title={content.sideCard.title}
              content={content.sideCard.content}
              tips={content.sideCard.tips}
              noteType={content.sideCard.noteType}
            />
          </div>
        )}
      </div>
    </div>
  )
}
