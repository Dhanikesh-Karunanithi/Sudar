'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Image, FileText, ChevronDown, CircleHelp, Sparkles, Loader2, Search, X, Upload, Video, ListOrdered, LayoutList, Mic, Layers, Shuffle, ImageIcon, AlignLeft, AlignCenter, AlignRight, Maximize2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModuleContent, EditorBlock, EditorBlockType, ImageAlignment, ImageSize } from '@/types/content'
import {
  contentToMainTextAndBlocks,
  mainTextAndBlocksToContent,
  createNewBlock,
} from '@/lib/contentBlocks'
import { TimelineBlockRow } from '@/components/content/blocks/TimelineEditor'
import { FlipcardBlockRow } from '@/components/content/blocks/FlipcardEditor'
import { HotspotBlockRow } from '@/components/content/blocks/HotspotEditor'
import { MatchingBlockRow } from '@/components/content/blocks/MatchingEditor'
import { TabsBlockRow } from '@/components/content/blocks/TabsEditor'
import { AudioBlockRow } from '@/components/content/blocks/AudioEditor'
import { FlashcardBlockRow } from '@/components/content/blocks/FlashcardEditor'

export interface ModuleBlockEditorProps {
  content: ModuleContent | null | undefined
  onContentChange: (content: ModuleContent) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  courseId?: string
}

