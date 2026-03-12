'use client'

import { GripVertical, Trash2, Plus, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditorBlockTimeline } from '@/types/content'
import { createNewTimelineStep } from '@/lib/contentBlocks'

function TimelineEditorInner({
  data,
  onUpdate,
  disabled,
}: {
  data: EditorBlockTimeline['data']
  onUpdate: (data: EditorBlockTimeline['data']) => void
  disabled?: boolean
}) {
  const steps = data.steps ?? []
  const updateStep = (index: number, patch: Partial<{ title: string; description: string; icon: string }>) => {
    const next = [...steps]
    next[index] = { ...next[index], ...patch }
    onUpdate({ steps: next })
  }
  const addStep = () => onUpdate({ steps: [...steps, createNewTimelineStep()] })
  const removeStep = (index: number) => {
    const next = steps.filter((_, i) => i !== index)
    onUpdate({ steps: next })
  }
  return (
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <ListOrdered className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="text-xs text-slate-500">Timeline</span>
      </div>
      {steps.map((step, idx) => (
        <div key={step.id} className="rounded border border-slate-700 bg-slate-900/60 p-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500">Step {idx + 1}</span>
            {!disabled && (
              <button type="button" onClick={() => removeStep(idx)} className="text-slate-500 hover:text-red-400 text-xs">
                Remove
              </button>
            )}
          </div>
          <input
            type="text"
            value={step.title}
            onChange={(e) => updateStep(idx, { title: e.target.value })}
            disabled={disabled}
            placeholder="Step title"
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          />
          <textarea
            value={step.description}
            onChange={(e) => updateStep(idx, { description: e.target.value })}
            disabled={disabled}
            placeholder="Description"
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={addStep}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-dashed border-slate-700"
        >
          <Plus className="w-3 h-3" /> Add step
        </button>
      )}
    </div>
  )
}

export function TimelineBlockRow({
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
  block: EditorBlockTimeline
  onUpdate: (data: EditorBlockTimeline['data']) => void
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
      <TimelineEditorInner data={block.data} onUpdate={onUpdate} disabled={disabled} />
      {!disabled && (
        <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
