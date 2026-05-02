/**
 * Generate audio (TTS) for the Listen modality.
 * Proxies to Sudar Intelligence /api/audio/generate when configured.
 * Uses learner's preferred TTS voice from preferences (or request body override).
 * When Intelligence is unavailable, returns use_browser_tts so client can show "unavailable" (no browser fallback).
 */
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rejectSensitiveLearnerAiInput } from '@/lib/security/learnerAiInputGuard'
import { normalizeTtsVoiceId, TTS_VOICE_OPTIONS_BY_ID } from '@/lib/audio/voices'

const INTELLIGENCE_URL = (process.env.SUDAR_INTELLIGENCE_URL ?? process.env.BYTEOS_INTELLIGENCE_URL)?.replace(/\/$/, '')
const INTELLIGENCE_SERVICE_SECRET = process.env.INTELLIGENCE_SERVICE_SECRET?.trim()

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  const admin = createServiceRoleSupabaseClient()
  const blockedAudio = await rejectSensitiveLearnerAiInput(admin, user.id, [text])
  if (blockedAudio) return blockedAudio

  let voice: string | undefined = typeof body.voice === 'string'
    ? normalizeTtsVoiceId(body.voice.trim()) ?? undefined
    : undefined
  if (!voice) {
    const { data: profile } = await admin
      .from('learner_profiles')
      .select('ai_tutor_context')
      .eq('user_id', user.id)
      .single()
    const ctx = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
    const prefs = (ctx.preferences as Record<string, string>) ?? {}
    if (prefs.tts_voice) voice = normalizeTtsVoiceId(prefs.tts_voice) ?? undefined
  }
  if (!voice || !TTS_VOICE_OPTIONS_BY_ID[voice]) {
    voice = 'en-US-JennyNeural'
  }

  if (!INTELLIGENCE_URL) {
    return NextResponse.json(
      { use_browser_tts: true, error: 'tts_unavailable', text: text.slice(0, 12000) },
      { status: 200 }
    )
  }

  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
  if (INTELLIGENCE_SERVICE_SECRET) headers['X-Intelligence-Service-Secret'] = INTELLIGENCE_SERVICE_SECRET

  try {
    const res = await fetch(`${INTELLIGENCE_URL}/api/audio/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: text.slice(0, 15000),
        voice: voice ?? undefined,
        rate: typeof body.rate === 'number' ? body.rate : undefined,
        expression: typeof body.expression === 'string' ? body.expression : undefined,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      if (res.status === 501) {
        return NextResponse.json(
          { use_browser_tts: true, error: 'tts_unavailable', text: text.slice(0, 12000) },
          { status: 200 }
        )
      }
      return NextResponse.json({ error: detail || res.statusText }, { status: res.status })
    }

    const contentType = res.headers.get('content-type') || 'audio/mpeg'
    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline; filename=module.mp3',
      },
    })
  } catch {
    return NextResponse.json(
      { use_browser_tts: true, error: 'tts_unavailable', text: text.slice(0, 12000) },
      { status: 200 }
    )
  }
}
