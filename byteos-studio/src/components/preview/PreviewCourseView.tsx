'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, Code } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RichContent, RichContentSection, RichInteractiveElement } from '@/types/content'
import { isRichContent, isScormContent } from '@/types/content'

export interface PreviewModule {
  id: string
  title: string
  content: { type: string; body?: string; sections?: RichContentSection[]; introduction?: string; summary?: string; interactiveElements?: RichInteractiveElement[]; sideCard?: unknown } | null
  order_index: number
}

export interface PreviewCourse {
  id: string
  title: string
  description: string | null
  modules: PreviewModule[]
}

interface Props {
  course: PreviewCourse
}

function renderMarkdown(body: string): React.ReactNode {
  if (!body?.trim()) return null
  const lines = body.split('\n')
  const out: React.ReactNode[] = []
  let i = 0
  let key = 0
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (!t) { i++; continue }
    if (t.startsWith('## ')) {
      out.push(<h2 key={key++} className="text-xl font-bold text-slate-200 mt-6 mb-2 pb-2 border-b border-slate-700">{t.slice(3)}</h2>)
      i++; continue
    }
    if (t.startsWith('### ')) {
      out.push(<h3 key={key++} className="text-lg font-semibold text-slate-200 mt-4 mb-1.5">{t.slice(4)}</h3>)
      i++; continue
    }
    if (t.startsWith('- ') || t.startsWith('* ')) {
      const items: React.ReactNode[] = []
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(<li key={i} className="text-slate-400 text-sm leading-relaxed">{lines[i].trim().slice(2)}</li>)
        i++
      }
      out.push(<ul key={key++} className="list-disc list-inside my-2 space-y-1 text-slate-400">{items}</ul>)
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
        <div key={key++} className="my-3 rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
            <Code className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500 font-mono">{lang || 'code'}</span>
          </div>
          <pre className="p-3 overflow-x-auto text-slate-300 text-sm font-mono">{codeLines.join('\n')}</pre>
        </div>
      )
      i++
      continue
    }
    out.push(<p key={key++} className="text-slate-400 text-sm leading-relaxed my-2">{t}</p>)
    i++
  }
  return <div className="space-y-0.5">{out}</div>
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

