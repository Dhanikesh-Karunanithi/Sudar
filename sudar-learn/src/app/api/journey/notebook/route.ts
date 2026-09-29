import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { sanitizeNotebookSnapshot } from '@/lib/journey/notebookStorage'
import { isJourneyEnabled } from '@/lib/journey/isJourneyEnabled'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  JOURNEY_NOTEBOOK_MAX_BYTES,
  JOURNEY_NOTEBOOK_MAX_PAGES,
  JOURNEY_NOTEBOOK_THREAD_KEY,
} from '@/types/journeyNotebook'

const putSchema = z.object({
  pages: z.array(z.unknown()).max(JOURNEY_NOTEBOOK_MAX_PAGES),
  working_memory: z.unknown(),
  session: z.unknown().optional(),
})

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** `sudar_notes_sessions` is not in the generated Database types yet. */
function notesDb(): SupabaseClient {
  return createServiceRoleSupabaseClient() as unknown as SupabaseClient
}

async function findRowId(admin: SupabaseClient, userId: string) {
  const { data } = await admin
    .from('sudar_notes_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('thread_key', JOURNEY_NOTEBOOK_THREAD_KEY)
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

export async function GET() {
  if (!isJourneyEnabled()) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  const user = await requireUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = notesDb()
  const { data, error } = await admin
    .from('sudar_notes_sessions')
    .select('state, updated_at')
    .eq('user_id', user.id)
    .eq('thread_key', JOURNEY_NOTEBOOK_THREAD_KEY)
    .maybeSingle()
  if (error) return NextResponse.json({ success: false, error: 'Could not load notebook' }, { status: 500 })

  const row = data as { state: Record<string, unknown> | null; updated_at: string } | null
  if (!row?.state) return NextResponse.json({ success: true, data: null })
  return NextResponse.json({
    success: true,
    data: { snapshot: sanitizeNotebookSnapshot(row.state), updated_at: row.updated_at },
  })
}

export async function PUT(request: NextRequest) {
  if (!isJourneyEnabled()) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  const user = await requireUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const raw = await request.text()
  if (raw.length > JOURNEY_NOTEBOOK_MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Notebook is too large to sync' }, { status: 413 })
  }
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid notebook payload' }, { status: 400 })
  }

  const snapshot = sanitizeNotebookSnapshot(parsed.data)
  const admin = notesDb()
  const now = new Date().toISOString()
  const existingId = await findRowId(admin, user.id)
  const { error } = existingId
    ? await admin
        .from('sudar_notes_sessions')
        .update({ state: snapshot, updated_at: now })
        .eq('id', existingId)
    : await admin.from('sudar_notes_sessions').insert({
        user_id: user.id,
        thread_key: JOURNEY_NOTEBOOK_THREAD_KEY,
        state: snapshot,
      })
  if (error) return NextResponse.json({ success: false, error: 'Could not save notebook' }, { status: 500 })
  return NextResponse.json({ success: true, data: { updated_at: now, pages: snapshot.pages.length } })
}

export async function DELETE() {
  if (!isJourneyEnabled()) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  const user = await requireUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = notesDb()
  const { error } = await admin
    .from('sudar_notes_sessions')
    .delete()
    .eq('user_id', user.id)
    .eq('thread_key', JOURNEY_NOTEBOOK_THREAD_KEY)
  if (error) return NextResponse.json({ success: false, error: 'Could not clear notebook' }, { status: 500 })
  return NextResponse.json({ success: true })
}
