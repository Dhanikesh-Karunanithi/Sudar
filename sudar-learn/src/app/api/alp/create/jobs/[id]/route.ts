/**
 * ALP Create — Poll async generation job status.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAlpKeyFromRequest, validateAlpKey } from '@/lib/alp-auth'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { contentGenerationJobsTable } from '@/lib/alp/contentGenerationJobsDb'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const key = getAlpKeyFromRequest(request)
  const auth = await validateAlpKey(key)
  if (!auth.valid || !auth.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.valid ? 403 : 401 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: job, error } = await contentGenerationJobsTable(admin)
    .select('id, org_id, status, progress, result_payload, error_message, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!job || job.org_id !== auth.orgId) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    job_id: job.id,
    status: job.status,
    progress: job.progress,
    result: job.result_payload,
    error: job.error_message,
    created_at: job.created_at,
    updated_at: job.updated_at,
  })
}
