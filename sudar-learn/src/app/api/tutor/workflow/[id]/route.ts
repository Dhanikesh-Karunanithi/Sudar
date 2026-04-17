/**
 * Poll workflow status by id. Workflows started via POST /api/tutor/workflow run synchronously
 * and return the result in the same response, so this endpoint is for future async workflows.
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
