import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { TTS_VOICE_OPTIONS_BY_ID } from '@/lib/audio/voices'

const INTELLIGENCE_URL = process.env.BYTEOS_INTELLIGENCE_URL?.replace(/\/$/, '')
const INTELLIGENCE_SERVICE_SECRET = process.env.INTELLIGENCE_SERVICE_SECRET?.trim()

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const voiceId = typeof body.voice === 'string' ? body.voice.trim() : ''
  const voice = TTS_VOICE_OPTIONS_BY_ID[voiceId]
  if (!voice) return NextResponse.json({ error: 'Invalid voice' }, { status: 400 })

  if (!INTELLIGENCE_URL) {
    return NextResponse.json({ error: 'Voice preview unavailable right now.' }, { status: 503 })
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`
  if (INTELLIGENCE_SERVICE_SECRET) {
    headers['X-Intelligence-Service-Secret'] = INTELLIGENCE_SERVICE_SECRET
  }

  try {
    const res = await fetch(`${INTELLIGENCE_URL}/api/audio/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: voice.sampleText,
        voice: voice.id,
      }),
    })
    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ error: detail || 'Voice preview failed' }, { status: res.status })
    }

    const contentType = res.headers.get('content-type') || 'audio/mpeg'
    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename=${voice.id}-preview.mp3`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? `Voice preview failed: ${error.message}` : 'Voice preview failed' },
      { status: 502 }
    )
  }
}
