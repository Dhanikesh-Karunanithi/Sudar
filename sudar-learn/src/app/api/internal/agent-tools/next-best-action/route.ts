/**
 * Service-to-service NBA recompute for Sudar Intelligence agent tools.
 * Auth: INTELLIGENCE_SERVICE_SECRET (header or Bearer).
 */
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { verifyIntelligenceServiceRequest } from '@/lib/security/agentServiceAuth'
import { computeNextBestActionForUser } from '@/lib/intelligence/nextBestActionEngine'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  user_id: z.string().uuid(),
  force: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  if (!verifyIntelligenceServiceRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: z.infer<typeof bodySchema>
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const result = await computeNextBestActionForUser(admin, body.user_id, {
    force: body.force === true,
  })
  return NextResponse.json({ ...result })
}
