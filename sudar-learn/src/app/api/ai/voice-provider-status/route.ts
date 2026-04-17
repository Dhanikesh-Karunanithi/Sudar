import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { VoiceLibraryProviderStatus } from '@/lib/audio/voices'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const providers: VoiceLibraryProviderStatus[] = [
    {
      id: 'sarvam',
      name: 'Sarvam',
      status: process.env.SARVAM_API_KEY?.trim() ? 'configured' : 'not_set',
      description: 'Indian-language provider integration. Voice list will appear when provider libraries are enabled.',
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      status: process.env.ELEVENLABS_API_KEY?.trim() ? 'configured' : 'not_set',
      description: 'Premium narration voice provider. Library preview is planned in a follow-up.',
    },
    {
      id: 'openai',
      name: 'OpenAI',
      status: process.env.OPENAI_API_KEY?.trim() ? 'configured' : 'not_set',
      description: 'Cloud TTS/chat provider available for generation paths.',
    },
  ]

  return NextResponse.json({ providers })
}
