/**
 * ALP Create — Generate course outline for external LMS.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createOutlineRequestSchema } from '../../../../../../../shared/content-generation/schemas'
import { resolveCreateAuth } from '@/lib/alp/createAuth'
import { generateOutlineForCreate } from '@/lib/alp/createGeneration'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createOutlineRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const auth = await resolveCreateAuth(request, parsed.data.creator_user_id)
  if (!auth.ok) return auth.response

  try {
    const result = await generateOutlineForCreate(auth.ctx, {
      courseTitle: parsed.data.course_title,
      description: parsed.data.description,
      difficulty: parsed.data.difficulty,
      numModules: parsed.data.num_modules,
      language: parsed.data.language,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    )
  }
}
