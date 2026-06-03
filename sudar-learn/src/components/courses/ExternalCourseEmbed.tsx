'use client'

import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getExternalProviderMeta, resolveExternalEmbedUrl } from '@/lib/courses/externalProviders'
import { ExternalCourseLabel } from './ExternalCourseLabel'

function isYouTubeUrl(url: string): { videoId?: string; playlistId?: string } | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const list = parsed.searchParams.get('list')
      if (list) return { playlistId: list }
      const v = parsed.searchParams.get('v')
      if (v) return { videoId: v }
    }
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split(/[/?]/)[0]
      if (id) return { videoId: id }
    }
  } catch {
    return null
  }
  return null
}

export function ExternalCourseEmbed({
  title,
  externalProvider,
  externalUrl,
  embedUrl,
  className,
  minHeight = 'min-h-[min(70vh,720px)]',
  onView,
  onExternalClick,
}: {
  title: string
  externalProvider: string | null
  externalUrl: string | null
  embedUrl: string | null
  className?: string
  minHeight?: string
  onView?: () => void
  onExternalClick?: () => void
}) {
  const provider = getExternalProviderMeta(externalProvider)
  const src = resolveExternalEmbedUrl({ externalProvider, externalUrl, embedUrl })
  const [iframeBlocked, setIframeBlocked] = useState(false)

  useEffect(() => {
    onView?.()
  }, [onView])

  // Special handling for YouTube: use official embed format without sandbox for reliability
  const youtubeMatch = externalUrl ? isYouTubeUrl(externalUrl) : null
  const isYouTubeEmbed = externalProvider === 'youtube' || (src && src.includes('youtube.com/embed'))

  return (
    <div
      className={cn(
        'rounded-card-xl border-2 border-dashed border-amber-500/40 overflow-hidden bg-card',
        className,
      )}
    >
      <ExternalCourseLabel provider={externalProvider} variant="ribbon" />

      {src && !iframeBlocked ? (
        <div className={cn('relative w-full bg-black', minHeight)}>
          <iframe
            src={src}
            title={`${title} — ${provider.label}`}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="no-referrer"
            {...(isYouTubeEmbed
              ? {}
              : {
                  sandbox:
                    'allow-scripts allow-same-origin allow-popups allow-forms allow-presentation',
                })}
            onError={() => setIframeBlocked(true)}
          />
        </div>
      ) : (
        <div className={cn('flex flex-col items-center justify-center gap-4 p-8 md:p-12 bg-muted/25', minHeight)}>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {iframeBlocked
              ? `${provider.label} does not allow in-app embedding. Open the course on their site, then return to Sudar to mark complete.`
              : `This course is best viewed on ${provider.label}. Open it below, then mark complete in Sudar when finished.`}
          </p>
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-button transition-all"
              onClick={() => onExternalClick?.()}
            >
              Open on {provider.shortLabel}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}

      {src && !iframeBlocked && externalUrl && (
        <div className="px-4 py-3 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Viewing content from {provider.label} inside Sudar (external).
          </p>
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-90"
            onClick={() => onExternalClick?.()}
          >
            Open full site
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  )
}
