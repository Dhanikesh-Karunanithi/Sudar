/**
 * Client-side fire-and-forget POST to Learn /api/events (authenticated via session cookie).
 * Use keepalive during page lifecycle so the request may complete after unload.
 */
export function postLearningEvent(
  body: Record<string, unknown>,
  options?: { keepalive?: boolean }
): void {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
  if (options?.keepalive) init.keepalive = true
  fetch('/api/events', init).catch(() => {})
}
