'use client'

import { useState } from 'react'
import Image from 'next/image'
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { renderStudioCourseMarkdown } from '@/lib/studioCourseMarkdown'
import { cn } from '@/lib/utils'
import type { ImageAlignment, ImageSize, RichContent, RichContentSection, RichInteractiveElement } from '@/types/content'
import { isRichContent, isScormContent } from '@/types/content'

export interface PreviewModule {
  id: string
  title: string
  content: {
    type: string
    body?: string
    sections?: RichContentSection[]
    introduction?: string
    summary?: string
    interactiveElements?: RichInteractiveElement[]
    sideCard?: unknown
  } | null
  order_index: number
  sim_scenario_id?: string | null
}

export interface PreviewCourse {
  id: string
  title: string
  description: string | null
  modules: PreviewModule[]
}

function sectionImageFigureClassName(image: {
  size?: ImageSize
  alignment?: ImageAlignment
}): string {
  const size = image.size ?? 'medium'
  const align = image.alignment ?? 'center'
  const width =
    size === 'small'
      ? 'max-w-xs'
      : size === 'medium'
        ? 'max-w-lg'
        : size === 'large'
          ? 'max-w-4xl'
          : 'w-full max-w-none'
  const placement =
    align === 'left'
      ? 'mr-auto'
      : align === 'right'
        ? 'ml-auto'
        : align === 'full'
          ? 'w-full max-w-none'
        : 'mx-auto'
  return cn('my-5 flex flex-col', width, placement)
}

export function renderMarkdown(body: string): React.ReactNode {
  return renderStudioCourseMarkdown(body)
}

function ExpandablePreview({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="my-3 rounded-xl border border-slate-700 overflow-hidden bg-slate-800/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left font-medium text-slate-200"
      >
        <span>{title}</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-700 text-sm text-slate-400">
          {renderMarkdown(content)}
        </div>
      )}
    </div>
  )
}

export type CourseContentRegionKey =
  | 'empty'
  | 'scorm'
  | 'text-body'
  | 'rich-intro'
  | `rich-section-${number}`
  | `rich-ix-${number}`
  | 'rich-summary'

export interface CourseModuleContentProps {
  module: PreviewModule
  /** Wrap each selectable region for WYSIWYG (outline, click). Default: no-op. */
  wrapRegion?: (key: CourseContentRegionKey, node: React.ReactNode) => React.ReactNode
  className?: string
}

