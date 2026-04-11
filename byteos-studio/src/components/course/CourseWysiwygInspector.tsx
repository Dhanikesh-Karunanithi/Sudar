'use client'

import { useMemo } from 'react'
import type { ModuleContent } from '@/types/content'
import { isRichContent } from '@/types/content'
import {
  patchRichIntroduction,
  patchRichSection,
  patchRichInteractive,
  patchRichSummary,
  patchTextBody,
} from '@/lib/courseModulePatch'
import { contentToMainTextAndBlocks, mainTextAndBlocksToContent } from '@/lib/contentBlocks'
import { richInteractiveToEditorBlock, editorBlockToRichInteractive } from '@/lib/richInteractiveToEditorBlock'
import { ModuleBlockEditor } from '@/components/content/ModuleBlockEditor'
import type { CourseContentRegionKey } from '@/components/course/CourseModuleContent'
import { SectionImageInspector } from '@/components/course/SectionImageInspector'
import { cn } from '@/lib/utils'

export function parseContentRegionKey(
  key: CourseContentRegionKey | null
):
  | { kind: 'none' }
  | { kind: 'text-body' }
  | { kind: 'rich-intro' }
  | { kind: 'rich-summary' }
  | { kind: 'section'; index: number }
  | { kind: 'interactive'; index: number }
  | { kind: 'empty' | 'scorm' } {
  if (!key || key === 'empty') return { kind: 'empty' }
  if (key === 'scorm') return { kind: 'scorm' }
  if (key === 'text-body') return { kind: 'text-body' }
  if (key === 'rich-intro') return { kind: 'rich-intro' }
  if (key === 'rich-summary') return { kind: 'rich-summary' }
  const m = /^rich-section-(\d+)$/.exec(key)
  if (m) return { kind: 'section', index: Number(m[1]) }
  const m2 = /^rich-ix-(\d+)$/.exec(key)
  if (m2) return { kind: 'interactive', index: Number(m2[1]) }
  return { kind: 'none' }
}

interface CourseWysiwygInspectorProps {
  content: ModuleContent | null | undefined
  activeKey: CourseContentRegionKey | null
  onContentChange: (next: ModuleContent) => void
  courseId?: string
  className?: string
}

