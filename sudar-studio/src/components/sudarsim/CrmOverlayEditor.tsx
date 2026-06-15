'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, Trash2, Plus } from 'lucide-react'
import type { SimCrmSkin } from '@/types/sudarsim'

type Overlay = SimCrmSkin['overlays'][number]

const OVERLAY_TYPES: Overlay['type'][] = ['text_input', 'textarea', 'dropdown', 'button', 'search', 'readonly_field']

export function CrmOverlayEditor({
  skin,
  onChange,
  uploadScope = 'sudarsim',
  disabled,
}: {
  skin: SimCrmSkin | null
  onChange: (skin: SimCrmSkin) => void
  uploadScope?: string
  disabled?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  const uploadImage = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('course_id', uploadScope)
    const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) {
      onChange({
        image_url: data.url,
        width: 1920,
        height: 1080,
        overlays: skin?.overlays ?? [],
      })
    }
  }

  const addOverlay = (x: number, y: number) => {
    if (!skin) return
    const id = `ov_${Date.now()}`
    const overlay: Overlay = {
      id,
      type: 'text_input',
      x,
      y,
      w: 0.15,
      h: 0.04,
      label: 'Field',
      config: {},
      required_for_score: false,
    }
    onChange({ ...skin, overlays: [...skin.overlays, overlay] })
    setSelectedId(id)
  }

  const updateOverlay = (id: string, patch: Partial<Overlay>) => {
    if (!skin) return
    onChange({
      ...skin,
      overlays: skin.overlays.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })
  }

  const removeOverlay = (id: string) => {
    if (!skin) return
    onChange({ ...skin, overlays: skin.overlays.filter((o) => o.id !== id) })
    if (selectedId === id) setSelectedId(null)
  }

  useEffect(() => {
    if (!dragging || !skin) return
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = Math.max(0, Math.min(0.95, (e.clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(0.95, (e.clientY - rect.top) / rect.height))
      updateOverlay(dragging, { x, y })
    }
    const onUp = () => setDragging(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, skin])

  const selected = skin?.overlays.find((o) => o.id === selectedId)

  return (
    <div className="space-y-4">
      {!skin?.image_url ? (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-slate-600 p-8">
          <Upload className="h-8 w-8 text-slate-400" />
          <span className="text-sm text-slate-300">Upload CRM screenshot</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void uploadImage(f)
            }}
          />
        </label>
      ) : (
        <>
          <div
            ref={containerRef}
            className="relative mx-auto w-full max-w-4xl cursor-crosshair overflow-hidden rounded-lg border border-slate-700"
            style={{ aspectRatio: `${skin.width} / ${skin.height}` }}
            onClick={(e) => {
              if (disabled) return
              const rect = e.currentTarget.getBoundingClientRect()
              addOverlay((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height)
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={skin.image_url} alt="CRM" className="h-full w-full object-contain" />
            {skin.overlays.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`absolute rounded border-2 bg-violet-500/20 text-[10px] ${
                  selectedId === o.id ? 'border-violet-400' : 'border-violet-600/60'
                }`}
                style={{
                  left: `${o.x * 100}%`,
                  top: `${o.y * 100}%`,
                  width: `${o.w * 100}%`,
                  height: `${o.h * 100}%`,
                }}
                onClick={(ev) => {
                  ev.stopPropagation()
                  setSelectedId(o.id)
                }}
                onMouseDown={(ev) => {
                  ev.stopPropagation()
                  setDragging(o.id)
                }}
              >
                {o.label || o.type}
              </button>
            ))}
          </div>
          {selected ? (
            <div className="grid gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4 sm:grid-cols-2">
              <label className="text-xs text-slate-400">
                Label
                <input
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white"
                  value={selected.label}
                  onChange={(e) => updateOverlay(selected.id, { label: e.target.value })}
                />
              </label>
              <label className="text-xs text-slate-400">
                Type
                <select
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white"
                  value={selected.type}
                  onChange={(e) => updateOverlay(selected.id, { type: e.target.value as Overlay['type'] })}
                >
                  {OVERLAY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={selected.required_for_score}
                  onChange={(e) => updateOverlay(selected.id, { required_for_score: e.target.checked })}
                />
                Required for score
              </label>
              <button
                type="button"
                onClick={() => removeOverlay(selected.id)}
                className="flex items-center gap-1 text-xs text-red-400 sm:col-span-2"
              >
                <Trash2 className="h-3 w-3" /> Remove overlay
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-violet-400"
            onClick={() => addOverlay(0.5, 0.5)}
          >
            <Plus className="h-3 w-3" /> Add overlay at center
          </button>
        </>
      )}
    </div>
  )
}
