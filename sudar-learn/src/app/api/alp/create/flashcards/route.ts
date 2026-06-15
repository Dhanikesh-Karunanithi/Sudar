/**
 * ALP Create — Generate flashcards for external LMS (SudarCards).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createFlashcardsRequestSchema } from '../../../../../../../shared/content-generation/schemas'
import { resolveCreateAuth } from '@/lib/alp/createAuth'
import { generateFlashcardsForCreate } from '@/lib/alp/createGeneration'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createFlashcardsRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const auth = await resolveCreateAuth(request, parsed.data.creator_user_id)
  if (!auth.ok) return auth.response

  try {
    const result = await generateFlashcardsForCreate(auth.ctx, {
      content: parsed.data.content,
      moduleTitle: parsed.data.module_title,
      language: parsed.data.language,
      exportFormat: parsed.data.export_format,
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const embed_url =
      parsed.data.export_format === 'embed'
        ? `${baseUrl.replace(/\/$/, '')}/alp/create/preview/flashcards?org=${auth.ctx.orgId}`
        : undefined

    return NextResponse.json({ success: true, ...result, embed_url })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    )
  }
}
