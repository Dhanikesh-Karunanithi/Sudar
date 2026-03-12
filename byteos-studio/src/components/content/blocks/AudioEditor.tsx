'use client'

import { useState } from 'react'
import { GripVertical, Trash2, Mic, Upload, Loader2, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditorBlockAudio } from '@/types/content'

interface AudioSearchResult {
  id: number
  name: string
  url: string
  duration: number
  attribution: string
  license?: string
}

export function AudioBlockRow({
  block,
  onUpdate,
  onRemove,
  disabled,
  setNodeRef,
  style,
  isDragging,
  attributes,
  listeners,
  onRequestAudioUpload,
  uploadLoading,
}: {
  block: EditorBlockAudio
  onUpdate: (data: EditorBlockAudio['data']) => void
  onRemove: () => void
  disabled?: boolean
  setNodeRef: (el: HTMLDivElement | null) => void
  style: React.CSSProperties
  isDragging: boolean
  attributes: Record<string, unknown>
  listeners: Record<string, unknown>
  onRequestAudioUpload?: (onSelected: (url: string) => void) => void
  uploadLoading?: boolean
}) {
  const [audioSearchOpen, setAudioSearchOpen] = useState(false)
  const [audioQuery, setAudioQuery] = useState('')
  const [audioResults, setAudioResults] = useState<AudioSearchResult[]>([])
  const [audioSearchLoading, setAudioSearchLoading] = useState(false)

  const runAudioSearch = async () => {
    if (!audioQuery.trim()) return
    setAudioSearchLoading(true)
    setAudioResults([])
    try {
      const res = await fetch(`/api/media/search-audio?q=${encodeURIComponent(audioQuery.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Search failed')
      setAudioResults(Array.isArray(data) ? data : [])
    } catch {
      setAudioResults([])
    } finally {
      setAudioSearchLoading(false)
    }
  }

  const selectAudioResult = (result: AudioSearchResult) => {
    onUpdate({ ...block.data, url: result.url })
    setAudioSearchOpen(false)
    setAudioQuery('')
    setAudioResults([])
  }

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
          <Mic className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-xs text-slate-500">Audio</span>
        </div>
        {!disabled && onRequestAudioUpload && (
          <button
            type="button"
            onClick={() => onRequestAudioUpload((url) => onUpdate({ ...block.data, url }))}
            disabled={uploadLoading}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-60"
          >
            {uploadLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Upload audio
          </button>
        )}
        {!disabled && (
          <button
            type="button"
            onClick={() => setAudioSearchOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-indigo-300 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30"
          >
            <Search className="w-3 h-3" /> Search audio
          </button>
        )}
        <input
          type="url"
          value={block.data.url}
          onChange={(e) => onUpdate({ ...block.data, url: e.target.value })}
          onBlur={(e) => onUpdate({ ...block.data, url: e.target.value })}
          disabled={disabled}
          placeholder="Audio URL (MP3, WAV, etc.) or upload above"
          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
        />
        {block.data.url && (
          <audio
            controls
            src={block.data.url}
            preload="metadata"
            className="w-full h-8"
          />
        )}
        <input
          type="text"
          value={block.data.title ?? ''}
          onChange={(e) => onUpdate({ ...block.data, title: e.target.value })}
          disabled={disabled}
          placeholder="Optional title"
          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs focus:outline-none focus:border-indigo-500"
        />
        <textarea
          value={block.data.transcript ?? ''}
          onChange={(e) => onUpdate({ ...block.data, transcript: e.target.value })}
          disabled={disabled}
          placeholder="Optional transcript"
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs resize-none"
        />
      </div>
      {audioSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setAudioSearchOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white">Search audio (Freesound)</h3>
              <button
                type="button"
                onClick={() => setAudioSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">CC0 sounds from Freesound.org</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={audioQuery}
                  onChange={(e) => setAudioQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runAudioSearch()}
                  placeholder="e.g. nature, click, notification..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={runAudioSearch}
                  disabled={audioSearchLoading || !audioQuery.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white"
                >
                  {audioSearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[50vh] min-h-[80px]">
                {audioResults.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/80 p-2"
                  >
                    <audio
                      controls
                      src={r.url}
                      preload="metadata"
                      className="h-8 flex-1 min-w-0 max-w-[200px]"
                      onPlay={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200 truncate" title={r.name}>
                        {r.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {r.duration.toFixed(1)}s · {r.attribution}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectAudioResult(r)}
                      className="shrink-0 px-3 py-1 rounded text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      Use
                    </button>
                  </div>
                ))}
                {audioResults.length === 0 && !audioSearchLoading && audioQuery.trim() && (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No results. Try another query or add FREESOUND_API_KEY to .env.local.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {!disabled && (
        <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
