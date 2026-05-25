/**
 * MCP tool invocation audit (Studio creator tools).
 */
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Json } from '@/types/database'

const bodySchema = z.object({
  tool: z.string().min(1).max(128),
  success: z.boolean().optional(),
  surface: z.string().max(32).optional(),
  host: z.string().max(64).optional(),
})

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { error } = await admin.from('learning_events').insert({
    user_id: session.user.id,
    event_type: 'ai_tutor_query',
    modality: 'text',
    payload: {
      source: 'mcp',
      tool: parsed.data.tool,
      success: parsed.data.success ?? true,
      surface: parsed.data.surface ?? 'studio',
      host: parsed.data.host ?? null,
    } as Json,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
