'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Globe,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getExternalProviderMeta } from '@/lib/courses/externalProviders'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'

export interface ExternalCourseViewerProps {
  courseId: string
  title: string
  description?: string | null
  externalProvider: string | null
  externalUrl: string | null
  embedUrl: string | null
  moduleId: string
  enrollmentProgress: number
  enrollmentStatus?: string
  isModuleComplete: boolean
}

export function ExternalCourseViewer({
  courseId,
  title,
  description,
  externalProvider,
  externalUrl,
  embedUrl,
  moduleId,
  enrollmentProgress,
  enrollmentStatus,
  isModuleComplete,
}: ExternalCourseViewerProps) {
  const router = useRouter()
  const provider = getExternalProviderMeta(externalProvider)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justCompleted, setJustCompleted] = useState(false)

  const isCompleted =
    justCompleted ||
    isModuleComplete ||
    enrollmentStatus === 'completed' ||
    enrollmentProgress >= 100

  async function handleMarkComplete() {
    if (isCompleted || completing) return
    setCompleting(true)
    setError(null)

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'module_complete',
        course_id: courseId,
        module_id: moduleId,
        modality: 'text',
        payload: { source: 'external_open_course', provider: externalProvider },
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError((data as { error?: string }).error ?? 'Could not record completion')
      setCompleting(false)
      return
    }

    setJustCompleted(true)
    setCompleting(false)
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link
        href={`/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-card-foreground text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to course
      </Link>

      <div className="rounded-card-xl border border-primary/20 bg-card overflow-hidden">
        <div className="p-6 md:p-8 border-b border-border space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-pill border',
                provider.accentClass,
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              {provider.label}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Open course · Discover
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-card-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{description}</p>
          )}
          <p className="text-xs text-muted-foreground max-w-2xl">
            This course is hosted on {provider.label}. Watch or study there, then mark complete in Sudar to
            track progress and earn rewards.
          </p>
        </div>

        {embedUrl ? (
          <div className="relative w-full aspect-video bg-black">
            <iframe
              src={embedUrl}
              title={title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <div className="p-8 md:p-12 flex flex-col items-center text-center gap-4 bg-muted/30">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ExternalLink className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Open this course on {provider.label} in a new tab. When you finish, return here to mark it
              complete.
            </p>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-button transition-all"
              >
                Go to course on {provider.shortLabel}
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {embedUrl && externalUrl && (
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Prefer the full site experience?</p>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-90"
            >
              Open on {provider.shortLabel}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      <div
        className={cn(
          'rounded-card border p-6 space-y-4',
          isCompleted ? 'border-success/40 bg-success/5' : 'border-border bg-card',
        )}
      >
        {isCompleted ? (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h2 className="font-display text-lg font-bold text-card-foreground">Course complete!</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-warning" />
              Progress saved — check your dashboard for XP and coins.
            </p>
            <Link
              href="/courses"
              className="text-sm font-medium text-primary hover:opacity-90 mt-2"
            >
              Browse more courses
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-card-foreground">Track your progress</h2>
            <p className="text-sm text-muted-foreground">
              Finished the material on {provider.shortLabel}? Mark this course complete to update your
              learning record.
            </p>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button
              type="button"
              onClick={handleMarkComplete}
              disabled={completing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:opacity-90 disabled:opacity-60 text-primary-foreground font-semibold rounded-button transition-all"
            >
              {completing ? (
                <SudarInlineLoader size="sm" className="text-primary-foreground" starFill="currentColor" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              {completing ? 'Saving…' : 'Mark as complete'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
