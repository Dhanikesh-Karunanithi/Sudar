import { NextResponse } from 'next/server'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { isJourneyEnabled } from '@/lib/journey/isJourneyEnabled'
import { listLearnerDomains } from '@/lib/teaching/domainAccess'

/** Teaching OS domains in the learner's org — SudarNotes topic picker. */
export async function GET() {
  if (!isJourneyEnabled()) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  try {
    const domains = await listLearnerDomains(admin, user.id)
    return NextResponse.json({ success: true, data: { domains } })
  } catch {
    return NextResponse.json({ success: true, data: { domains: [] } })
  }
}