function ModuleContentDisplay({ module }: { module: PreviewModule }) {
  const content = module.content
  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <BookOpen className="w-10 h-10 opacity-50" />
        <p className="text-sm mt-2">No content yet</p>
      </div>
    )
  }
  if (isScormContent(content)) {
    const proxyUrl = content.launch_url.startsWith('http')
      ? (() => { const m = content.launch_url.match(/\/course-media\/(.+)$/); return m ? `/api/scorm/${m[1]}` : content.launch_url })()
      : content.launch_url.startsWith('/api/scorm/') ? content.launch_url
      : `/api/scorm/${content.launch_url}`
    return (
      <div className="w-full space-y-3">
        <div className="rounded-xl overflow-hidden border border-slate-700 bg-black" style={{ minHeight: '520px' }}>
          <iframe
            src={proxyUrl}
            className="w-full h-full"
            style={{ minHeight: '520px', border: 'none' }}
            allow="fullscreen"
            title="SCORM content preview"
          />
        </div>
        <p className="text-xs text-slate-500 text-center">SCORM {content.scorm_version ?? '1.2'} — Interactive module</p>
      </div>
    )
  }
  if (content.type === 'text' && typeof (content as { body?: string }).body === 'string') {
    const body = (content as { body: string }).body
    return <div className="prose prose-invert max-w-none">{renderMarkdown(body)}</div>
  }
  if (isRichContent(content)) {
    const rich = content as RichContent
    return (
      <div className="space-y-6">
        {rich.introduction && (
          <div className="text-slate-400 text-sm leading-relaxed">{renderMarkdown(rich.introduction)}</div>
        )}
        {rich.sections?.map((section, idx) => (
          <section key={idx}>
            {section.heading ? <h3 className="text-lg font-semibold text-slate-200 mt-6 mb-2 first:mt-0">{section.heading}</h3> : null}
            <div className="text-slate-400 text-sm leading-relaxed">{renderMarkdown(section.content)}</div>
            {section.image?.url && (
              <figure className="my-4 relative w-full">
                <Image
                  src={section.image.url}
                  alt={section.image.alt ?? section.heading ?? 'Section image'}
                  width={800}
                  height={450}
                  className="rounded-lg border border-slate-700 max-w-full h-auto"
                  unoptimized
                />
                {section.image.attribution && (
                  <figcaption className="text-xs text-slate-500 mt-1">{section.image.attribution}</figcaption>
                )}
              </figure>
            )}
          </section>
        ))}
        {rich.interactiveElements?.map((el, idx) => {
          if (el.type === 'expandable' && el.data?.title && el.data?.content) {
            return (
              <ExpandablePreview
                key={idx}
                title={String(el.data.title)}
                content={String(el.data.content)}
              />
            )
          }
          if (el.type === 'quiz' && el.data?.question) {
            return (
              <div key={idx} className="my-4 p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                <p className="text-sm font-medium text-slate-200 mb-2">{String(el.data.question)}</p>
                <p className="text-xs text-slate-500">Quiz (preview only)</p>
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
              const id = isYouTube[1] || isYouTube[2]
              return (
                <div key={idx} className="my-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50">
                  {title && <p className="px-4 py-2 text-sm font-medium text-slate-200 border-b border-slate-700">{title}</p>}
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
                <div key={idx} className="my-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50">
                  {title && <p className="px-4 py-2 text-sm font-medium text-slate-200 border-b border-slate-700">{title}</p>}
                  <div className="aspect-video">
                    <iframe title={title} src={`https://player.vimeo.com/video/${isVimeo[1]}`} className="w-full h-full" allowFullScreen />
                  </div>
                </div>
              )
            }
            if (isDirect) {
              return (
                <div key={idx} className="my-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50">
                  {title && <p className="px-4 py-2 text-sm font-medium text-slate-200 border-b border-slate-700">{title}</p>}
                  <video controls className="w-full" src={url}>Your browser does not support the video tag.</video>
                </div>
              )
            }
            return (
              <div key={idx} className="my-4 p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline">{title}</a>
              </div>
            )
          }
          if (el.type === 'timeline' && Array.isArray(el.data?.steps)) {
            const steps = el.data.steps as { title?: string; description?: string }[]
            return (
              <div key={idx} className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Timeline</p>
                <ul className="space-y-2">
                  {steps.slice(0, 5).map((s, i) => (
                    <li key={i} className="text-sm text-slate-300">
                      <span className="font-medium">{String(s?.title || 'Step')}</span>
                      {s?.description && <span className="text-slate-500 ml-2">— {String(s.description).slice(0, 60)}…</span>}
                    </li>
                  ))}
                  {steps.length > 5 && <li className="text-xs text-slate-500">+{steps.length - 5} more</li>}
                </ul>
              </div>
            )
          }
          if (el.type === 'flipcard' && Array.isArray(el.data?.cards)) {
            const cards = el.data.cards as { front?: string; back?: string }[]
            return (
              <div key={idx} className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Flip cards ({cards.length})</p>
                <p className="text-sm text-slate-400">Preview: first card — {String(cards[0]?.front || '').slice(0, 40)}…</p>
              </div>
            )
          }
          if (el.type === 'hotspot' && el.data?.imageUrl) {
            const spots = (el.data.spots as { label?: string }[]) ?? []
            return (
              <div key={idx} className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
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
            )
          }
          if (el.type === 'matching' && Array.isArray(el.data?.pairs)) {
            const pairs = el.data.pairs as { term?: string }[]
            return (
              <div key={idx} className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Matching ({pairs.length} pairs)</p>
                {el.data?.instruction != null && String(el.data.instruction) !== '' ? <p className="text-sm text-slate-400 mb-2">{String(el.data.instruction)}</p> : null}
              </div>
            )
          }
          if (el.type === 'tabs' && Array.isArray(el.data?.tabs)) {
            const tabs = el.data.tabs as { label?: string }[]
            return (
              <div key={idx} className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Tabs</p>
                <div className="flex gap-2 flex-wrap">
                  {tabs.map((t, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs">{String(t?.label || 'Tab')}</span>
                  ))}
                </div>
              </div>
            )
          }
          if (el.type === 'audio' && el.data?.url) {
            return (
              <div key={idx} className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs font-medium text-slate-500 mb-2">{el.data?.title ? String(el.data.title) : 'Audio'}</p>
                <audio controls src={String(el.data.url)} className="w-full mt-2" />
              </div>
            )
          }
          if (el.type === 'flashcard' && Array.isArray(el.data?.cards)) {
            const cards = el.data.cards as { front?: string }[]
            return (
              <div key={idx} className="my-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Flashcards ({cards.length})</p>
                <p className="text-sm text-slate-400">Preview: {String(cards[0]?.front || '').slice(0, 50)}…</p>
              </div>
            )
          }
          return null
        })}
        {rich.summary && (
          <div className="pt-4 border-t border-slate-700">
            <p className="text-sm font-medium text-slate-200 mb-2">Summary</p>
            <div className="text-slate-400 text-sm">{renderMarkdown(rich.summary)}</div>
          </div>
        )}
      </div>
    )
  }
  return null
}

export function PreviewCourseView({ course }: Props) {
  const [activeId, setActiveId] = useState<string | null>(course.modules[0]?.id ?? null)
  const activeModule = course.modules.find((m) => m.id === activeId) ?? course.modules[0]

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside className="w-64 border-r border-slate-800 flex flex-col shrink-0 bg-slate-900">
        <div className="p-4 border-b border-slate-800">
          <Link
            href={`/courses/${course.id}`}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to edit
          </Link>
        </div>
        <div className="p-3 flex-1 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Preview</p>
          <p className="text-slate-300 font-medium text-sm truncate" title={course.title}>
            {course.title}
          </p>
          {course.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
          )}
          <nav className="mt-4 space-y-0.5">
            {course.modules.map((mod, idx) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveId(mod.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  activeId === mod.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
              >
                <span className="text-slate-600 mr-1.5">{idx + 1}.</span>
                {mod.title}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8 max-w-3xl">
        {activeModule ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">{activeModule.title}</h1>
            <ModuleContentDisplay module={activeModule} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <BookOpen className="w-12 h-12 opacity-50" />
            <p className="text-sm mt-3">No modules yet. Add modules in the editor.</p>
          </div>
        )}
      </main>
    </div>
  )
}
