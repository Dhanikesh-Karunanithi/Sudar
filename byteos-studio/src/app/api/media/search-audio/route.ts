import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchAudioFreesound } from '@/lib/media/audioSearch'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 })

  const apiKey = process.env.FREESOUND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Freesound API not configured. Add FREESOUND_API_KEY to .env.local.' },
      { status: 503 }
    )
  }

  try {
    const results = await searchAudioFreesound(q, 12, apiKey)
    return NextResponse.json(results)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Search failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
