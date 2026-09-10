import { bearerPost } from '../clients/bearer.js'
import type { SudarMcpConfig } from '../config.js'
import { ensureStudioUrl, parseObject } from './creatorFormat.js'
import { shouldContinueFill } from './courseFillLogic.js'

export { isRetryableFillError, shouldContinueFill } from './courseFillLogic.js'

const MAX_FILL_ROUNDS = 12

export async function continueUntilCourseFilled(
  config: SudarMcpConfig,
  initial: { status: number; parsed: Record<string, unknown> | null },
): Promise<{ ok: boolean; payload: Record<string, unknown> | null; status: number }> {
  let status = initial.status
  let payload = initial.parsed
    ? ensureStudioUrl(initial.parsed, config.studioUrl)
    : null
  let rounds = 0

  while (payload && shouldContinueFill(payload, status) && rounds < MAX_FILL_ROUNDS) {
    const courseId = payload.course_id
    if (typeof courseId !== 'string') break
    const res = await bearerPost(config.studioUrl, '/api/ai/generate-all-modules', config.accessToken, {
      course_id: courseId,
    })
    status = res.status
    const parsed = parseObject(res.text)
    if (!parsed) {
      return { ok: false, payload, status }
    }
    payload = ensureStudioUrl(
      {
        ...payload,
        ...parsed,
        course_id: courseId,
        studio_url: payload.studio_url,
      },
      config.studioUrl,
    )
    rounds++
  }

  const ok = Boolean(
    payload &&
      typeof payload.course_id === 'string' &&
      (payload.completed === true ||
        (status === 200 && payload.needs_continue !== true && payload.error == null)),
  )
  return { ok, payload, status }
}
