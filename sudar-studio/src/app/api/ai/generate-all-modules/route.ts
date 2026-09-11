import { getRequestSession } from '@/lib/auth/requestSession'
import { fillOneEmptyModule } from '@/lib/ai/courseGeneration/fillOneModule'
import { runInWaitUntil } from '@/lib/ai/courseGeneration/scheduleBackgroundFill'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as {
    course_id?: string
    kick?: boolean
    fill_round?: number
  }
  const courseId = body.course_id
  if (!courseId) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
  const kick = body.kick === true

  if (kick) {
    const queued = await runInWaitUntil(
      fillOneEmptyModule(courseId, session.user.id).then(() => undefined)
    )
    if (queued) {
      return NextResponse.json({
        success: true,
        accepted: true,
        course_id: courseId,
        needs_continue: true,
      })
    }
  }

  const { status, payload } = await fillOneEmptyModule(courseId, session.user.id)
  return NextResponse.json(payload, { status })
}