export function CourseWysiwygInspector({
  content,
  activeKey,
  onContentChange,
  courseId,
  className,
}: CourseWysiwygInspectorProps) {
  const parsed = useMemo(() => parseContentRegionKey(activeKey), [activeKey])

  const label = useMemo(() => {
    switch (parsed.kind) {
      case 'text-body':
        return 'Module text'
      case 'rich-intro':
        return 'Introduction'
      case 'rich-summary':
        return 'Summary'
      case 'section':
        return `Section ${parsed.index + 1}`
      case 'interactive':
        return `Interactive block ${parsed.index + 1}`
      case 'empty':
        return 'Add content'
      case 'scorm':
        return 'SCORM'
      default:
        return 'Select a region'
    }
  }, [parsed])

  if (!content) {
    return (
      <div className={cn('bg-transparent p-4 text-xs text-zinc-500', className)}>
        No content on this module yet.
      </div>
    )
  }

  if (parsed.kind === 'none' || parsed.kind === 'empty') {
    return (
      <div className={cn('space-y-2 bg-transparent p-4', className)}>
        <p className="text-[11px] font-medium text-zinc-500">Inspector</p>
        <p className="text-xs leading-relaxed text-zinc-400">Click a highlighted region on the canvas to edit it here.</p>
      </div>
    )
  }

  if (parsed.kind === 'scorm') {
    return (
      <div className={cn('bg-transparent p-4 text-xs text-zinc-500', className)}>
        SCORM packages are read-only in Studio. Replace the module or edit the title in the toolbar.
      </div>
    )
  }

  if (parsed.kind === 'text-body' && content.type === 'text') {
    return (
      <div className={cn('flex min-h-0 flex-col space-y-3 bg-transparent p-4', className)}>
        <p className="text-[11px] font-medium text-zinc-500">{label}</p>
        <textarea
          value={content.body ?? ''}
          onChange={(e) => onContentChange(patchTextBody(content, e.target.value))}
          rows={16}
          className="min-h-[200px] w-full flex-1 resize-none rounded-xl border border-white/[0.08] bg-zinc-900/80 p-3 font-mono text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          placeholder="Markdown: ## Heading, lists, **bold**…"
        />
        <p className="text-[10px] text-zinc-600">Saves as you type (debounced from parent).</p>
      </div>
    )
  }

  if (parsed.kind === 'rich-intro' && isRichContent(content)) {
    return (
      <div className={cn('space-y-3 bg-transparent p-4', className)}>
        <p className="text-[11px] font-medium text-zinc-500">{label}</p>
        <textarea
          value={content.introduction ?? ''}
          onChange={(e) => onContentChange(patchRichIntroduction(content, e.target.value))}
          rows={12}
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-zinc-900/80 p-3 font-mono text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          placeholder="Introduction (markdown)"
        />
      </div>
    )
  }

  if (parsed.kind === 'rich-summary' && isRichContent(content)) {
    return (
      <div className={cn('space-y-3 bg-transparent p-4', className)}>
        <p className="text-[11px] font-medium text-zinc-500">{label}</p>
        <textarea
          value={content.summary ?? ''}
          onChange={(e) => onContentChange(patchRichSummary(content, e.target.value))}
          rows={10}
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-zinc-900/80 p-3 font-mono text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          placeholder="Summary (markdown)"
        />
      </div>
    )
  }

  if (parsed.kind === 'section' && isRichContent(content)) {
    const sec = content.sections?.[parsed.index]
    if (!sec) {
      return (
        <div className={cn('bg-transparent p-4 text-xs text-amber-600', className)}>
          Section not found. Try refreshing.
        </div>
      )
    }
    return (
      <div className={cn('space-y-3 bg-transparent p-4', className)}>
        <p className="text-[11px] font-medium text-zinc-500">{label}</p>
        <label className="block space-y-1">
          <span className="text-[10px] text-zinc-500">Heading</span>
          <input
            type="text"
            value={sec.heading ?? ''}
            onChange={(e) =>
              onContentChange(patchRichSection(content, parsed.index, { heading: e.target.value }))
            }
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            placeholder="Optional section heading"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] text-zinc-500">Body (markdown)</span>
          <textarea
            value={sec.content ?? ''}
            onChange={(e) =>
              onContentChange(patchRichSection(content, parsed.index, { content: e.target.value }))
            }
            rows={10}
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-zinc-900/80 p-3 font-mono text-sm leading-relaxed text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          />
        </label>
        <SectionImageInspector
          section={sec}
          courseId={courseId}
          onImageChange={(image) => onContentChange(patchRichSection(content, parsed.index, { image }))}
        />
      </div>
    )
  }

  if (parsed.kind === 'interactive' && isRichContent(content)) {
    const el = content.interactiveElements?.[parsed.index]
    if (!el) {
      return (
        <div className={cn('bg-transparent p-4 text-xs text-amber-600', className)}>
          Interactive block not found.
        </div>
      )
    }
    const block = richInteractiveToEditorBlock(el, el._blockId ?? `ix-${parsed.index}`)
    if (!block) {
      return (
        <div className={cn('bg-transparent p-4 text-xs text-zinc-500', className)}>
          This interactive type cannot be edited in the inspector yet.
        </div>
      )
    }
    const synthetic = mainTextAndBlocksToContent('', [block])
    return (
      <div className={cn('min-h-0 space-y-2 overflow-y-auto bg-transparent p-4', className)}>
        <p className="text-[11px] font-medium text-zinc-500">{label}</p>
        <ModuleBlockEditor
          content={synthetic}
          blocksOnly
          courseId={courseId}
          onContentChange={(c) => {
            const { blocks } = contentToMainTextAndBlocks(c)
            const b = blocks[0]
            if (!b) return
            const nextIx = editorBlockToRichInteractive(el, b)
            onContentChange(patchRichInteractive(content, parsed.index, nextIx))
          }}
        />
      </div>
    )
  }

  return (
    <div className={cn('bg-transparent p-4 text-xs text-zinc-500', className)}>
      Select a region on the canvas.
    </div>
  )
}
