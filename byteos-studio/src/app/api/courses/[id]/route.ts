import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('courses')
    .select('*, modules(id, title, content, modality_variants, order_index, quiz, created_at)')
    .eq('id', id)
    .eq('created_by', user.id)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const body = await request.json()
  const allowed = ['title', 'description', 'difficulty', 'estimated_duration_mins', 'tags', 'status', 'is_adaptive', 'settings', 'template']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  // Merge settings so video_scenes, podcast_dialogue, include_video, include_podcast don't wipe other settings
  if ('settings' in body && typeof body.settings === 'object' && body.settings !== null) {
    const { data: existing } = await admin
      .from('courses')
      .select('settings')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()
    const current = (existing?.settings as Record<string, unknown>) ?? {}
    updates.settings = { ...current, ...body.settings }
  }

  const { data, error } = await admin
    .from('courses')
    .update(updates)
    .eq('id', id)
    .eq('created_by', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { error } = await admin
    .from('courses')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
