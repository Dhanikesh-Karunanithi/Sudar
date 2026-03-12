'use client'

import { GripVertical, Trash2, Plus, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditorBlockMatching } from '@/types/content'
import { createNewMatchingPair } from '@/lib/contentBlocks'

function MatchingEditorInner({
  data,
  onUpdate,
  disabled,
}: {
  data: EditorBlockMatching['data']
  onUpdate: (data: EditorBlockMatching['data']) => void
  disabled?: boolean
}) {
  const pairs = data.pairs ?? []
  const updatePair = (index: number, patch: Partial<{ term: string; definition: string }>) => {
    const next = [...pairs]
    next[index] = { ...next[index], ...patch }
    onUpdate({ ...data, pairs: next })
  }
  const addPair = () => onUpdate({ ...data, pairs: [...pairs, createNewMatchingPair()] })
  const removePair = (index: number) => {
    const next = pairs.filter((_, i) => i !== index)
    onUpdate({ ...data, pairs: next })
  }
  return (
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <Shuffle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="text-xs text-slate-500">Drag-and-drop matching</span>
      </div>
      <input
        type="text"
        value={data.instruction ?? ''}
        onChange={(e) => onUpdate({ ...data, instruction: e.target.value })}
        disabled={disabled}
        placeholder="Instruction (e.g. Match the terms to definitions)"
        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs focus:outline-none focus:border-indigo-500"
      />
      {pairs.map((pair, idx) => (
        <div key={pair.id} className="rounded border border-slate-700 bg-slate-900/60 p-2 space-y-1.5 grid grid-cols-2 gap-2">
          <input
            type="text"
            value={pair.term}
            onChange={(e) => updatePair(idx, { term: e.target.value })}
            disabled={disabled}
            placeholder="Term"
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            value={pair.definition}
            onChange={(e) => updatePair(idx, { definition: e.target.value })}
            disabled={disabled}
            placeholder="Definition"
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs focus:outline-none focus:border-indigo-500"
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => removePair(idx)}
              className="col-span-2 text-xs text-slate-500 hover:text-red-400"
            >
              Remove pair
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={addPair}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-dashed border-slate-700"
        >
          <Plus className="w-3 h-3" /> Add pair
        </button>
      )}
    </div>
  )
}

export function MatchingBlockRow({
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
  block: EditorBlockMatching
  onUpdate: (data: EditorBlockMatching['data']) => void
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
      <MatchingEditorInner data={block.data} onUpdate={onUpdate} disabled={disabled} />
      {!disabled && (
        <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
