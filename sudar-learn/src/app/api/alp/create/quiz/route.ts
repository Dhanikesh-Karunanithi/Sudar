/**
 * ALP Create — Generate quiz from text for external LMS (SudarQuiz).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createQuizRequestSchema } from '@shared-content-generation/schemas'
import { resolveCreateAuth } from '@/lib/alp/createAuth'
import { generateQuizForCreate } from '@/lib/alp/createGeneration'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createQuizRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const auth = await resolveCreateAuth(request, parsed.data.creator_user_id)
  if (!auth.ok) return auth.response

  try {
    const result = await generateQuizForCreate(auth.ctx, {
      content: parsed.data.content,
      courseTitle: parsed.data.course_title,
      moduleTitle: parsed.data.module_title,
      difficulty: parsed.data.difficulty,
      numQuestions: parsed.data.num_questions,
      language: parsed.data.language,
      exportFormat: parsed.data.export_format,
      emitXapi: parsed.data.emit_xapi,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    )
  }
}
