/**
 * ALP — log tutor inline choice for embed clients (no browser Supabase session).
 */
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateAlpKey, getAlpKeyFromRequest, isUserInOrg, validateEmbedToken } from '@/lib/alp-auth'

const bodySchema = z.object({
  user_id: z.string().uuid(),
  block_id: z.string().trim().min(1).max(64),
  choice_id: z.string().trim().min(1).max(32),
  label: z.string().trim().max(120).optional(),
  course_id: z.string().uuid().optional(),
  module_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  const authHeader = getAlpKeyFromRequest(request)
  let userId: string | null = null
  let orgId: string | undefined

  if (authHeader?.includes('.')) {
    const payload = validateEmbedToken(authHeader)
    if (payload) userId = payload.sub
  }
  if (!userId) {
    const auth = await validateAlpKey(authHeader)
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.orgId) orgId = auth.orgId
  }

  let body: z.infer<typeof bodySchema>
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!userId) userId = body.user_id
  if (userId !== body.user_id) {
    return NextResponse.json({ error: 'user_id does not match token' }, { status: 403 })
  }

  const admin = createAdminClient()
  if (orgId) {
    const inOrg = await isUserInOrg(admin, userId, orgId)
    if (!inOrg) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await admin.from('learning_events').insert({
    user_id: userId,
    course_id: body.course_id ?? null,
    module_id: body.module_id ?? null,
    event_type: 'tutor_choice_selected',
    modality: 'text',
    payload: {
      block_id: body.block_id,
      choice_id: body.choice_id,
      label: body.label ?? null,
      source: 'alp_embed',
    },
  })

  return NextResponse.json({ ok: true })
}
