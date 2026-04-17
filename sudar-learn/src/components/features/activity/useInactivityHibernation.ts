'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type ActivityTrackingState = 'active' | 'warning' | 'hibernating'

type ActivityTransitionContext = {
  inactivityCount: number
}

interface UseInactivityHibernationOptions {
  warningAfterMs?: number
  hibernateAfterMs?: number
  tickMs?: number
  onWarningStart?: (ctx: ActivityTransitionContext) => void
  onWarningCancel?: (ctx: ActivityTransitionContext) => void
  onHibernate?: (ctx: ActivityTransitionContext) => void
  onResume?: (ctx: ActivityTransitionContext & { fromState: 'warning' | 'hibernating' }) => void
}

interface UseInactivityHibernationResult {
  trackingState: ActivityTrackingState
  warningRemainingSecs: number
  warningElapsedSecs: number
  inactivityCount: number
  markInteraction: () => void
}

const DEFAULT_WARNING_AFTER_MS = 4.5 * 60 * 1000
const DEFAULT_HIBERNATE_AFTER_MS = 5 * 60 * 1000
const DEFAULT_TICK_MS = 250

function toSeconds(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000))
}

export function useInactivityHibernation({
  warningAfterMs = DEFAULT_WARNING_AFTER_MS,
  hibernateAfterMs = DEFAULT_HIBERNATE_AFTER_MS,
  tickMs = DEFAULT_TICK_MS,
  onWarningStart,
  onWarningCancel,
  onHibernate,
  onResume,
}: UseInactivityHibernationOptions = {}): UseInactivityHibernationResult {
  const [trackingState, setTrackingState] = useState<ActivityTrackingState>('active')
  const [warningRemainingSecs, setWarningRemainingSecs] = useState(toSeconds(hibernateAfterMs - warningAfterMs))
  const [inactivityCount, setInactivityCount] = useState(0)
  const [warningElapsedSecs, setWarningElapsedSecs] = useState(0)

  const stateRef = useRef<ActivityTrackingState>('active')
  const lastInteractionAtRef = useRef<number>(Date.now())
  const inactivityCountRef = useRef(0)

  const warningWindowMs = useMemo(
    () => Math.max(0, hibernateAfterMs - warningAfterMs),
    [hibernateAfterMs, warningAfterMs]
  )

  const emitState = useCallback((nextState: ActivityTrackingState) => {
    const prev = stateRef.current
    if (prev === nextState) return
    stateRef.current = nextState
    setTrackingState(nextState)

    const ctx = { inactivityCount: inactivityCountRef.current }
    if (nextState === 'warning') {
      onWarningStart?.(ctx)
      return
    }
    if (nextState === 'hibernating') {
      onHibernate?.(ctx)
      return
    }
    if (prev === 'warning') {
      onWarningCancel?.(ctx)
      onResume?.({ ...ctx, fromState: 'warning' })
      return
    }
    if (prev === 'hibernating') {
      onResume?.({ ...ctx, fromState: 'hibernating' })
    }
  }, [onHibernate, onResume, onWarningCancel, onWarningStart])

  const markInteraction = useCallback(() => {
    lastInteractionAtRef.current = Date.now()
    const prev = stateRef.current
    if (prev !== 'active') emitState('active')
    setWarningElapsedSecs(0)
    setWarningRemainingSecs(toSeconds(warningWindowMs))
  }, [emitState, warningWindowMs])

  useEffect(() => {
    function onActivity() {
      markInteraction()
    }
    window.addEventListener('pointerdown', onActivity, true)
    window.addEventListener('keydown', onActivity, true)
    window.addEventListener('touchstart', onActivity, true)
    window.addEventListener('scroll', onActivity, true)
    window.addEventListener('focus', onActivity, true)
    return () => {
      window.removeEventListener('pointerdown', onActivity, true)
      window.removeEventListener('keydown', onActivity, true)
      window.removeEventListener('touchstart', onActivity, true)
      window.removeEventListener('scroll', onActivity, true)
      window.removeEventListener('focus', onActivity, true)
    }
  }, [markInteraction])

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastInteractionAtRef.current
      if (elapsed >= hibernateAfterMs) {
        if (stateRef.current !== 'hibernating') {
          inactivityCountRef.current += 1
          setInactivityCount(inactivityCountRef.current)
          emitState('hibernating')
        }
        setWarningRemainingSecs(0)
        setWarningElapsedSecs(toSeconds(warningWindowMs))
        return
      }

      if (elapsed >= warningAfterMs) {
        if (stateRef.current === 'active') {
          emitState('warning')
        }
        const remaining = Math.max(0, hibernateAfterMs - elapsed)
        setWarningRemainingSecs(toSeconds(remaining))
        setWarningElapsedSecs(toSeconds(warningWindowMs - remaining))
        return
      }

      if (stateRef.current !== 'active') emitState('active')
      setWarningRemainingSecs(toSeconds(warningWindowMs))
      setWarningElapsedSecs(0)
    }, tickMs)

    return () => window.clearInterval(id)
  }, [emitState, hibernateAfterMs, tickMs, warningAfterMs, warningWindowMs])

  return {
    trackingState,
    warningRemainingSecs,
    warningElapsedSecs,
    inactivityCount,
    markInteraction,
  }
}
