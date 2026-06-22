import { createClient } from '@/lib/supabase/server'
import { getActiveOrgId, listOrgMemberships } from '@/lib/org'
import { NextResponse } from 'next/server'

/**
 * GET /api/org/memberships — List organisations the current user belongs to.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [memberships, activeOrgId] = await Promise.all([
    listOrgMemberships(user.id),
    getActiveOrgId(user.id),
  ])

  return NextResponse.json({
    active_org_id: activeOrgId,
    memberships,
  })
}
