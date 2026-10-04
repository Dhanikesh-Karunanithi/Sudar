'use client'

import { useEffect, useState, type ReactNode } from 'react'

/**
 * Defers mounting of non-critical dashboard hosts until after first paint
 * (requestIdleCallback with 2s timeout fallback).
 */
export function IdleDeferHost({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const enable = () => {
      if (!cancelled) setReady(true)
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(enable, { timeout: 2000 })
      return () => {
        cancelled = true
        window.cancelIdleCallback(id)
      }
    }

    const t = setTimeout(enable, 2000)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [])

  if (!ready) return null
  return <>{children}</>
}
