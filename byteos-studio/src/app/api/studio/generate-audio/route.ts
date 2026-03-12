/**
 * Generate TTS audio for video scenes or podcast dialogue.
 * Primary: OpenAI TTS (requires OPENAI_API_KEY).
 * Fallback: byteos-intelligence Edge-TTS (free, no API key — requires Intelligence service running).
 * Attaches audioDataURL to each scene/segment and saves to course settings.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { VideoScene, DialogueSegment } from '@/types/content'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech'
const TTS_MODEL = 'tts-1'

const INTELLIGENCE_URL = process.env.BYTEOS_INTELLIGENCE_URL?.replace(/\/$/, '')

// OpenAI voice names
const VOICE_VIDEO_OPENAI = 'nova'
const VOICE_HOST_OPENAI = 'nova'
const VOICE_EXPERT_OPENAI = 'echo'

// Edge-TTS voice names (used via Intelligence fallback)
const VOICE_VIDEO_EDGE = 'en-US-AriaNeural'
const VOICE_HOST_EDGE = 'en-US-JennyNeural'
const VOICE_EXPERT_EDGE = 'en-US-GuyNeural'

const CHUNK_MAX_CHARS = 4000

function splitIntoChunks(text: string): string[] {
  if (text.length <= CHUNK_MAX_CHARS) return [text]
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    if ((current + ' ' + s).trim().length <= CHUNK_MAX_CHARS) {
      current = current ? current + ' ' + s : s
    } else {
      if (current) chunks.push(current.trim())
      current = s
    }
  }
  if (current) chunks.push(current.trim())
  return chunks.filter(Boolean)
}

/** Try OpenAI TTS. Returns null on any error (missing key, 401, network). */
async function tryOpenAI(text: string, voice: string): Promise<string | null> {
  const key = OPENAI_API_KEY?.trim()
  if (!key || key === 'your_openai_key' || key.startsWith('your_')) return null

  const chunks = splitIntoChunks(text.trim())
  const buffers: Buffer[] = []
  for (const chunk of chunks) {
    try {
      const res = await fetch(OPENAI_TTS_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: TTS_MODEL, input: chunk, voice }),
      })
      if (!res.ok) {
        console.error(`OpenAI TTS ${res.status}: ${await res.text()}`)
        return null
      }
      buffers.push(Buffer.from(await res.arrayBuffer()))
    } catch (err) {
      console.error('OpenAI TTS error:', err)
      return null
    }
  }
  if (!buffers.length) return null
  return `data:audio/mpeg;base64,${Buffer.concat(buffers).toString('base64')}`
}

/** Try Intelligence Edge-TTS. Returns null if Intelligence not configured/unavailable. */
async function tryEdgeTTS(text: string, voice: string): Promise<string | null> {
  if (!INTELLIGENCE_URL || !text.trim()) return null
  try {
    const res = await fetch(`${INTELLIGENCE_URL}/api/audio/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim().slice(0, 15000), voice }),
    })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    return `data:audio/mpeg;base64,${Buffer.from(buf).toString('base64')}`
  } catch {
    return null
  }
}

async function generateAudioDataURL(
  text: string,
  openAiVoice: string,
  edgeVoice: string,
): Promise<string | null> {
  if (!text.trim()) return null
  // Try OpenAI first (best quality), fall back to Edge-TTS via Intelligence
  return (await tryOpenAI(text, openAiVoice)) ?? (await tryEdgeTTS(text, edgeVoice))
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasOpenAI = OPENAI_API_KEY?.trim() && !OPENAI_API_KEY.startsWith('your_')
  const hasIntelligence = !!INTELLIGENCE_URL
  if (!hasOpenAI && !hasIntelligence) {
    return NextResponse.json(
      { error: 'No TTS provider configured. Set OPENAI_API_KEY in byteos-studio/.env.local, or start the Intelligence service and set BYTEOS_INTELLIGENCE_URL.' },
      { status: 503 }
    )
  }

  let body: { courseId?: string; type?: 'video' | 'podcast' } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : ''
  const type = body.type === 'video' || body.type === 'podcast' ? body.type : null
  if (!courseId || !type) {
    return NextResponse.json({ error: 'courseId and type (video|podcast) required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: course, error: fetchError } = await admin
    .from('courses')
    .select('id, settings')
    .eq('id', courseId)
    .eq('created_by', user.id)
    .single()

  if (fetchError || !course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const settings = (course.settings as Record<string, unknown>) ?? {}

  if (type === 'video') {
    const scenes = (settings.video_scenes as VideoScene[] | undefined) ?? []
    if (scenes.length === 0) {
      return NextResponse.json({ error: 'No video scenes. Generate a video script first.' }, { status: 400 })
    }
    const updated: VideoScene[] = []
    for (const scene of scenes) {
      const text = scene.narration || scene.title || ''
      const dataURL = await generateAudioDataURL(text, VOICE_VIDEO_OPENAI, VOICE_VIDEO_EDGE)
      updated.push({ ...scene, audioDataURL: dataURL ?? undefined })
    }
    const nextSettings = { ...settings, video_scenes: updated }
    await admin.from('courses').update({ settings: nextSettings }).eq('id', courseId).eq('created_by', user.id)
    return NextResponse.json({ type: 'video', count: updated.length })
  }

  // type === 'podcast'
  const dialogue = (settings.podcast_dialogue as DialogueSegment[] | undefined) ?? []
  if (dialogue.length === 0) {
    return NextResponse.json({ error: 'No podcast dialogue. Generate a podcast script first.' }, { status: 400 })
  }
  const updated: DialogueSegment[] = []
  for (const seg of dialogue) {
    const isExpert = seg.speaker === 'expert'
    const dataURL = await generateAudioDataURL(
      seg.text,
      isExpert ? VOICE_EXPERT_OPENAI : VOICE_HOST_OPENAI,
      isExpert ? VOICE_EXPERT_EDGE : VOICE_HOST_EDGE,
    )
    updated.push({ ...seg, audioDataURL: dataURL ?? undefined })
  }
  const nextSettings = { ...settings, podcast_dialogue: updated }
  await admin.from('courses').update({ settings: nextSettings }).eq('id', courseId).eq('created_by', user.id)
  return NextResponse.json({ type: 'podcast', count: updated.length })
}
