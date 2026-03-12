'use client'

import { useState, useRef, useEffect } from 'react'
import { GripVertical, Trash2, Plus, ImageIcon, Search, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditorBlockHotspot } from '@/types/content'

function HotspotEditorInner({
  data,
  onUpdate,
  disabled,
  onOpenImageSearch,
  onRequestImageUpload,
}: {
  data: EditorBlockHotspot['data']
  onUpdate: (data: EditorBlockHotspot['data']) => void
  disabled?: boolean
  onOpenImageSearch?: (onSelected: (url: string, alt?: string) => void) => void
  onRequestImageUpload?: (onSelected: (url: string) => void) => void
}) {
  const spots = data.spots ?? []
  const [editingSpotIndex, setEditingSpotIndex] = useState<number | null>(null)
  const [draggingSpotIndex, setDraggingSpotIndex] = useState<number | null>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const spotsRef = useRef(spots)
  const dataRef = useRef(data)
  spotsRef.current = spots
  dataRef.current = data

  const updateSpot = (index: number, patch: Partial<{ x: number; y: number; label: string; content: string }>) => {
    const next = [...spots]
    next[index] = { ...next[index], x: 0, y: 0, label: '', content: '', ...next[index], ...patch }
    onUpdate({ ...data, spots: next })
  }

  const addSpotAt = (x: number, y: number) => {
    const xPct = Math.max(0, Math.min(100, Number((x * 100).toFixed(1))))
    const yPct = Math.max(0, Math.min(100, Number((y * 100).toFixed(1))))
    onUpdate({ ...data, spots: [...spots, { x: xPct, y: yPct, label: '', content: '' }] })
  }

  const addSpot = () => onUpdate({ ...data, spots: [...spots, { x: 50, y: 50, label: '', content: '' }] })

  const removeSpot = (index: number) => {
    const next = spots.filter((_, i) => i !== index)
    onUpdate({ ...data, spots: next })
    if (editingSpotIndex === index) setEditingSpotIndex(null)
    else if (editingSpotIndex != null && editingSpotIndex > index) setEditingSpotIndex(editingSpotIndex - 1)
    setDraggingSpotIndex(null)
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !imageContainerRef.current) return
    const el = imageContainerRef.current
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    addSpotAt(x, y)
  }

  useEffect(() => {
    if (draggingSpotIndex == null) return
    const container = imageContainerRef.current
    if (!container) return
    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
      const s = spotsRef.current
      const d = dataRef.current
      const next = [...s]
      next[draggingSpotIndex] = { ...next[draggingSpotIndex], x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) }
      onUpdate({ ...d, spots: next })
    }
    const onUp = () => setDraggingSpotIndex(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [draggingSpotIndex, onUpdate])
  return (
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="text-xs text-slate-500">Image hotspot</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {!disabled && onRequestImageUpload && (
          <button
            type="button"
            onClick={() => onRequestImageUpload((url) => onUpdate({ ...data, imageUrl: url }))}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            <Upload className="w-3 h-3" /> Upload image
          </button>
        )}
        {!disabled && onOpenImageSearch && (
          <button
            type="button"
            onClick={() => onOpenImageSearch((url) => onUpdate({ ...data, imageUrl: url }))}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-indigo-300 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30"
          >
            <Search className="w-3 h-3" /> Search image
          </button>
        )}
      </div>
      <input
        type="url"
        value={data.imageUrl ?? ''}
        onChange={(e) => onUpdate({ ...data, imageUrl: e.target.value })}
        disabled={disabled}
        placeholder="Or paste an image URL"
        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
      />
      {data.imageUrl && (
        <div className="relative rounded border border-slate-700 overflow-hidden bg-slate-900 w-full">
          <div
            ref={imageContainerRef}
            className="relative w-full cursor-crosshair"
            style={{ minHeight: 120 }}
          >
            <img
              src={data.imageUrl}
              alt="Hotspot"
              className="w-full h-auto max-h-48 object-contain block pointer-events-none"
            />
            {!disabled && (
              <div
                className="absolute inset-0"
                aria-label="Click to add hotspot pin"
                onClick={handleImageClick}
              />
            )}
            {spots.map((spot, idx) => (
              <button
                key={idx}
                type="button"
                className={cn(
                  'absolute w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10',
                  'bg-indigo-600 border-indigo-400 text-white shadow',
                  draggingSpotIndex === idx && 'cursor-grabbing ring-2 ring-white',
                  editingSpotIndex === idx && 'ring-2 ring-amber-400'
                )}
                style={{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseDown={(e) => {
                  if (disabled) return
                  e.preventDefault()
                  e.stopPropagation()
                  setDraggingSpotIndex(idx)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (draggingSpotIndex != null) return
                  setEditingSpotIndex((prev) => (prev === idx ? null : idx))
                }}
                title={spot.label || `Spot ${idx + 1}`}
              >
                {idx + 1}
                {!disabled && (
                  <span
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSpot(idx)
                    }}
                    aria-label="Remove pin"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            ))}
          </div>
          {!disabled && (
            <p className="text-[10px] text-slate-500 px-2 py-1 border-t border-slate-700">
              Click image to add a pin · Drag pins to move · Click pin to edit below
            </p>
          )}
        </div>
      )}
      {/* List of spots: label + content for editing and accessibility */}
      {spots.map((spot, idx) => (
        <div key={idx} className="rounded border border-slate-700 bg-slate-900/60 p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              Spot {idx + 1} {data.imageUrl && `(${spot.x}%, ${spot.y}%)`}
            </span>
            {!disabled && (
              <button type="button" onClick={() => removeSpot(idx)} className="text-xs text-slate-500 hover:text-red-400">
                Remove
              </button>
            )}
          </div>
          <input
            type="text"
            value={spot.label}
            onChange={(e) => updateSpot(idx, { label: e.target.value })}
            disabled={disabled}
            placeholder="Label"
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          />
          <textarea
            value={spot.content}
            onChange={(e) => updateSpot(idx, { content: e.target.value })}
            disabled={disabled}
            placeholder="Content (shown on click)"
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs resize-none focus:outline-none focus:border-indigo-500"
          />
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={addSpot}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-dashed border-slate-700"
        >
          <Plus className="w-3 h-3" /> Add hotspot
        </button>
      )}
    </div>
  )
}

export function HotspotBlockRow({
  block,
  onUpdate,
  onRemove,
  disabled,
  setNodeRef,
  style,
  isDragging,
  attributes,
  listeners,
  onOpenImageSearch,
  onRequestImageUpload,
}: {
  block: EditorBlockHotspot
  onUpdate: (data: EditorBlockHotspot['data']) => void
  onRemove: () => void
  disabled?: boolean
  setNodeRef: (el: HTMLDivElement | null) => void
  style: React.CSSProperties
  isDragging: boolean
  attributes: Record<string, unknown>
  listeners: Record<string, unknown>
  onOpenImageSearch?: (onSelected: (url: string, alt?: string) => void) => void
  onRequestImageUpload?: (onSelected: (url: string) => void) => void
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
      <HotspotEditorInner
        data={block.data}
        onUpdate={onUpdate}
        disabled={disabled}
        onOpenImageSearch={onOpenImageSearch}
        onRequestImageUpload={onRequestImageUpload}
      />
      {!disabled && (
        <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
