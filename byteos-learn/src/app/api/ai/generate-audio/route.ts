/**
 * Generate audio (TTS) for the Listen modality.
 * Proxies to ByteOS Intelligence /api/audio/generate when configured.
 * Uses learner's preferred TTS voice from preferences (or request body override).
 * When Intelligence is unavailable, returns use_browser_tts so client can show "unavailable" (no browser fallback).
 */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const INTELLIGENCE_URL = process.env.BYTEOS_INTELLIGENCE_URL?.replace(/\/$/, '')

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  let voice: string | undefined = typeof body.voice === 'string' ? body.voice.trim() || undefined : undefined
  if (!voice) {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('learner_profiles')
      .select('ai_tutor_context')
      .eq('user_id', user.id)
      .single()
    const ctx = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
    const prefs = (ctx.preferences as Record<string, string>) ?? {}
    if (prefs.tts_voice) voice = prefs.tts_voice
  }

  if (!INTELLIGENCE_URL) {
    return NextResponse.json(
      { use_browser_tts: true, text: text.slice(0, 12000) },
      { status: 200 }
    )
  }

  try {
    const res = await fetch(`${INTELLIGENCE_URL}/api/audio/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 15000),
        voice: voice ?? undefined,
        rate: typeof body.rate === 'number' ? body.rate : undefined,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      if (res.status === 501) {
        return NextResponse.json(
          { use_browser_tts: true, text: text.slice(0, 12000) },
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
      { use_browser_tts: true, text: text.slice(0, 12000) },
      { status: 200 }
    )
  }
}
