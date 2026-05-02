import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('mark_read'),
    ids: z.array(z.string().uuid()).min(1).max(100),
  }),
  z.object({ action: z.literal('mark_all_read') }),
])

/**
 * GET /api/notifications — recent notifications + unread count for the signed-in learner.
 * PATCH — mark specific ids read, or mark all read.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 30), 1), 100)

  const admin = createServiceRoleSupabaseClient()

  const [{ data: items, error: listError }, { count: unreadCount, error: countError }] =
    await Promise.all([
      admin
        .from('user_notifications')
        .select('id, category, title, body, link_url, metadata, read_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit),
      admin
        .from('user_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null),
    ])

  if (listError) {
    return NextResponse.json({ success: false, error: listError.message }, { status: 500 })
  }
  if (countError) {
    return NextResponse.json({ success: false, error: countError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: {
      items: items ?? [],
      unreadCount: unreadCount ?? 0,
    },
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const now = new Date().toISOString()

  if (parsed.data.action === 'mark_all_read') {
    const { error } = await admin
      .from('user_notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .is('read_at', null)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: { updated: 'all' } })
  }

  const { error } = await admin
    .from('user_notifications')
    .update({ read_at: now })
    .eq('user_id', user.id)
    .in('id', parsed.data.ids)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: { updated: parsed.data.ids.length } })
}
