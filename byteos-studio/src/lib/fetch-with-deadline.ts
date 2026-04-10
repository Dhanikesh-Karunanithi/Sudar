/**
 * Bounded fetch for Supabase auth calls in middleware.
 * Without this, a stuck TLS/DNS/network path can leave `getUser()` pending forever
 * and the dev server appears "not started" (browser hangs on every route).
 */
const DEFAULT_MS = 12_000

export function fetchWithDeadline(
  ms: number = DEFAULT_MS
): typeof fetch {
  return (input, init) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ms)

    const upstream = init?.signal
    const onUpstreamAbort = () => {
      clearTimeout(timeoutId)
      controller.abort(upstream?.reason)
    }

    if (upstream) {
      if (upstream.aborted) {
        clearTimeout(timeoutId)
        return Promise.reject(upstream.reason)
      }
      upstream.addEventListener('abort', onUpstreamAbort, { once: true })
    }

    return fetch(input, { ...init, signal: controller.signal }).finally(() => {
      clearTimeout(timeoutId)
      upstream?.removeEventListener('abort', onUpstreamAbort)
    })
  }
}
