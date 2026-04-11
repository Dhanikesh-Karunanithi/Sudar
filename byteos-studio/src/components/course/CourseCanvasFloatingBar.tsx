'use client'

import { useCallback, useMemo, useRef } from 'react'
import { AlignCenter, ImageIcon, PanelRight, Search, Upload, X } from 'lucide-react'
import type { ImageAlignment, ImageSize, ModuleContent } from '@/types/content'
import { isRichContent } from '@/types/content'
import { patchRichSection } from '@/lib/courseModulePatch'
import { parseContentRegionKey } from '@/components/course/CourseWysiwygInspector'
import type { CourseContentRegionKey } from '@/components/course/CourseModuleContent'
import { cn } from '@/lib/utils'

const SIZES: ImageSize[] = ['small', 'medium', 'large', 'full']
const ALIGNS: ImageAlignment[] = ['left', 'center', 'right', 'full']

function nextSize(current: ImageSize | undefined): ImageSize {
  const c = current ?? 'medium'
  const i = SIZES.indexOf(c)
  return SIZES[(i + 1) % SIZES.length]
}

function nextAlign(current: ImageAlignment | undefined): ImageAlignment {
  const c = current ?? 'center'
  const i = ALIGNS.indexOf(c)
  return ALIGNS[(i + 1) % ALIGNS.length]
}

export interface CourseCanvasFloatingBarProps {
  activeKey: CourseContentRegionKey | null
  content: ModuleContent | null | undefined
  courseId?: string
  onContentChange: (next: ModuleContent) => void
  onClearSelection: () => void
  className?: string
}

export function CourseCanvasFloatingBar({
  activeKey,
  content,
  courseId,
  onContentChange,
  onClearSelection,
  className,
}: CourseCanvasFloatingBarProps) {
  const parsed = useMemo(() => parseContentRegionKey(activeKey), [activeKey])
  const uploadRef = useRef<HTMLInputElement>(null)

  const sectionIndex = parsed.kind === 'section' ? parsed.index : -1
  const section =
    parsed.kind === 'section' && isRichContent(content) ? content.sections?.[sectionIndex] : undefined

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !content || !isRichContent(content) || sectionIndex < 0) return
      try {
        const form = new FormData()
        form.set('file', file)
        if (courseId) form.set('course_id', courseId)
        const res = await fetch('/api/media/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Upload failed')
        const url = data.url as string
        const alt = file.name.replace(/\.[^.]+$/, '')
        const prev = content.sections?.[sectionIndex]?.image
        onContentChange(
          patchRichSection(content, sectionIndex, {
            image: {
              url,
              alt: prev?.alt || alt,
              attribution: prev?.attribution ?? 'Uploaded',
              alignment: prev?.alignment,
              size: prev?.size,
            },
          })
        )
      } catch {
        // silent
      }
    },
    [content, courseId, onContentChange, sectionIndex]
  )

  if (!activeKey || parsed.kind === 'none' || parsed.kind === 'empty') return null

  return (
    <div
      className={cn(
        'pointer-events-auto z-20 mx-auto flex max-w-full flex-wrap items-center justify-center gap-1 rounded-2xl border border-white/[0.08] bg-zinc-950/95 px-2 py-2 shadow-lg shadow-black/40 backdrop-blur-md',
        className
      )}
      role="toolbar"
      aria-label="Canvas actions"
    >
      <button
        type="button"
        onClick={onClearSelection}
        className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
      >
        <X className="h-3.5 w-3.5" />
        Clear
      </button>

      <span className="hidden text-[10px] text-zinc-600 sm:inline">Details on the right →</span>

      <button
        type="button"
        onClick={() => document.getElementById('course-wysiwyg-inspector')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
        className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 xl:hidden"
      >
        <PanelRight className="h-3.5 w-3.5" />
        Inspector
      </button>

      {parsed.kind === 'section' && isRichContent(content) && section && (
        <>
          <input
            ref={uploadRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            aria-hidden
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.06]"
          >
            <Upload className="h-3.5 w-3.5" />
            Replace
          </button>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('section-image-search-trigger')
              el?.click()
            }}
            className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.06]"
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </button>
          {section?.image?.url ? (
            <>
              <button
                type="button"
                onClick={() =>
                  onContentChange(
                    patchRichSection(content, sectionIndex, {
                      image: {
                        ...section.image!,
                        size: nextSize(section.image?.size),
                      },
                    })
                  )
                }
                className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.06]"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Size
              </button>
              <button
                type="button"
                onClick={() =>
                  onContentChange(
                    patchRichSection(content, sectionIndex, {
                      image: {
                        ...section.image!,
                        alignment: nextAlign(section.image?.alignment),
                      },
                    })
                  )
                }
                className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.06]"
              >
                <AlignCenter className="h-3.5 w-3.5" />
                Align
              </button>
              <button
                type="button"
                onClick={() => onContentChange(patchRichSection(content, sectionIndex, { image: undefined }))}
                className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-red-400/90 transition-colors hover:bg-red-500/10"
              >
                Remove image
              </button>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
