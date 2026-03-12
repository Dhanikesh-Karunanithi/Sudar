'use client'

import { useMemo, useState, useEffect } from 'react'
import { X, Image as ImageIcon, Video, Mic, ExternalLink } from 'lucide-react'
import { getCourseMedia, type CourseMedia, type CourseForMedia } from '@/lib/courseMedia'
import { cn } from '@/lib/utils'

export type ProjectMediaPeekTab = 'images' | 'video' | 'podcast'

export interface ProjectMediaPeekProps {
  open: boolean
  onClose: () => void
  course: CourseForMedia | null
  onScrollToVideoSection?: () => void
}

export function ProjectMediaPeek({
  open,
  onClose,
  course,
  onScrollToVideoSection,
}: ProjectMediaPeekProps) {
  const [activeTab, setActiveTab] = useState<ProjectMediaPeekTab>('images')
  const media = useMemo(() => (course ? getCourseMedia(course) : null), [course])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
          <h2 className="text-sm font-semibold text-white">Project media</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-700 shrink-0">
          {(['images', 'video', 'podcast'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-300 bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              )}
            >
              {tab === 'images' && <ImageIcon className="w-3.5 h-3.5" />}
              {tab === 'video' && <Video className="w-3.5 h-3.5" />}
              {tab === 'podcast' && <Mic className="w-3.5 h-3.5" />}
              {tab === 'images' && `Images (${media?.images.length ?? 0})`}
              {tab === 'video' && `Video (${media?.videoScenes.length ?? 0})`}
              {tab === 'podcast' && `Podcast (${media?.podcastSegments.length ?? 0})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {!media ? (
            <p className="text-sm text-slate-500">No course data.</p>
          ) : activeTab === 'images' ? (
            <ImagesTab media={media} />
          ) : activeTab === 'video' ? (
            <VideoTab
              scenes={media.videoScenes}
              onScrollToVideoSection={onScrollToVideoSection}
              onClose={onClose}
            />
          ) : (
            <PodcastTab
              segments={media.podcastSegments}
              onScrollToVideoSection={onScrollToVideoSection}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ImagesTab({ media }: { media: CourseMedia }) {
  if (media.images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
          <ImageIcon className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-sm font-medium text-slate-300">No images yet</p>
        <p className="text-xs text-slate-500 mt-1">Add images in your module content or use Search image in a module.</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {media.images.map((img, i) => (
        <div
          key={`${img.moduleId}-${i}-${img.url}`}
          className="rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden group"
        >
          <div className="aspect-square bg-slate-800 relative">
            <img
              src={img.url}
              alt={img.alt ?? ''}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.nextElementSibling
                if (fallback) (fallback as HTMLElement).style.display = 'flex'
              }}
            />
            <div
              className="absolute inset-0 hidden items-center justify-center bg-slate-800"
              aria-hidden
            >
              <ImageIcon className="w-8 h-8 text-slate-600" />
            </div>
          </div>
          <div className="p-2">
            <p className="text-[10px] text-slate-500 truncate" title={img.moduleTitle}>
              {img.moduleTitle}
            </p>
            <a
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 mt-0.5"
            >
              Open <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}

function VideoTab({
  scenes,
  onScrollToVideoSection,
  onClose,
}: {
  scenes: { sceneNumber: number; title: string; narration: string; audioDataURL?: string }[]
  onScrollToVideoSection?: () => void
  onClose: () => void
}) {
  if (scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
          <Video className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-sm font-medium text-slate-300">No video scenes yet</p>
        <p className="text-xs text-slate-500 mt-1">Enable &quot;Include video overview&quot; in Video &amp; Podcast to generate scenes.</p>
        {onScrollToVideoSection && (
          <button
            type="button"
            onClick={() => { onScrollToVideoSection(); onClose() }}
            className="mt-4 px-4 py-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-colors"
          >
            Go to Video &amp; Podcast
          </button>
        )}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {onScrollToVideoSection && (
        <button
          type="button"
          onClick={() => { onScrollToVideoSection(); onClose() }}
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          Regenerate or edit in Video &amp; Podcast →
        </button>
      )}
      <ul className="space-y-2">
        {scenes.map((s, i) => (
          <li
            key={i}
            className="rounded-lg border border-slate-700 bg-slate-800/60 p-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-slate-500 w-6">
                {s.sceneNumber}.
              </span>
              <span className="text-xs font-medium text-slate-200">
                {s.title || `Scene ${s.sceneNumber}`}
              </span>
              {s.audioDataURL && (
                <span className="text-[10px] text-green-500">Audio</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 pl-8">
              {s.narration || '—'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PodcastTab({
  segments,
  onScrollToVideoSection,
  onClose,
}: {
  segments: { speaker: string; text: string; audioDataURL?: string }[]
  onScrollToVideoSection?: () => void
  onClose: () => void
}) {
  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
          <Mic className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-sm font-medium text-slate-300">No podcast dialogue yet</p>
        <p className="text-xs text-slate-500 mt-1">Enable &quot;Include podcast&quot; in Video &amp; Podcast to generate segments.</p>
        {onScrollToVideoSection && (
          <button
            type="button"
            onClick={() => { onScrollToVideoSection(); onClose() }}
            className="mt-4 px-4 py-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-colors"
          >
            Go to Video &amp; Podcast
          </button>
        )}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {onScrollToVideoSection && (
        <button
          type="button"
          onClick={() => { onScrollToVideoSection(); onClose() }}
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          Regenerate or edit in Video &amp; Podcast →
        </button>
      )}
      <ul className="space-y-2">
        {segments.map((seg, i) => (
          <li
            key={i}
            className="rounded-lg border border-slate-700 bg-slate-800/60 p-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-slate-500 capitalize">
                {seg.speaker}:
              </span>
              {seg.audioDataURL && (
                <span className="text-[10px] text-green-500">Audio</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-3">
              {seg.text || '—'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
