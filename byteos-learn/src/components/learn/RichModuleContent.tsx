'use client'

import { useState } from 'react'
import { Code, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RichContent } from '@/types/content'
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
  renderMarkdown: (body: string) => React.ReactNode
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
  renderMarkdown: (body: string) => React.ReactNode
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
          {renderMarkdown(content)}
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

function SideCardBlock({ title, content, tips }: { title: string; content: string; tips?: string[] }) {
  return (
    <aside className="my-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
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
      {content.introduction && (
        <div className="text-sm text-muted-foreground leading-relaxed">
          {renderMarkdown(content.introduction)}
        </div>
      )}

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
                  {renderMarkdown(section.content)}
                </div>
              )}
              {section.image?.url && (
                <figure className="my-4">
                  <img
                    src={section.image.url}
                    alt={section.image.alt ?? section.heading}
                    className="rounded-lg border border-border max-w-full h-auto"
                  />
                  {section.image.attribution && (
                    <figcaption className="text-xs text-muted-foreground mt-1">
                      {section.image.attribution}
                    </figcaption>
                  )}
                </figure>
              )}
              {section.items && section.items.length > 0 && (
                <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
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

          {content.summary && (
            <div className="text-sm text-muted-foreground leading-relaxed">
              {renderMarkdown(content.summary)}
            </div>
          )}
        </div>

        {hasSideCard && content.sideCard && (
          <div className="lg:sticky lg:top-4">
            <SideCardBlock
              title={content.sideCard.title}
              content={content.sideCard.content}
              tips={content.sideCard.tips}
            />
          </div>
        )}
      </div>
    </div>
  )
}
