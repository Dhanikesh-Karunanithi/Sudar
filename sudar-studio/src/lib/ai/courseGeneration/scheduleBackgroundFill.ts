import type { NextRequest } from 'next/server'
import { shouldChainBackgroundFill } from './scheduleBackgroundFillLogic'

export { shouldChainBackgroundFill } from './scheduleBackgroundFillLogic'

/** Schedule work after the HTTP response so ChatGPT is not blocked on Studio AI. */
export async function runInWaitUntil(task: Promise<unknown>): Promise<boolean> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { ctx } = await getCloudflareContext({ async: true })
    ctx.waitUntil(
      task.then(
        () => undefined,
        () => undefined,
      ),
    )
    return true
  } catch {
    return false
  }
}

/** POST kick:true so the callee returns immediately and fills inside waitUntil. */
export async function kickBackgroundModuleFill(
  request: NextRequest,
  courseId: string,
  fillRound = 0,
): Promise<boolean> {
  const auth = request.headers.get('authorization')
  const cookie = request.headers.get('cookie')
  try {
    const url = new URL('/api/ai/generate-all-modules', request.url)
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify({ course_id: courseId, kick: true, fill_round: fillRound }),
    })
    return res.ok
  } catch {
    return false
  }
}
