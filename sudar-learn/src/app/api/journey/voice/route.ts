import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { isJourneyEnabled } from '@/lib/journey/isJourneyEnabled'
import { callIntelligenceSim, extractSttText, normalizeAudioMime, type SimSttResult } from '@/lib/sim/simSession'
import { checkAndIncrementUsage, usageLimitErrorResponse } from '@/lib/usage-limits'
import { rejectCrossSiteRequest } from '@/lib/security/sameOrigin'

/** ~90s of opus audio as base64; keeps Workers request bodies small. */
const MAX_AUDIO_BASE64_CHARS = 2_500_000
const MAX_TTS_CHARS = 1200

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('stt'),
    audio_base64: z.string().min(16).max(MAX_AUDIO_BASE64_CHARS),
    audio_mime: z.string().max(80).optional(),
    locale: z.string().max(16).optional(),
  }),
  z.object({
    action: z.literal('tts'),
    text: z.string().trim().min(1).max(4000),
    locale: z.string().max(16).optional(),
  }),
])

type TtsResult = { audio_base64?: string | null; audio_mime?: string | null }

/** Strip markdown so TTS doesn't read symbols aloud. */
function speakableText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TTS_CHARS)
}

/** SudarNotes voice: speech-to-text and Sudar's spoken replies via Intelligence (Deepgram/HF STT, Cartesia → Edge TTS). */
export async function POST(request: NextRequest) {
  if (!isJourneyEnabled()) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  const crossSite = rejectCrossSiteRequest(request)
  if (crossSite) return crossSite
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid voice request' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const usage = await checkAndIncrementUsage(admin, user.id, 'generic')
  if (!usage.allowed) {
    const err = usageLimitErrorResponse(usage)
    return NextResponse.json(err.body, { status: err.status })
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const accessToken = session?.access_token ?? null
  const body = parsed.data

  try {
    if (body.action === 'stt') {
      const stt = await callIntelligenceSim<SimSttResult>(
        '/stt',
        {
          user_id: user.id,
          audio_base64: body.audio_base64,
          audio_mime: normalizeAudioMime(body.audio_mime),
          locale: body.locale ?? 'en',
        },
        accessToken,
      )
      const text = extractSttText(stt)
      if (!text) {
        return NextResponse.json(
          { success: false, error: "I couldn't catch that. Try again or type your message." },
          { status: 422 },
        )
      }
      return NextResponse.json({ success: true, data: { text } })
    }

    const text = speakableText(body.text)
    if (!text) return NextResponse.json({ success: true, data: { audio_base64: null, audio_mime: null } })
    const tts = await callIntelligenceSim<TtsResult>('/tts', { text, locale: body.locale ?? 'en' }, accessToken)
    return NextResponse.json({
      success: true,
      data: { audio_base64: tts.audio_base64 ?? null, audio_mime: tts.audio_mime ?? null },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Voice is unavailable right now. You can keep typing.' },
      { status: 503 },
    )
  }
}
