'use client'

import { useState, useEffect, useRef } from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getExternalProviderMeta,
  providerAllowsInAppEmbed,
  resolveExternalEmbedUrl,
} from '@/lib/courses/externalProviders'
import { ExternalCourseLabel } from './ExternalCourseLabel'

const IFRAME_LOAD_TIMEOUT_MS = 8000

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
  const canEmbedInApp = providerAllowsInAppEmbed(externalProvider) && Boolean(src)
  const [iframeBlocked, setIframeBlocked] = useState(!canEmbedInApp)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onView?.()
  }, [onView])

  useEffect(() => {
    if (!canEmbedInApp || iframeBlocked) return

    loadTimerRef.current = setTimeout(() => {
      if (!iframeLoaded) {
        setIframeBlocked(true)
      }
    }, IFRAME_LOAD_TIMEOUT_MS)

    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current)
    }
  }, [canEmbedInApp, iframeBlocked, iframeLoaded, src])

  const isYouTubeEmbed =
    externalProvider === 'youtube' || (src != null && src.includes('youtube.com/embed'))
  const isWebEmbed =
    externalProvider === 'custom' || externalProvider === 'manual'
  const skipSandbox = isYouTubeEmbed || isWebEmbed

  const showIframe = canEmbedInApp && src && !iframeBlocked

  function handleIframeLoad() {
    setIframeLoaded(true)
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current)
      loadTimerRef.current = null
    }
  }

  return (
    <div
      className={cn(
        'rounded-card-xl border-2 border-dashed border-amber-500/40 overflow-hidden bg-card',
        className,
      )}
    >
      <ExternalCourseLabel provider={externalProvider} variant="ribbon" />

      {showIframe ? (
        <div className={cn('relative w-full bg-black', minHeight)}>
          <iframe
            src={src}
            title={`${title} — ${provider.label}`}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="no-referrer"
            {...(skipSandbox
              ? {}
              : {
                  sandbox:
                    'allow-scripts allow-same-origin allow-popups allow-forms allow-presentation',
                })}
            onLoad={handleIframeLoad}
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

      {showIframe && externalUrl && (
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
