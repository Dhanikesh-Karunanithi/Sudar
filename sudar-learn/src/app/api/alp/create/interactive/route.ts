/**
 * ALP Create — Generate interactive blocks for external LMS (SudarInteract).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createInteractiveRequestSchema } from '../../../../../../../shared/content-generation/schemas'
import { resolveCreateAuth } from '@/lib/alp/createAuth'
import { generateInteractiveForCreate } from '@/lib/alp/createGeneration'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createInteractiveRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const auth = await resolveCreateAuth(request, parsed.data.creator_user_id)
  if (!auth.ok) return auth.response

  try {
    const result = await generateInteractiveForCreate(auth.ctx, {
      content: parsed.data.content,
      title: parsed.data.title,
      componentTypes: parsed.data.component_types,
      imageUrl: parsed.data.image_url,
      language: parsed.data.language,
      exportFormat: parsed.data.export_format,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    )
  }
}
