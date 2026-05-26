/**
 * Poll workflow status by id. Workflows started via POST /api/tutor/workflow run synchronously
 * and return the result in the same response, so this endpoint is for future async workflows.
 */
import { getRequestSession } from '@/lib/auth/requestSession'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequestSession(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    return NextResponse.json({
      workflow_id: id,
      status: 'done',
      steps: [],
      current_step_index: 0,
      summary: 'Workflow completed.',
      result: null,
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
