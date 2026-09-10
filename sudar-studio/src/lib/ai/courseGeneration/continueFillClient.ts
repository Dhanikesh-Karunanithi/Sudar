const MAX_FILL_ROUNDS = 12

type FillResponse = {
  completed?: boolean
  needs_continue?: boolean
  error?: string
  warning?: string
}

function isRetryableFillMessage(message: string | undefined): boolean {
  if (!message) return false
  return /too many subrequests|cpu time limit|worker invocation/i.test(message)
}

/** Fill remaining empty modules one Worker invocation at a time. */
export async function continueCourseModuleFill(courseId: string): Promise<void> {
  for (let attempt = 0; attempt < MAX_FILL_ROUNDS; attempt++) {
    const res = await fetch('/api/ai/generate-all-modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId }),
    })
    const data = (await res.json()) as FillResponse
    if (data.completed) return
    const retryable =
      res.ok ||
      res.status === 202 ||
      isRetryableFillMessage(data.error) ||
      isRetryableFillMessage(data.warning)
    if (!retryable) {
      throw new Error(data.error ?? 'Module generation failed')
    }
  }
  throw new Error('Course generation did not finish. Open the course and retry generating modules.')
}