function BlockRow({
  block,
  onUpdate,
  onRemove,
  disabled,
  onOpenImageSearch,
  onRequestImageUpload,
  onRequestAudioUpload,
  uploadLoading,
}: {
  block: EditorBlock
  onUpdate: (data: EditorBlock['data']) => void
  onRemove: () => void
  disabled?: boolean
  onOpenImageSearch?: (onSelected: (url: string, alt?: string) => void) => void
  onRequestImageUpload?: (onSelected: (url: string) => void) => void
  onRequestAudioUpload?: (onSelected: (url: string) => void) => void
  uploadLoading?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  if (block.type === 'text') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex gap-2 rounded-lg border border-slate-700 bg-slate-800/60 p-2',
          isDragging && 'opacity-80 z-50'
        )}
      >
        <button
          type="button"
          className="cursor-grab touch-none p-1 text-slate-500 hover:text-slate-400 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <textarea
            value={block.data.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            onBlur={(e) => onUpdate({ content: e.target.value })}
            disabled={disabled}
            placeholder="Paragraph text..."
            rows={2}
            className="flex-1 bg-transparent text-slate-200 text-sm focus:outline-none resize-none placeholder-slate-500"
          />
        </div>
        {!disabled && (
          <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  if (block.type === 'image') {
    const alignment = (block.data.alignment ?? 'center') as ImageAlignment
    const size = (block.data.size ?? 'medium') as ImageSize
    const alignments: { value: ImageAlignment; icon: React.ReactNode; label: string }[] = [
      { value: 'left', icon: <AlignLeft className="w-3.5 h-3.5" />, label: 'Left' },
      { value: 'center', icon: <AlignCenter className="w-3.5 h-3.5" />, label: 'Center' },
      { value: 'right', icon: <AlignRight className="w-3.5 h-3.5" />, label: 'Right' },
      { value: 'full', icon: <Maximize2 className="w-3.5 h-3.5" />, label: 'Full width' },
    ]
    const sizes: { value: ImageSize; label: string }[] = [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
      { value: 'full', label: 'Full' },
    ]
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex gap-2 rounded-lg border border-slate-700 bg-slate-800/60 p-2',
          isDragging && 'opacity-80 z-50'
        )}
      >
        <button
          type="button"
          className="cursor-grab touch-none p-1 text-slate-500 hover:text-slate-400 rounded shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Image className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500">Image</span>
          </div>
          {/* Preview: show media thumbnail and link to view */}
          {block.data.url ? (
            <div className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/80 p-2">
              <a
                href={block.data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 block w-20 h-20 rounded-md overflow-hidden bg-slate-800 border border-slate-700 relative"
                title="View full image"
              >
                <img
                  src={block.data.url}
                  alt={block.data.alt ?? 'Preview'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    el.style.display = 'none'
                    const fallback = el.parentElement?.querySelector('.image-block-fallback') as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div className="image-block-fallback absolute inset-0 flex items-center justify-center bg-slate-800 hidden">
                  <Image className="w-8 h-8 text-slate-600" />
                </div>
              </a>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <a
                  href={block.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300"
                >
                  View media <ExternalLink className="w-3 h-3" />
                </a>
                <input
                  type="url"
                  value={block.data.url}
                  onChange={(e) => onUpdate({ ...block.data, url: e.target.value })}
                  onBlur={(e) => onUpdate({ ...block.data, url: e.target.value })}
                  disabled={disabled}
                  placeholder="Image URL"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={block.data.alt ?? ''}
                  onChange={(e) => onUpdate({ ...block.data, alt: e.target.value })}
                  onBlur={(e) => onUpdate({ ...block.data, alt: e.target.value })}
                  disabled={disabled}
                  placeholder="Alt text"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <input
                type="url"
                value={block.data.url}
                onChange={(e) => onUpdate({ ...block.data, url: e.target.value })}
                onBlur={(e) => onUpdate({ ...block.data, url: e.target.value })}
                disabled={disabled}
                placeholder="Image URL"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={block.data.alt ?? ''}
                onChange={(e) => onUpdate({ ...block.data, alt: e.target.value })}
                onBlur={(e) => onUpdate({ ...block.data, alt: e.target.value })}
                disabled={disabled}
                placeholder="Alt text"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
          {/* Position (alignment) and size */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-700/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Position</span>
            <div className="flex rounded-md border border-slate-700 overflow-hidden">
              {alignments.map(({ value, icon, label }) => (
                <button
                  key={value}
                  type="button"
                  title={label}
                  onClick={() => onUpdate({ ...block.data, alignment: value })}
                  disabled={disabled}
                  className={cn(
                    'p-1.5 transition-colors',
                    alignment === value ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider ml-2">Size</span>
            <select
              value={size}
              onChange={(e) => onUpdate({ ...block.data, size: e.target.value as ImageSize })}
              disabled={disabled}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-[11px] focus:outline-none focus:border-indigo-500"
            >
              {sizes.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        {!disabled && (
          <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  if (block.type === 'expandable') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex gap-2 rounded-lg border border-slate-700 bg-slate-800/60 p-2',
          isDragging && 'opacity-80 z-50'
        )}
      >
        <button
          type="button"
          className="cursor-grab touch-none p-1 text-slate-500 hover:text-slate-400 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500">Expandable</span>
          </div>
          <input
            type="text"
            value={block.data.title}
            onChange={(e) => onUpdate({ ...block.data, title: e.target.value })}
            onBlur={(e) => onUpdate({ ...block.data, title: e.target.value })}
            disabled={disabled}
            placeholder="Title"
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          />
          <textarea
            value={block.data.content}
            onChange={(e) => onUpdate({ ...block.data, content: e.target.value })}
            onBlur={(e) => onUpdate({ ...block.data, content: e.target.value })}
            disabled={disabled}
            placeholder="Content (hidden until expanded)"
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
        {!disabled && (
          <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  if (block.type === 'quiz') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex gap-2 rounded-lg border border-slate-700 bg-slate-800/60 p-2',
          isDragging && 'opacity-80 z-50'
        )}
      >
        <button
          type="button"
          className="cursor-grab touch-none p-1 text-slate-500 hover:text-slate-400 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <CircleHelp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-xs text-slate-500">Quiz block — use “Generate quiz” below to add questions.</span>
        </div>
        {!disabled && (
          <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  if (block.type === 'video') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex gap-2 rounded-lg border border-slate-700 bg-slate-800/60 p-2',
          isDragging && 'opacity-80 z-50'
        )}
      >
        <button
          type="button"
          className="cursor-grab touch-none p-1 text-slate-500 hover:text-slate-400 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <Video className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500">Video</span>
          </div>
          <input
            type="url"
            value={block.data.url}
            onChange={(e) => onUpdate({ ...block.data, url: e.target.value })}
            onBlur={(e) => onUpdate({ ...block.data, url: e.target.value })}
            disabled={disabled}
            placeholder="YouTube, Vimeo, or direct video URL"
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            value={block.data.title ?? ''}
            onChange={(e) => onUpdate({ ...block.data, title: e.target.value })}
            onBlur={(e) => onUpdate({ ...block.data, title: e.target.value })}
            disabled={disabled}
            placeholder="Optional title"
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
        {!disabled && (
          <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  if (block.type === 'timeline') {
    return (
      <TimelineBlockRow
        block={block}
        onUpdate={(data) => onUpdate(data)}
        onRemove={onRemove}
        disabled={disabled}
        setNodeRef={setNodeRef}
        style={style}
        isDragging={isDragging}
        attributes={attributes}
        listeners={listeners}
      />
    )
  }
  if (block.type === 'flipcard') {
    return (
      <FlipcardBlockRow
        block={block}
        onUpdate={(data) => onUpdate(data)}
        onRemove={onRemove}
        disabled={disabled}
        setNodeRef={setNodeRef}
        style={style}
        isDragging={isDragging}
        attributes={attributes}
        listeners={listeners}
      />
    )
  }
  if (block.type === 'hotspot') {
    return (
      <HotspotBlockRow
        block={block}
        onUpdate={(data) => onUpdate(data)}
        onRemove={onRemove}
        disabled={disabled}
        setNodeRef={setNodeRef}
        style={style}
        isDragging={isDragging}
        attributes={attributes}
        listeners={listeners}
        onOpenImageSearch={onOpenImageSearch}
        onRequestImageUpload={onRequestImageUpload}
      />
    )
  }
  if (block.type === 'matching') {
    return (
      <MatchingBlockRow
        block={block}
        onUpdate={(data) => onUpdate(data)}
        onRemove={onRemove}
        disabled={disabled}
        setNodeRef={setNodeRef}
        style={style}
        isDragging={isDragging}
        attributes={attributes}
        listeners={listeners}
      />
    )
  }
  if (block.type === 'tabs') {
    return (
      <TabsBlockRow
        block={block}
        onUpdate={(data) => onUpdate(data)}
        onRemove={onRemove}
        disabled={disabled}
        setNodeRef={setNodeRef}
        style={style}
        isDragging={isDragging}
        attributes={attributes}
        listeners={listeners}
      />
    )
  }
  if (block.type === 'audio') {
    return (
      <AudioBlockRow
        block={block}
        onUpdate={(data) => onUpdate(data)}
        onRemove={onRemove}
        disabled={disabled}
        setNodeRef={setNodeRef}
        style={style}
        isDragging={isDragging}
        attributes={attributes}
        listeners={listeners}
        onRequestAudioUpload={onRequestAudioUpload}
        uploadLoading={uploadLoading}
      />
    )
  }
  if (block.type === 'flashcard') {
    return (
      <FlashcardBlockRow
        block={block}
        onUpdate={(data) => onUpdate(data)}
        onRemove={onRemove}
        disabled={disabled}
        setNodeRef={setNodeRef}
        style={style}
        isDragging={isDragging}
        attributes={attributes}
        listeners={listeners}
      />
    )
  }

  return null
}

export function ModuleBlockEditor({
  content,
  onContentChange,
  disabled = false,
  placeholder = 'Write your module content here, or use blocks below...',
  className,
  courseId,
}: ModuleBlockEditorProps) {
  const [mainText, setMainText] = useState(() => contentToMainTextAndBlocks(content).mainText)
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => contentToMainTextAndBlocks(content).blocks)
  const prevContentRef = useRef<string>('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string; start: number; end: number } | null>(null)
  const [assistLoading, setAssistLoading] = useState(false)
  const mainTextareaRef = useRef<HTMLTextAreaElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [mediaSearchOpen, setMediaSearchOpen] = useState(false)
  const [mediaQuery, setMediaQuery] = useState('')
  const [mediaSource, setMediaSource] = useState<'google' | 'pexels' | 'unsplash'>('pexels')
  const [mediaResults, setMediaResults] = useState<{ url: string; thumbnailUrl?: string; alt?: string; attribution?: string }[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [videoSearchOpen, setVideoSearchOpen] = useState(false)
  const [videoQuery, setVideoQuery] = useState('')
  const [videoResults, setVideoResults] = useState<{ url: string; thumbnailUrl?: string; title?: string; attribution?: string }[]>([])
  const [videoLoading, setVideoLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingContentRef = useRef<ModuleContent | null>(null)
  const hotspotImageCallbackRef = useRef<((url: string, alt?: string) => void) | null>(null)
  const hotspotUploadCallbackRef = useRef<((url: string) => void) | null>(null)
  const audioUploadCallbackRef = useRef<((url: string) => void) | null>(null)
  const audioUploadInputRef = useRef<HTMLInputElement>(null)

  const DEBOUNCE_MS = 350
  const scheduleDebouncedFlush = useCallback(
    (nextContent: ModuleContent) => {
      pendingContentRef.current = nextContent
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        if (pendingContentRef.current) {
          onContentChange(pendingContentRef.current)
          pendingContentRef.current = null
        }
        debounceTimerRef.current = null
      }, DEBOUNCE_MS)
    },
    [onContentChange]
  )
  const flushNow = useCallback(
    (nextContent: ModuleContent) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      pendingContentRef.current = null
      onContentChange(nextContent)
    },
    [onContentChange]
  )

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const serialized = JSON.stringify(content ?? null)
    if (serialized !== prevContentRef.current) {
      prevContentRef.current = serialized
      const { mainText: m, blocks: b } = contentToMainTextAndBlocks(content)
      setMainText(m)
      setBlocks(b)
    }
  }, [content])

  useEffect(() => {
    if (!mediaSearchOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMediaSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mediaSearchOpen])

  useEffect(() => {
    if (!videoSearchOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVideoSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [videoSearchOpen])

  const handleMainTextBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const v = e.target.value
      setMainText(v)
      onContentChange(mainTextAndBlocksToContent(v, blocks))
    },
    [blocks, onContentChange]
  )

  const addBlock = useCallback(
    (type: EditorBlockType) => {
      const next = [...blocks, createNewBlock(type)]
      setBlocks(next)
      scheduleDebouncedFlush(mainTextAndBlocksToContent(mainText, next))
    },
    [mainText, blocks, scheduleDebouncedFlush]
  )

  const insertImageBlock = useCallback(
    (data: { url: string; alt?: string; attribution?: string }) => {
      const newBlock = createNewBlock('image')
      if (newBlock.type === 'image') {
        newBlock.data = { url: data.url, alt: data.alt ?? '', attribution: data.attribution ?? '' }
      }
      const next = [...blocks, newBlock]
      setBlocks(next)
      scheduleDebouncedFlush(mainTextAndBlocksToContent(mainText, next))
    },
    [mainText, blocks, scheduleDebouncedFlush]
  )

  const insertVideoBlock = useCallback(
    (data: { url: string; title?: string; attribution?: string }) => {
      const newBlock = createNewBlock('video')
      if (newBlock.type === 'video') {
        newBlock.data = { url: data.url, title: data.title ?? data.attribution ?? '' }
      }
      const next = [...blocks, newBlock]
      setBlocks(next)
      scheduleDebouncedFlush(mainTextAndBlocksToContent(mainText, next))
    },
    [mainText, blocks, scheduleDebouncedFlush]
  )

  const updateBlock = useCallback(
    (index: number, data: EditorBlock['data']) => {
      const next = blocks.map((b, i) => (i === index ? { ...b, data } : b)) as EditorBlock[]
      setBlocks(next)
      scheduleDebouncedFlush(mainTextAndBlocksToContent(mainText, next))
    },
    [mainText, blocks, scheduleDebouncedFlush]
  )

  const removeBlock = useCallback(
    (index: number) => {
      const next = blocks.filter((_, i) => i !== index)
      setBlocks(next)
      flushNow(mainTextAndBlocksToContent(mainText, next))
    },
    [mainText, blocks, flushNow]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = blocks.findIndex((b) => b.id === active.id)
      const newIndex = blocks.findIndex((b) => b.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const next = arrayMove(blocks, oldIndex, newIndex)
      setBlocks(next)
      flushNow(mainTextAndBlocksToContent(mainText, next))
    },
    [mainText, blocks, flushNow]
  )

  useEffect(() => {
    if (!contextMenu) return
    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (contextMenuRef.current?.contains(target) || mainTextareaRef.current?.contains(target)) return
      setContextMenu(null)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [contextMenu])

  const handleMainContextMenu = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget
    const start = ta.selectionStart
    const end = ta.selectionEnd
    if (start === end) return
    const text = mainText.slice(start, end)
    if (!text.trim()) return
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, text, start, end })
  }, [mainText])

  const handleAssistEdit = useCallback(
    async (instruction: string) => {
      if (!contextMenu || assistLoading) return
      setAssistLoading(true)
      try {
        const res = await fetch('/api/ai/assist-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contextMenu.text, instruction }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Assist failed')
        const revised = data.revised as string
        const newMainText = mainText.slice(0, contextMenu.start) + revised + mainText.slice(contextMenu.end)
        setMainText(newMainText)
        onContentChange(mainTextAndBlocksToContent(newMainText, blocks))
      } catch {
        // Error could be shown via toast; for now just close
      } finally {
        setContextMenu(null)
        setAssistLoading(false)
      }
    },
    [contextMenu, mainText, blocks, onContentChange, assistLoading]
  )

  const runMediaSearch = useCallback(async () => {
    if (!mediaQuery.trim()) return
    setMediaLoading(true)
    setMediaResults([])
    try {
      const res = await fetch(
        `/api/media/search?q=${encodeURIComponent(mediaQuery.trim())}&source=${mediaSource}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Search failed')
      setMediaResults(Array.isArray(data) ? data : [])
    } catch {
      setMediaResults([])
    } finally {
      setMediaLoading(false)
    }
  }, [mediaQuery, mediaSource])

  const runVideoSearch = useCallback(async () => {
    if (!videoQuery.trim()) return
    setVideoLoading(true)
    setVideoResults([])
    try {
      const res = await fetch(
        `/api/media/search-videos?q=${encodeURIComponent(videoQuery.trim())}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Video search failed')
      setVideoResults(Array.isArray(data) ? data : [])
    } catch {
      setVideoResults([])
    } finally {
      setVideoLoading(false)
    }
  }, [videoQuery])

  const handleUploadImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || disabled) return
      setUploadLoading(true)
      try {
        const form = new FormData()
        form.set('file', file)
        if (courseId) form.set('course_id', courseId)
        const res = await fetch('/api/media/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Upload failed')
        const url = data.url as string
        const alt = file.name.replace(/\.[^.]+$/, '')
        if (hotspotUploadCallbackRef.current) {
          hotspotUploadCallbackRef.current(url)
          hotspotUploadCallbackRef.current = null
        } else {
          insertImageBlock({ url, alt, attribution: 'Uploaded' })
        }
      } catch {
        // Error could be shown via toast
      } finally {
        setUploadLoading(false)
      }
    },
    [courseId, disabled, insertImageBlock]
  )

  const openImageSearchForHotspot = useCallback((onSelected: (url: string, alt?: string) => void) => {
    hotspotImageCallbackRef.current = onSelected
    setMediaSearchOpen(true)
  }, [])

  const requestImageUploadForHotspot = useCallback((onSelected: (url: string) => void) => {
    hotspotUploadCallbackRef.current = onSelected
    uploadInputRef.current?.click()
  }, [])

  const handleAudioUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || disabled) return
      setUploadLoading(true)
      try {
        const form = new FormData()
        form.set('file', file)
        if (courseId) form.set('course_id', courseId)
        const res = await fetch('/api/media/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Upload failed')
        const url = data.url as string
        if (audioUploadCallbackRef.current) {
          audioUploadCallbackRef.current(url)
          audioUploadCallbackRef.current = null
        }
      } catch {
        // Error could be shown via toast
      } finally {
        setUploadLoading(false)
      }
    },
    [courseId, disabled]
  )

  const requestAudioUploadForBlock = useCallback((onSelected: (url: string) => void) => {
    audioUploadCallbackRef.current = onSelected
    audioUploadInputRef.current?.click()
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  return (
    <div className={cn('space-y-3', className)}>
      <textarea
        ref={mainTextareaRef}
        value={mainText}
        onChange={(e) => setMainText(e.target.value)}
        onBlur={handleMainTextBlur}
        onContextMenu={handleMainContextMenu}
        disabled={disabled}
        rows={10}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm p-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-none leading-relaxed font-mono"
      />

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[160px] py-1 rounded-lg border border-slate-700 bg-slate-800 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <p className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-700">Improve with AI</p>
          {[
            { label: 'Improve clarity', instruction: 'improve clarity' },
            { label: 'Shorten', instruction: 'shorten' },
            { label: 'Expand', instruction: 'expand with more detail' },
            { label: 'Simplify', instruction: 'simplify language' },
          ].map(({ label, instruction }) => (
            <button
              key={instruction}
              type="button"
              disabled={assistLoading}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAssistEdit(instruction) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-60"
            >
              {assistLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Sparkles className="w-3.5 h-3.5 shrink-0 text-violet-400" />}
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Add block:</span>
        <div className="flex gap-1 flex-wrap">
          {(
            [
              { type: 'text' as const, label: 'Text', icon: FileText },
              { type: 'image' as const, label: 'Image', icon: Image },
              { type: 'expandable' as const, label: 'Expandable', icon: ChevronDown },
              { type: 'quiz' as const, label: 'Quiz', icon: CircleHelp },
              { type: 'video' as const, label: 'Video', icon: Video },
              { type: 'timeline' as const, label: 'Timeline', icon: ListOrdered },
              { type: 'flipcard' as const, label: 'Flip card', icon: LayoutList },
              { type: 'hotspot' as const, label: 'Hotspot', icon: ImageIcon },
              { type: 'matching' as const, label: 'Matching', icon: Shuffle },
              { type: 'tabs' as const, label: 'Tabs', icon: LayoutList },
              { type: 'audio' as const, label: 'Audio', icon: Mic },
              { type: 'flashcard' as const, label: 'Flashcard', icon: Layers },
            ] as const
          ).map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              disabled={disabled}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              <Icon className="w-3 h-3" />{label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMediaSearchOpen(true)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all"
          >
            <Search className="w-3 h-3" />Search image
          </button>
          <button
            type="button"
            onClick={() => setVideoSearchOpen(true)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <Video className="w-3 h-3" />Search video
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleUploadImage}
          />
          <input
            ref={audioUploadInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,audio/mpeg,audio/wav,audio/ogg,audio/x-m4a,audio/mp4"
            className="hidden"
            onChange={handleAudioUpload}
          />
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            disabled={disabled || uploadLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-60"
          >
            {uploadLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Upload image
          </button>
        </div>
      </div>

      {mediaSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setMediaSearchOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white">Search image</h3>
              <button type="button" onClick={() => setMediaSearchOpen(false)} className="p-1 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {mediaSource === 'google' && (
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Powered by Google Images</p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mediaQuery}
                  onChange={(e) => setMediaQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runMediaSearch()}
                  placeholder="e.g. teamwork, office, chart..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={mediaSource}
                  onChange={(e) => setMediaSource(e.target.value as 'google' | 'pexels' | 'unsplash')}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="google">Google</option>
                  <option value="pexels">Pexels</option>
                  <option value="unsplash">Unsplash</option>
                </select>
                <button
                  type="button"
                  onClick={runMediaSearch}
                  disabled={mediaLoading || !mediaQuery.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white"
                >
                  {mediaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto max-h-[50vh] min-h-[120px]">
                {mediaResults.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (hotspotImageCallbackRef.current) {
                        hotspotImageCallbackRef.current(img.url, img.alt)
                        hotspotImageCallbackRef.current = null
                        setMediaSearchOpen(false)
                      } else {
                        insertImageBlock({ url: img.url, alt: img.alt, attribution: img.attribution })
                        setMediaSearchOpen(false)
                      }
                    }}
                    className="aspect-square rounded-lg border-2 border-slate-700 hover:border-indigo-500 overflow-hidden bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <img
                      src={img.thumbnailUrl ?? img.url}
                      alt={img.alt ?? ''}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              {mediaResults.length === 0 && !mediaLoading && mediaQuery.trim() && (
                <p className="text-xs text-slate-500 text-center py-4">No results. Try another query or source.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {videoSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setVideoSearchOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white">Search video (Pexels)</h3>
              <button type="button" onClick={() => setVideoSearchOpen(false)} className="p-1 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Powered by Pexels — free stock videos</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={videoQuery}
                  onChange={(e) => setVideoQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runVideoSearch()}
                  placeholder="e.g. teamwork, office, nature..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={runVideoSearch}
                  disabled={videoLoading || !videoQuery.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white"
                >
                  {videoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[50vh] min-h-[120px]">
                {videoResults.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      insertVideoBlock({ url: v.url, title: v.title, attribution: v.attribution })
                      setVideoSearchOpen(false)
                    }}
                    className="rounded-lg border-2 border-slate-700 hover:border-indigo-500 overflow-hidden bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
                  >
                    <div className="aspect-video bg-slate-800">
                      {v.thumbnailUrl ? (
                        <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <p className="p-2 text-[10px] text-slate-500 truncate" title={v.attribution ?? v.title}>
                      {v.attribution ?? v.title ?? 'Pexels video'}
                    </p>
                  </button>
                ))}
              </div>
              {videoResults.length === 0 && !videoLoading && videoQuery.trim() && (
                <p className="text-xs text-slate-500 text-center py-4">No videos found. Try another query or add PEXELS_API_KEY in .env.local.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {blocks.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-slate-500">Blocks (drag to reorder)</span>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {blocks.map((block, index) => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    onUpdate={(data) => updateBlock(index, data)}
                    onRemove={() => removeBlock(index)}
                    disabled={disabled}
                    onOpenImageSearch={openImageSearchForHotspot}
                    onRequestImageUpload={requestImageUploadForHotspot}
                    onRequestAudioUpload={requestAudioUploadForBlock}
                    uploadLoading={uploadLoading}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  )
}