export function CourseModuleContent({ module, wrapRegion, className }: CourseModuleContentProps) {
  const wrap = wrapRegion ?? ((_, node) => node)

  const content = module.content
  if (!content) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-slate-500', className)}>
        {wrap('empty', (
          <>
            <BookOpen className="w-10 h-10 opacity-50" />
            <p className="text-sm mt-2">No content yet</p>
          </>
        ))}
      </div>
    )
  }

  if (isScormContent(content)) {
    const proxyUrl = content.launch_url.startsWith('http')
      ? (() => {
          const m = content.launch_url.match(/\/course-media\/(.+)$/)
          return m ? `/api/scorm/${m[1]}` : content.launch_url
        })()
      : content.launch_url.startsWith('/api/scorm/')
        ? content.launch_url
        : `/api/scorm/${content.launch_url}`
    return wrap(
      'scorm',
      <div className={cn('w-full space-y-3', className)}>
        <div className="rounded-xl overflow-hidden border border-slate-700 bg-black" style={{ minHeight: '520px' }}>
          <iframe
            src={proxyUrl}
            className="w-full h-full"
            style={{ minHeight: '520px', border: 'none' }}
            allow="fullscreen"
            title="SCORM content preview"
          />
        </div>
        <p className="text-xs text-slate-500 text-center">
          SCORM {content.scorm_version ?? '1.2'} — packaged lesson. Extracted text for Sudar AI is editable in Studio
          below this preview.
        </p>
      </div>
    )
  }

  if (content.type === 'text' && typeof (content as { body?: string }).body === 'string') {
    const body = (content as { body: string }).body
    if (!body?.trim()) {
      return (
        <div className={cn('flex flex-col items-center justify-center py-16 text-muted-foreground', className)}>
          {wrap('empty', (
            <>
              <BookOpen className="w-10 h-10 opacity-50" />
              <p className="text-sm mt-2">No lesson text yet. Generate or edit this module in the course builder.</p>
            </>
          ))}
        </div>
      )
    }
    return (
      <div className={cn('prose prose-invert max-w-none text-[15px] leading-relaxed text-zinc-300', className)}>
        {wrap('text-body', <div>{renderMarkdown(body)}</div>)}
      </div>
    )
  }

  if (isRichContent(content)) {
    const rich = content as RichContent
    const entry = rich.entryState
    const exit = rich.exitState
    const side = rich.sideCard
    return (
      <div className={cn('space-y-6 text-[15px] leading-relaxed text-zinc-300', className)}>
        {entry?.content?.trim() ? (
          <div className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1.5">Lesson open</p>
            {renderMarkdown(entry.content)}
          </div>
        ) : null}
        {rich.introduction?.trim() ? (
          <div className="text-zinc-400">
            {wrap('rich-intro', <div>{renderMarkdown(rich.introduction)}</div>)}
          </div>
        ) : null}

        {rich.sections?.map((section, idx) => (
          <section key={idx}>
            {wrap(
              `rich-section-${idx}` as CourseContentRegionKey,
              <>
                {section.heading ? (
                  <h3 className="mt-6 mb-2 text-lg font-semibold tracking-tight text-zinc-100 first:mt-0">
                    {section.heading}
                  </h3>
                ) : null}
                <div className="text-zinc-400">{renderMarkdown(section.content)}</div>
                {section.image?.url && (
                  <figure className={cn(sectionImageFigureClassName(section.image), 'w-full')}>
                    <Image
                      src={section.image.url}
                      alt={section.image.alt ?? section.heading ?? 'Section image'}
                      width={800}
                      height={450}
                      className={cn(
                        'h-auto rounded-2xl border border-white/[0.08] shadow-sm',
                        (section.image.alignment ?? 'center') === 'full' ? 'w-full' : 'max-w-full'
                      )}
                      unoptimized
                    />
                    {section.image.attribution && (
                      <figcaption className="mt-2 text-xs text-zinc-500">{section.image.attribution}</figcaption>
                    )}
                  </figure>
                )}
              </>
            )}
          </section>
        ))}

        {rich.interactiveElements?.map((el, idx) => {
          const ixKey = `rich-ix-${idx}` as CourseContentRegionKey
          if (el.type === 'expandable' && el.data?.title && el.data?.content) {
            return (
              <div key={idx}>
                {wrap(
                  ixKey,
                  <ExpandablePreview title={String(el.data.title)} content={String(el.data.content)} />
                )}
              </div>
            )
          }
          if (el.type === 'quiz' && el.data?.question) {
            return (
              <div key={idx}>
                {wrap(
                  ixKey,
                  <div className="my-4 p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                    <p className="text-sm font-medium text-slate-200 mb-2">{String(el.data.question)}</p>
                    <p className="text-xs text-slate-500">Quiz (preview only)</p>
                  </div>
                )}
              </div>
            )
          }
          if (el.type === 'video' && el.data?.url) {
            const url = String(el.data.url).trim()
            const title = el.data?.title ? String(el.data.title) : 'Video'
            const isYouTube = /youtube\.com\/watch\?v=([^&]+)|youtu\.be\/([^?]+)/.exec(url)
            const isVimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url)
            const isDirect = /\.(mp4|webm|ogg)(\?|$)/i.test(url)
            if (isYouTube) {
              const yid = isYouTube[1] || isYouTube[2]
              return (
                <div key={idx}>
                  {wrap(
                    ixKey,
                    <div className="my-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50">
                      {title && (
                        <p className="px-4 py-2 text-sm font-medium text-slate-200 border-b border-slate-700">{title}</p>
                      )}
                      <div className="aspect-video">
                        <iframe
                          title={title}
                          src={`https://www.youtube.com/embed/${yid}`}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            }
            if (isVimeo) {
              return (
                <div key={idx}>
                  {wrap(
                    ixKey,
                    <div className="my-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50">
                      {title && (
                        <p className="px-4 py-2 text-sm font-medium text-slate-200 border-b border-slate-700">{title}</p>
                      )}
                      <div className="aspect-video">
                        <iframe
                          title={title}
                          src={`https://player.vimeo.com/video/${isVimeo[1]}`}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            }
            if (isDirect) {
              return (
                <div key={idx}>
                  {wrap(
                    ixKey,
                    <div className="my-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50">
                      {title && (
                        <p className="px-4 py-2 text-sm font-medium text-slate-200 border-b border-slate-700">{title}</p>
                      )}
                      <video controls className="w-full" src={url}>
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                </div>
              )
            }
            return (
              <div key={idx}>
                {wrap(
                  ixKey,
                  <div className="my-4 p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline">
                      {title}
                    </a>
                  </div>
                )}
              </div>
            )
          }
          if (el.type === 'timeline' && Array.isArray(el.data?.steps)) {
            const steps = el.data.steps as { title?: string; description?: string }[]
            return (
              <div key={idx}>
                {wrap(
                  ixKey,
                  <div className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Timeline</p>
                    <ul className="space-y-2">
                      {steps.slice(0, 5).map((s, i) => (
                        <li key={i} className="text-sm text-slate-300">
                          <span className="font-medium">{String(s?.title || 'Step')}</span>
                          {s?.description && (
                            <span className="text-slate-500 ml-2">— {String(s.description).slice(0, 60)}…</span>
                          )}
                        </li>
                      ))}
                      {steps.length > 5 && <li className="text-xs text-slate-500">+{steps.length - 5} more</li>}
                    </ul>
                  </div>
                )}
              </div>
            )
          }
          if (el.type === 'flipcard' && Array.isArray(el.data?.cards)) {
            const cards = el.data.cards as { front?: string; back?: string }[]
            return (
              <div key={idx}>
                {wrap(
                  ixKey,
                  <div className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Flip cards ({cards.length})</p>
                    <p className="text-sm text-slate-400">
                      Preview: first card — {String(cards[0]?.front || '').slice(0, 40)}…
                    </p>
                  </div>
                )}
              </div>
            )
          }
          if (el.type === 'hotspot' && el.data?.imageUrl) {
            const spots = (el.data.spots as { label?: string }[]) ?? []
            return (
              <div key={idx}>
                {wrap(
                  ixKey,
                  <div className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
                    <Image
                      src={String(el.data.imageUrl)}
                      alt="Hotspot image"
                      width={640}
                      height={288}
                      className="w-full max-h-48 object-contain bg-slate-900"
                      unoptimized
                    />
                    <p className="px-4 py-2 text-xs text-slate-500">Image hotspot ({spots.length} spots)</p>
                  </div>
                )}
              </div>
            )
          }
          if (el.type === 'matching' && Array.isArray(el.data?.pairs)) {
            return (
              <div key={idx}>
                {wrap(
                  ixKey,
                  <div className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      Matching ({(el.data.pairs as { term?: string }[]).length} pairs)
                    </p>
                    {el.data?.instruction != null && String(el.data.instruction) !== '' ? (
                      <p className="text-sm text-slate-400 mb-2">{String(el.data.instruction)}</p>
                    ) : null}
                  </div>
                )}
              </div>
            )
          }
          if (el.type === 'tabs' && Array.isArray(el.data?.tabs)) {
            const tabs = el.data.tabs as { label?: string }[]
            return (
              <div key={idx}>
                {wrap(
                  ixKey,
                  <div className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Tabs</p>
                    <div className="flex gap-2 flex-wrap">
                      {tabs.map((t, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs">
                          {String(t?.label || 'Tab')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          }
          if (el.type === 'audio' && el.data?.url) {
            return (
              <div key={idx}>
                {wrap(
                  ixKey,
                  <div className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      {el.data?.title ? String(el.data.title) : 'Audio'}
                    </p>
                    <audio controls src={String(el.data.url)} className="w-full mt-2" />
                  </div>
                )}
              </div>
            )
          }
          if (el.type === 'flashcard' && Array.isArray(el.data?.cards)) {
            const cards = el.data.cards as { front?: string }[]
            return (
              <div key={idx}>
                {wrap(
                  ixKey,
                  <div className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Flashcards ({cards.length})</p>
                    <p className="text-sm text-slate-400">Preview: {String(cards[0]?.front || '').slice(0, 50)}…</p>
                  </div>
                )}
              </div>
            )
          }
          return null
        })}

        {exit?.content?.trim() ? (
          <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent mb-1.5">Take forward</p>
            {renderMarkdown(exit.content)}
          </div>
        ) : null}

        {side?.title && side.content?.trim() ? (
          <aside className="rounded-xl border border-border bg-card/80 p-4 text-sm text-card-foreground">
            <p className="font-semibold text-foreground mb-2">{side.title}</p>
            <div className="text-muted-foreground">{renderMarkdown(side.content)}</div>
          </aside>
        ) : null}

        {rich.summary?.trim() ? (
          <div className="pt-4 border-t border-slate-700">
            <p className="text-sm font-medium text-slate-200 mb-2">Summary</p>
            {wrap('rich-summary', <div className="text-slate-400 text-sm">{renderMarkdown(rich.summary)}</div>)}
          </div>
        ) : null}
      </div>
    )
  }

  if (typeof content === 'object' && content !== null && 'type' in content) {
    const t = String((content as { type: unknown }).type)
    return (
      <div className={cn('rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground', className)}>
        <p>This module uses a format preview can’t render yet ({t}). Open the editor to view or edit it.</p>
      </div>
    )
  }

  return null
}
