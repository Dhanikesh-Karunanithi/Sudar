import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rejectInvalidCronRequest } from '@/lib/security/cronAuth'
import { processKbQueueItem } from '@/lib/knowledge-base/processKbQueueItem'

const BATCH_SIZE = Number(process.env.KB_PROCESSING_MAX_CONCURRENCY ?? '5') || 5

export async function POST(request: NextRequest) {
  const denied = rejectInvalidCronRequest(request)
  if (denied) return denied

  const admin = createServiceRoleSupabaseClient()
  const { data: pending, error } = await admin
    .from('kb_ingest_queue')
    .select('id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: Array<{ id: string; ok: boolean; error?: string; chunkCount?: number }> = []
  for (const row of pending ?? []) {
    const id = row.id as string
    const result = await processKbQueueItem(admin, id)
    results.push({ id, ...result })
  }

  const processed = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok && r.error !== undefined && !r.error.startsWith('skip')).length

  return NextResponse.json({
    ok: true,
    batch: results.length,
    processed,
    failed,
    results,
  })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
