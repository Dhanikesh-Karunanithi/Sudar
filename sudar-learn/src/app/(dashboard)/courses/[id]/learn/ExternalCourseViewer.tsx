'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, MessageCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getExternalProviderMeta,
  providerRequiresSignIn,
} from '@/lib/courses/externalProviders'
import { ExternalCourseLabel } from '@/components/courses/ExternalCourseLabel'
import { ExternalCourseEmbed } from '@/components/courses/ExternalCourseEmbed'
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
  allowTutorDiscussion?: boolean
  requiresSignIn?: boolean
  signInInstructions?: string | null
  requireLearnerConsent?: boolean
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
  allowTutorDiscussion = true,
  requiresSignIn: requiresSignInProp,
  signInInstructions,
  requireLearnerConsent = false,
}: ExternalCourseViewerProps) {
  const router = useRouter()
  const provider = getExternalProviderMeta(externalProvider)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justCompleted, setJustCompleted] = useState(false)
  const [consentGiven, setConsentGiven] = useState(!requireLearnerConsent)
  const [signedInAck, setSignedInAck] = useState(false)

  const needsSignIn = requiresSignInProp ?? providerRequiresSignIn(externalProvider)

  const isCompleted =
    justCompleted ||
    isModuleComplete ||
    enrollmentStatus === 'completed' ||
    enrollmentProgress >= 100

  async function trackEngagement(eventType: 'view' | 'click' | 'duration' | 'complete', durationSecs?: number) {
    await fetch('/api/external-courses/engagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, event_type: eventType, duration_secs: durationSecs }),
    }).catch(() => undefined)
  }

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

    await trackEngagement('complete')
    setJustCompleted(true)
    setCompleting(false)
    router.refresh()
  }

  function openTutor() {
    window.dispatchEvent(
      new CustomEvent('sudar:open-tutor', {
        detail: { courseId, moduleId, prompt: `Tell me about this external course: ${title}` },
      }),
    )
  }

  if (!consentGiven) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 space-y-4 text-center">
        <ExternalCourseLabel provider={externalProvider} variant="banner" />
        <h1 className="font-display text-xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          This course is hosted on {provider.label}. Sudar will embed or link their content; their privacy
          policy applies when you continue.
        </p>
        <button
          type="button"
          onClick={() => {
            setConsentGiven(true)
            void trackEngagement('click')
          }}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-button"
        >
          Continue to course
        </button>
      </div>
    )
  }

  if (needsSignIn && !signedInAck) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 space-y-4">
        <ExternalCourseLabel provider={externalProvider} variant="banner" />
        <h1 className="font-display text-xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {signInInstructions ??
            `Sign in to your ${provider.shortLabel} account in the viewer below, then confirm when ready.`}
        </p>
        <button
          type="button"
          onClick={() => setSignedInAck(true)}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-button"
        >
          I&apos;m signed in — show course
        </button>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-primary hover:opacity-90"
            onClick={() => void trackEngagement('click')}
          >
            Open {provider.shortLabel} in a new tab
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-card-foreground text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Course overview
        </Link>
        <div className="flex items-center gap-3">
          {allowTutorDiscussion && (
            <button
              type="button"
              onClick={openTutor}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-90"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Ask Sudar about this course
            </button>
          )}
          <Link href="/courses?tab=discover" className="text-xs font-medium text-primary hover:opacity-90">
            Browse open courses
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        <ExternalCourseLabel provider={externalProvider} variant="banner" />
        <h1 className="font-display text-2xl md:text-3xl font-bold text-card-foreground px-1">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl px-1">{description}</p>
        )}
      </div>

      <ExternalCourseEmbed
        title={title}
        externalProvider={externalProvider}
        externalUrl={externalUrl}
        embedUrl={embedUrl}
        minHeight="min-h-[min(65vh,680px)]"
        onView={() => void trackEngagement('view')}
        onExternalClick={() => void trackEngagement('click')}
      />

      <div
        className={cn(
          'sticky bottom-4 z-10 rounded-card border shadow-lg p-4 md:p-5 space-y-3',
          isCompleted ? 'border-success/40 bg-success/10' : 'border-border bg-card/95 backdrop-blur-sm',
        )}
      >
        {isCompleted ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
              <div>
                <p className="font-semibold text-card-foreground">Course complete</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-warning" />
                  Progress saved on Sudar
                </p>
              </div>
            </div>
            <Link href="/courses?tab=discover" className="text-sm font-medium text-primary hover:opacity-90">
              More open courses
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Finished learning on {provider.shortLabel}? Mark complete to update your Sudar record and earn
              rewards.
            </p>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button
              type="button"
              onClick={handleMarkComplete}
              disabled={completing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:opacity-90 disabled:opacity-60 text-primary-foreground font-semibold rounded-button transition-all"
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
