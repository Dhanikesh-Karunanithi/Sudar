import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { searchVideosPexels } from '@/lib/media/videoSearch'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 })

  try {
    const results = await searchVideosPexels(q, 12)
    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json({ error: `Video search failed: ${err}` }, { status: 500 })
  }
}
