import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { mergeExperienceIntoSettings } from '@/lib/themes/courseSettingsExperience'
import { setCourseOrgTagIds } from '@/lib/courseTags'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()

  const { data, error } = await admin
    .from('courses')
    .select('*, modules(id, title, content, modality_variants, order_index, quiz, sim_scenario_id, created_at)')
    .eq('id', id)
    .eq('created_by', user.id)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { data: tagLinks } = await admin
    .from('course_org_tags')
    .select('org_tag_id')
    .eq('course_id', id)

  const org_tag_ids = (tagLinks ?? []).map((r) => r.org_tag_id).filter(Boolean)
  const row = data as Record<string, unknown>
  return NextResponse.json({ ...row, org_tag_ids })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const body = await request.json() as Record<string, unknown>

  let appliedOrgTags = false
  if (Array.isArray(body.org_tag_ids) && body.org_tag_ids.every((x) => typeof x === 'string')) {
    try {
      await setCourseOrgTagIds(admin, id, body.org_tag_ids as string[])
      appliedOrgTags = true
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Tag update failed'
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  }

  const allowed = [
    'title',
    'description',
    'difficulty',
    'estimated_duration_mins',
    'tags',
    'status',
    'is_adaptive',
    'settings',
    'template',
    'thumbnail_url',
    'banner_url',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) {
      if (appliedOrgTags && key === 'tags') continue
      updates[key] = body[key]
    }
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
    const incoming = body.settings as Record<string, unknown>
    const merged = { ...current, ...incoming }
    updates.settings = mergeExperienceIntoSettings(merged, incoming, current)
  }

  const { data, error } = await admin
    .from('courses')
    .update(updates)
    .eq('id', id)
    .eq('created_by', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: tagLinks } = await admin.from('course_org_tags').select('org_tag_id').eq('course_id', id)
  const org_tag_ids = (tagLinks ?? []).map((r) => r.org_tag_id).filter(Boolean)
  const row = data as Record<string, unknown>
  return NextResponse.json({ ...row, org_tag_ids })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()

  const { error } = await admin
    .from('courses')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
