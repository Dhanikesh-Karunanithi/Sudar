import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z, ZodError } from 'zod'
import { callIntelligenceSim, type SimTtsResult } from '@/lib/sudarsim/intelligenceSim'

const previewTtsSchema = z.object({
  text: z.string().min(1),
  locale: z.string().default('en'),
  voice: z.string().optional(),
})

function formatZodError(err: ZodError): string {
  return err.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ') || 'Invalid request'
}

/** Opening line / one-off TTS for Studio preview (no session). */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Request body is not valid JSON' }, { status: 400 })
  }

  let body: z.infer<typeof previewTtsSchema>
  try {
    body = previewTtsSchema.parse(raw)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ success: false, error: formatZodError(err) }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  try {
    const result = await callIntelligenceSim<SimTtsResult>('/tts', {
      text: body.text.trim(),
      locale: body.locale,
      ...(body.voice?.trim() ? { voice: body.voice.trim() } : {}),
    })

    return NextResponse.json({
      success: true,
      audio_base64: result.audio_base64 ?? null,
      audio_mime: result.audio_mime ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TTS failed'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
