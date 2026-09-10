export function isRetryableFillError(message: string | undefined): boolean {
  if (!message) return false
  return /too many subrequests|cpu time limit|worker invocation/i.test(message)
}

export function shouldContinueFill(
  parsed: Record<string, unknown> | null,
  status: number,
): boolean {
  if (!parsed || typeof parsed.course_id !== 'string') return false
  if (parsed.completed === true) return false
  if (status === 401 || status === 403 || status === 404) return false
  if (parsed.needs_continue === true || status === 202) return true
  const err = typeof parsed.error === 'string' ? parsed.error : undefined
  const warning = typeof parsed.warning === 'string' ? parsed.warning : undefined
  return isRetryableFillError(err) || isRetryableFillError(warning)
}
