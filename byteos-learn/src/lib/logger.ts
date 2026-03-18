/**
 * Structured (JSON) logging for API and auth events.
 * Never log JWT, passwords, or learner PII. Safe for log drains (Vercel, Axiom, etc.).
 */
type LogLevel = 'info' | 'warn' | 'error'

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }
  return JSON.stringify(entry)
}

export function logAuth(event: 'sign_in' | 'sign_out' | 'failed_login', meta?: { reason?: string }) {
  const message = event === 'failed_login' ? 'Auth failed' : event === 'sign_in' ? 'Sign in' : 'Sign out'
  console.log(formatLog('info', message, { event, ...meta }))
}

export function logAiError(provider: string, error: string, meta?: { route?: string }) {
  console.error(formatLog('error', 'AI provider error', { provider, error: error.slice(0, 200), ...meta }))
}

export function logApiError(status: number, path: string, message?: string) {
  const level: LogLevel = status >= 500 ? 'error' : 'warn'
  console[level === 'error' ? 'error' : 'warn'](
    formatLog(level, message ?? `API ${status}`, { status, path })
  )
}
