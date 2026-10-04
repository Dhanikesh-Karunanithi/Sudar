import type { Instrumentation } from 'next'
import { reportError } from '../../shared/observability/errorReporter'

export const onRequestError: Instrumentation.onRequestError = async (error, _request, context) => {
  await reportError(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN, error, {
    app: 'learn',
    runtime: 'server',
    route: context.routePath,
    digest: (error as { digest?: string } | null)?.digest,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  })
}
