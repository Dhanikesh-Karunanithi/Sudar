'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import NextImage from 'next/image'
import { AlignCenter, AlignLeft, AlignRight, Expand, ImageIcon, Loader2, Search, Trash2, Upload, X } from 'lucide-react'
import type { ImageAlignment, ImageSize, RichContentSection } from '@/types/content'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { cn } from '@/lib/utils'

const SIZE_OPTIONS: { value: ImageSize; label: string }[] = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
  { value: 'full', label: 'Full' },
]

const ALIGN_OPTIONS: { value: ImageAlignment; icon: typeof AlignLeft; label: string }[] = [
  { value: 'left', icon: AlignLeft, label: 'Left' },
  { value: 'center', icon: AlignCenter, label: 'Center' },
  { value: 'right', icon: AlignRight, label: 'Right' },
  { value: 'full', icon: Expand, label: 'Full width' },
]

export interface SectionImageInspectorProps {
  section: RichContentSection
  courseId?: string
  disabled?: boolean
  onImageChange: (next: RichContentSection['image']) => void
  className?: string
}

export function SectionImageInspector({
  section,
  courseId,
  disabled = false,
  onImageChange,
  className,
}: SectionImageInspectorProps) {
  const img = section.image
  const [urlDraft, setUrlDraft] = useState(img?.url ?? '')
  const [mediaSearchOpen, setMediaSearchOpen] = useState(false)
  const [mediaQuery, setMediaQuery] = useState('')
  const [mediaSource, setMediaSource] = useState<'google' | 'pexels' | 'unsplash'>('pexels')
  const [mediaResults, setMediaResults] = useState<
    { url: string; thumbnailUrl?: string; alt?: string; attribution?: string }[]
  >([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUrlDraft(img?.url ?? '')
  }, [img?.url])

  useEffect(() => {
    if (!mediaSearchOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMediaSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mediaSearchOpen])

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

  const applySearchPick = useCallback(
    (pick: { url: string; alt?: string; attribution?: string }) => {
      onImageChange({
        url: pick.url,
        alt: pick.alt ?? img?.alt,
        attribution: pick.attribution ?? img?.attribution,
        alignment: img?.alignment,
        size: img?.size,
      })
      setUrlDraft(pick.url)
      setMediaSearchOpen(false)
    },
    [img?.alt, img?.alignment, img?.attribution, img?.size, onImageChange]
  )

  const handleUpload = useCallback(
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
        onImageChange({
          url,
          alt: img?.alt || alt,
          attribution: img?.attribution ?? 'Uploaded',
          alignment: img?.alignment,
          size: img?.size,
        })
        setUrlDraft(url)
      } catch {
        // keep silent; parent may add toast later
      } finally {
        setUploadLoading(false)
      }
    },
    [courseId, disabled, img?.alignment, img?.alt, img?.attribution, img?.size, onImageChange]
  )

  const size = img?.size ?? 'medium'
  const alignment = img?.alignment ?? 'center'

  return (
    <div className={cn('space-y-3 rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-zinc-400">Section image</p>
        {img?.url ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onImageChange(undefined)
              setUrlDraft('')
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </button>
        ) : null}
      </div>

      {img?.url ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950">
          <NextImage
            src={img.url}
            alt={img.alt?.trim() ? img.alt : 'Section image'}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-zinc-950/80">
          <div className="flex flex-col items-center gap-1 text-zinc-500">
            <ImageIcon className="h-8 w-8 opacity-40" />
            <span className="text-[11px]">No image</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || uploadLoading}
          onClick={() => uploadInputRef.current?.click()}
          className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-800/80 px-3 py-2 text-[11px] font-medium text-zinc-200 transition-colors hover:bg-zinc-700/80 disabled:opacity-50"
        >
          {uploadLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Replace (upload)
        </button>
        <button
          id="section-image-search-trigger"
          type="button"
          disabled={disabled}
          onClick={() => setMediaSearchOpen(true)}
          className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-800/80 px-3 py-2 text-[11px] font-medium text-zinc-200 transition-colors hover:bg-zinc-700/80 disabled:opacity-50"
        >
          <Search className="h-3.5 w-3.5" />
          Search library
        </button>
      </div>

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        aria-hidden
        onChange={handleUpload}
      />

      <div className="space-y-1.5">
        <span className="text-[10px] text-zinc-500">Alt text</span>
        <input
          type="text"
          value={img?.alt ?? ''}
          disabled={disabled}
          onChange={(e) =>
            onImageChange(
              img?.url
                ? {
                    url: img.url,
                    alt: e.target.value,
                    attribution: img.attribution,
                    alignment: img.alignment,
                    size: img.size,
                  }
                : undefined
            )
          }
          placeholder="Describe the image for accessibility"
          className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/80 px-3 py-2 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] text-zinc-500">Attribution</span>
        <input
          type="text"
          value={img?.attribution ?? ''}
          disabled={disabled}
          onChange={(e) =>
            onImageChange(
              img?.url
                ? {
                    url: img.url,
                    alt: img.alt,
                    attribution: e.target.value,
                    alignment: img.alignment,
                    size: img.size,
                  }
                : undefined
            )
          }
          placeholder="Credit or source"
          className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/80 px-3 py-2 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] text-zinc-500">Size</span>
        <div className="flex rounded-xl border border-white/[0.06] p-0.5">
          {SIZE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              disabled={disabled || !img?.url}
              onClick={() =>
                onImageChange(
                  img?.url
                    ? {
                        url: img.url,
                        alt: img.alt,
                        attribution: img.attribution,
                        alignment: img.alignment,
                        size: value,
                      }
                    : undefined
                )
              }
              className={cn(
                'flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors',
                size === value ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300',
                (!img?.url || disabled) && 'opacity-40'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] text-zinc-500">Alignment</span>
        <div className="flex gap-1">
          {ALIGN_OPTIONS.map(({ value, icon: Icon, label: alabel }) => (
            <button
              key={value}
              type="button"
              title={alabel}
              disabled={disabled || !img?.url}
              onClick={() =>
                onImageChange(
                  img?.url
                    ? {
                        url: img.url,
                        alt: img.alt,
                        attribution: img.attribution,
                        alignment: value,
                        size: img.size,
                      }
                    : undefined
                )
              }
              className={cn(
                'flex flex-1 items-center justify-center rounded-xl border py-2 transition-colors',
                alignment === value
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-200'
                  : 'border-white/[0.06] text-zinc-500 hover:border-white/[0.12] hover:text-zinc-300',
                (!img?.url || disabled) && 'opacity-40'
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <details className="group">
        <summary className="cursor-pointer list-none text-[11px] font-medium text-zinc-500 [&::-webkit-details-marker]:hidden">
          <span className="underline-offset-2 hover:underline">Advanced — image URL</span>
        </summary>
        <div className="mt-2 space-y-2">
          <input
            type="url"
            value={urlDraft}
            disabled={disabled}
            onChange={(e) => setUrlDraft(e.target.value)}
            onBlur={() => {
              const v = urlDraft.trim()
              if (!v) {
                onImageChange(undefined)
                return
              }
              onImageChange({
                url: v,
                alt: img?.alt,
                attribution: img?.attribution,
                alignment: img?.alignment,
                size: img?.size,
              })
            }}
            placeholder="https://…"
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/80 px-3 py-2 font-mono text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <p className="text-[10px] leading-relaxed text-zinc-600">
            Paste a direct image URL. Replace and search set this automatically.
          </p>
        </div>
      </details>

      {mediaSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setMediaSearchOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-2xl border border-white/[0.08] bg-zinc-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
              <h3 className="text-sm font-semibold text-zinc-100">Search image</h3>
              <button
                type="button"
                onClick={() => setMediaSearchOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto p-4">
              {mediaSource === 'google' && (
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Powered by Google Images</p>
              )}
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={mediaQuery}
                  onChange={(e) => setMediaQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runMediaSearch()}
                  placeholder="e.g. teamwork, chart…"
                  className="min-w-[160px] flex-1 rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <select
                  value={mediaSource}
                  onChange={(e) => setMediaSource(e.target.value as 'google' | 'pexels' | 'unsplash')}
                  className="rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="google">Google</option>
                  <option value="pexels">Pexels</option>
                  <option value="unsplash">Unsplash</option>
                </select>
                <button
                  type="button"
                  onClick={runMediaSearch}
                  disabled={mediaLoading || !mediaQuery.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {mediaLoading ? (
                    <SudarInlineLoader size="sm" className="text-slate-500" starFill="var(--background)" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </button>
              </div>
              <div className="grid max-h-[50vh] min-h-[120px] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
                {mediaResults.map((im, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applySearchPick(im)}
                    className="aspect-square overflow-hidden rounded-xl border-2 border-white/[0.06] bg-zinc-800 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <NextImage
                      src={im.thumbnailUrl ?? im.url}
                      alt={im.alt?.trim() ? String(im.alt) : (im.attribution ?? 'Result')}
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
              {mediaResults.length === 0 && !mediaLoading && mediaQuery.trim() && (
                <p className="py-4 text-center text-xs text-zinc-500">No results. Try another query.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
