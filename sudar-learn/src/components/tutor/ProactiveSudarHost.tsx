'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { ProactiveSudarChoiceChips } from '@/components/tutor/ProactiveSudarChoiceChips'
import { MASCOT_ROLLOUT } from '@/lib/mascot/rollout'
import { PROACTIVE_FOLLOW_UP_EVENT, type ProactiveFollowUpDetail } from '@/lib/tutor/proactiveEvents'
import type { ProactivePromptChoice } from '@/types/tutor'
import { cn } from '@/lib/utils'

const SESSION_STORAGE_SHOWN = 'sudar_proactive_session_v1'
const SESSION_STORAGE_SNOOZE = 'sudar_proactive_snooze_until'
const ROUTE_DEBOUNCE_MS = 750
const SESSION_DELAY_MS = 500
const ROUTE_COOLDOWN_MS = 55_000
const SNOOZE_MS = 4 * 60 * 60 * 1000

function isCourseLearnPath(p: string | null): boolean {
  return Boolean(p && /\/courses\/[^/]+\/learn/.test(p))
}

function readSnoozeUntil(): number {
  if (typeof window === 'undefined') return 0
  const raw = sessionStorage.getItem(SESSION_STORAGE_SNOOZE)
  const n = raw ? parseInt(raw, 10) : 0
  return Number.isFinite(n) ? n : 0
}

function isSnoozed(): boolean {
  return Date.now() < readSnoozeUntil()
}

type ActivePrompt = {
  message: string
  choices: ProactivePromptChoice[]
  trigger: string
}

export function ProactiveSudarHost() {
  const pathname = usePathname()
  const [active, setActive] = useState<ActivePrompt | null>(null)
  const lastRoutePromptAtRef = useRef(0)
  /** Browser timer id (number); avoid NodeJS.Timeout from mixed DOM/node typings. */
  const routeTimerRef = useRef<number | null>(null)
  const sessionStartedRef = useRef(false)

  const logReply = useCallback(
    async (payload: {
      trigger: string
      choice_id: string
      choice_label?: string
      follow_up_message?: string
    }) => {
      await fetch('/api/tutor/proactive-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    },
    []
  )

  const handleChoice = useCallback(
    (choice: ProactivePromptChoice, trigger: string) => {
      void logReply({
        trigger,
        choice_id: choice.id,
        choice_label: choice.label,
        follow_up_message: choice.follow_up_message?.trim() || undefined,
      })
      setActive(null)
      const msg = choice.follow_up_message?.trim()
      if (msg) {
        window.dispatchEvent(
          new CustomEvent<ProactiveFollowUpDetail>(PROACTIVE_FOLLOW_UP_EVENT, {
            detail: { message: msg, trigger },
          })
        )
      }
    },
    [logReply]
  )

  const handleSnoozeBar = useCallback(() => {
    if (active) {
      void logReply({
        trigger: active.trigger,
        choice_id: 'snoozed',
        choice_label: 'Closed proactive bar',
      })
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_SNOOZE, String(Date.now() + SNOOZE_MS))
    }
    setActive(null)
  }, [active, logReply])

  useEffect(() => {
    if (isCourseLearnPath(pathname)) {
      setActive(null)
    }
  }, [pathname])

  useEffect(() => {
    if (!MASCOT_ROLLOUT.surfaces.tutor_chat) return
    if (sessionStartedRef.current) return
    sessionStartedRef.current = true

    const t = window.setTimeout(async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      if (isSnoozed()) return
      const pathNow = typeof window !== 'undefined' ? window.location.pathname : null
      if (isCourseLearnPath(pathNow)) return
      if (sessionStorage.getItem(SESSION_STORAGE_SHOWN)) return
      if (pathNow && pathNow !== '/') {
        sessionStorage.setItem(SESSION_STORAGE_SHOWN, '1')
        return
      }

      try {
        const res = await fetch('/api/tutor/proactive-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trigger: 'session_start' }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean
          skip?: boolean
          message?: string
          choices?: ProactivePromptChoice[]
          trigger?: string
        }
        if (!res.ok || !data.ok || data.skip || !data.message || !data.choices?.length) return
        if (isCourseLearnPath(window.location.pathname)) return
        sessionStorage.setItem(SESSION_STORAGE_SHOWN, '1')
        setActive({
          message: data.message,
          choices: data.choices,
          trigger: data.trigger ?? 'session_start',
        })
      } catch {
        /* ignore */
      }
    }, SESSION_DELAY_MS)

    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!MASCOT_ROLLOUT.surfaces.tutor_chat) return
    if (routeTimerRef.current) window.clearTimeout(routeTimerRef.current)

    routeTimerRef.current = window.setTimeout(async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      if (isSnoozed()) return
      if (isCourseLearnPath(pathname)) return
      if (Date.now() - lastRoutePromptAtRef.current < ROUTE_COOLDOWN_MS) return

      try {
        const res = await fetch('/api/tutor/proactive-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trigger: 'route_change', route: pathname ?? '/' }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean
          skip?: boolean
          message?: string
          choices?: ProactivePromptChoice[]
          trigger?: string
        }
        if (!res.ok || !data.ok || data.skip || !data.message || !data.choices?.length) return
        if (isCourseLearnPath(window.location.pathname)) return
        lastRoutePromptAtRef.current = Date.now()
        setActive({
          message: data.message,
          choices: data.choices,
          trigger: data.trigger ?? 'route_change',
        })
      } catch {
        /* ignore */
      }
    }, ROUTE_DEBOUNCE_MS)

    return () => {
      if (routeTimerRef.current) window.clearTimeout(routeTimerRef.current)
    }
  }, [pathname])

  if (!MASCOT_ROLLOUT.surfaces.tutor_chat) return null
  if (isCourseLearnPath(pathname)) return null
  if (!active) return null

  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-20 left-4 right-4 z-[55] sm:left-auto sm:right-6 sm:max-w-md',
        'rounded-[var(--radius-chat-panel)] border border-border bg-card/95 backdrop-blur-md shadow-xl',
        'p-4 flex flex-col gap-3'
      )}
    >
      <div className="flex items-start gap-3">
        <SudarLogoMark className="w-5 h-5 text-primary shrink-0 mt-0.5" starFill="var(--background)" />
        <p className="flex-1 text-sm text-card-foreground min-w-0 leading-snug">{active.message}</p>
        <button
          type="button"
          onClick={handleSnoozeBar}
          className="p-1.5 rounded-md text-muted-foreground hover:text-card-foreground hover:bg-muted shrink-0"
          aria-label="Snooze Sudar suggestions for a few hours"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <ProactiveSudarChoiceChips
        choices={active.choices}
        onSelect={(c) => handleChoice(c, active.trigger)}
      />
    </div>
  )
}
