'use client'

import { GripVertical, Trash2, Plus, LayoutList } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditorBlockTabs } from '@/types/content'
import { createNewTabItem } from '@/lib/contentBlocks'

function TabsEditorInner({
  data,
  onUpdate,
  disabled,
}: {
  data: EditorBlockTabs['data']
  onUpdate: (data: EditorBlockTabs['data']) => void
  disabled?: boolean
}) {
  const tabs = data.tabs ?? []
  const updateTab = (index: number, patch: Partial<{ label: string; content: string }>) => {
    const next = [...tabs]
    next[index] = { ...next[index], ...patch }
    onUpdate({ tabs: next })
  }
  const addTab = () => onUpdate({ tabs: [...tabs, createNewTabItem()] })
  const removeTab = (index: number) => {
    const next = tabs.filter((_, i) => i !== index)
    onUpdate({ tabs: next })
  }
  return (
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <LayoutList className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="text-xs text-slate-500">Tabs</span>
      </div>
      {tabs.map((tab, idx) => (
        <div key={tab.id} className="rounded border border-slate-700 bg-slate-900/60 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={tab.label}
              onChange={(e) => updateTab(idx, { label: e.target.value })}
              disabled={disabled}
              placeholder="Tab label"
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
            {!disabled && (
              <button type="button" onClick={() => removeTab(idx)} className="ml-2 text-xs text-slate-500 hover:text-red-400">
                Remove
              </button>
            )}
          </div>
          <textarea
            value={tab.content}
            onChange={(e) => updateTab(idx, { content: e.target.value })}
            disabled={disabled}
            placeholder="Tab content"
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs resize-none focus:outline-none focus:border-indigo-500"
          />
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={addTab}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-dashed border-slate-700"
        >
          <Plus className="w-3 h-3" /> Add tab
        </button>
      )}
    </div>
  )
}

export function TabsBlockRow({
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
  block: EditorBlockTabs
  onUpdate: (data: EditorBlockTabs['data']) => void
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
      <TabsEditorInner data={block.data} onUpdate={onUpdate} disabled={disabled} />
      {!disabled && (
        <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
