import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { searchImages, type ImageResult } from '@/lib/media/imageSearch'

export type MediaSearchResult = ImageResult

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const source = searchParams.get('source') ?? 'pexels'

  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 })
  if (!['pexels', 'unsplash', 'google'].includes(source)) {
    return NextResponse.json({ error: 'source must be pexels, unsplash, or google' }, { status: 400 })
  }

  try {
    const preferredSource = source as 'google' | 'pexels' | 'unsplash'
    const results = await searchImages(q, {
      count: 15,
      preferredSource,
    })
    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json({ error: `Media search failed: ${err}` }, { status: 500 })
  }
}
