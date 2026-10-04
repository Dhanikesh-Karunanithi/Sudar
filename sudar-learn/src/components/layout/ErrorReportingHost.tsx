'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { reportError } from '../../../../shared/observability/errorReporter'

const MAX_REPORTS_PER_PAGE = 10

export function ErrorReportingHost() {
  const pathname = usePathname()

  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    if (!dsn) return
    const seen = new Set<string>()
    const send = (error: unknown) => {
      const key = error instanceof Error ? `${error.name}:${error.message}` : String(error)
      if (seen.has(key) || seen.size >= MAX_REPORTS_PER_PAGE) return
      seen.add(key)
      void reportError(dsn, error, {
        app: 'learn',
        runtime: 'browser',
        route: pathname ?? undefined,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
      })
    }
    const onError = (event: ErrorEvent) => send(event.error ?? event.message)
    const onRejection = (event: PromiseRejectionEvent) => send(event.reason)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [pathname])

  return null
}
