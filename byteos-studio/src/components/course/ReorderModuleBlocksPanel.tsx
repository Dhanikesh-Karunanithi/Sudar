'use client'

import { useCallback, useMemo } from 'react'
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
import { GripVertical } from 'lucide-react'
import type { ModuleContent, EditorBlock } from '@/types/content'
import { contentToMainTextAndBlocks, mainTextAndBlocksToContent } from '@/lib/contentBlocks'
import { cn } from '@/lib/utils'

function SortableRow({
  id,
  label,
}: {
  id: string
  label: string
}) {
  const { setNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-xs text-slate-300',
        isDragging && 'opacity-80 z-50'
      )}
    >
      <button type="button" className="cursor-grab touch-none p-0.5 text-slate-500" {...attributes} {...listeners}>
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <span className="truncate">{label}</span>
    </div>
  )
}

function blockLabel(b: EditorBlock): string {
  switch (b.type) {
    case 'text':
      return `Text — ${(b.data.content ?? '').slice(0, 40)}${(b.data.content?.length ?? 0) > 40 ? '…' : ''}`
    case 'image':
      return `Image — ${(b.data.url ?? '').slice(0, 36)}…`
    case 'expandable':
      return `Expandable — ${b.data.title || 'Untitled'}`
    case 'quiz':
      return 'Quiz block'
    case 'video':
      return `Video — ${b.data.title || b.data.url?.slice(0, 30)}`
    case 'timeline':
      return `Timeline (${b.data.steps?.length ?? 0} steps)`
    case 'flipcard':
      return `Flip cards (${b.data.cards?.length ?? 0})`
    case 'hotspot':
      return 'Hotspot'
    case 'matching':
      return 'Matching'
    case 'tabs':
      return 'Tabs'
    case 'audio':
      return `Audio — ${b.data.title || 'clip'}`
    case 'flashcard':
      return `Flashcards (${b.data.cards?.length ?? 0})`
    default:
      return 'Block'
  }
}

interface ReorderModuleBlocksPanelProps {
  content: ModuleContent | null | undefined
  onContentChange: (next: ModuleContent) => void
  disabled?: boolean
}

/** Reorder editor blocks (main narrative + interactive blocks) while preserving main markdown text. */
export function ReorderModuleBlocksPanel({ content, onContentChange, disabled }: ReorderModuleBlocksPanelProps) {
  const { mainText, blocks } = useMemo(() => contentToMainTextAndBlocks(content), [content])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id || disabled) return
      const oldIndex = blocks.findIndex((b) => b.id === active.id)
      const newIndex = blocks.findIndex((b) => b.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const next = arrayMove(blocks, oldIndex, newIndex)
      onContentChange(mainTextAndBlocksToContent(mainText, next))
    },
    [blocks, mainText, onContentChange, disabled]
  )

  if (blocks.length < 2) {
    return (
      <p className="text-[10px] text-slate-600 px-1">
        Add at least two blocks (or use the classic editor) to reorder.
      </p>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {blocks.map((b) => (
            <SortableRow key={b.id} id={b.id} label={blockLabel(b)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
