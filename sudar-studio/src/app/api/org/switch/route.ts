import { createClient } from '@/lib/supabase/server'
import { switchActiveOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  org_id: z.string().uuid(),
})

/**
 * POST /api/org/switch — Set active organisation for Studio session context.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    await switchActiveOrg(user.id, parsed.data.org_id)
    return NextResponse.json({ success: true, active_org_id: parsed.data.org_id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Forbidden'
    const status = message.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
