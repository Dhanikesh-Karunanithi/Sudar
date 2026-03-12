'use client'

import { GripVertical, Trash2, Plus, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditorBlockFlashcard } from '@/types/content'
import { createNewCard } from '@/lib/contentBlocks'

function FlashcardEditorInner({
  data,
  onUpdate,
  disabled,
}: {
  data: EditorBlockFlashcard['data']
  onUpdate: (data: EditorBlockFlashcard['data']) => void
  disabled?: boolean
}) {
  const cards = data.cards ?? []
  const updateCard = (index: number, patch: Partial<{ front: string; back: string }>) => {
    const next = [...cards]
    next[index] = { ...next[index], ...patch }
    onUpdate({ cards: next })
  }
  const addCard = () => onUpdate({ cards: [...cards, createNewCard()] })
  const removeCard = (index: number) => {
    const next = cards.filter((_, i) => i !== index)
    onUpdate({ cards: next })
  }
  return (
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="text-xs text-slate-500">Flashcard deck</span>
      </div>
      {cards.map((card, idx) => (
        <div key={card.id} className="rounded border border-slate-700 bg-slate-900/60 p-2 space-y-1.5 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500">Front</span>
            <input
              type="text"
              value={card.front}
              onChange={(e) => updateCard(idx, { front: e.target.value })}
              disabled={disabled}
              placeholder="Front"
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500">Back</span>
            <input
              type="text"
              value={card.back}
              onChange={(e) => updateCard(idx, { back: e.target.value })}
              disabled={disabled}
              placeholder="Back"
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeCard(idx)}
              className="col-span-2 text-xs text-slate-500 hover:text-red-400"
            >
              Remove card
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={addCard}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-dashed border-slate-700"
        >
          <Plus className="w-3 h-3" /> Add card
        </button>
      )}
    </div>
  )
}

export function FlashcardBlockRow({
  block,
  onUpdate,
  onRemove,
  disabled,
  setNodeRef,
  style,
  isDragging,
  attributes,
  listeners,
}: {
  block: EditorBlockFlashcard
  onUpdate: (data: EditorBlockFlashcard['data']) => void
  onRemove: () => void
  disabled?: boolean
  setNodeRef: (el: HTMLDivElement | null) => void
  style: React.CSSProperties
  isDragging: boolean
  attributes: Record<string, unknown>
  listeners: Record<string, unknown>
}) {
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
      <FlashcardEditorInner data={block.data} onUpdate={onUpdate} disabled={disabled} />
      {!disabled && (
        <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
