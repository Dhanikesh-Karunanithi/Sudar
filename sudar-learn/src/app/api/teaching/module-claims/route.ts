import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { claimsForModule } from '@/lib/teaching/claimGraph'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const moduleId = request.nextUrl.searchParams.get('module_id')
  if (!moduleId) {
    return NextResponse.json({ success: false, error: 'module_id required' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const claims = await claimsForModule(admin, moduleId)
  return NextResponse.json({ success: true, data: { claims } })
}
