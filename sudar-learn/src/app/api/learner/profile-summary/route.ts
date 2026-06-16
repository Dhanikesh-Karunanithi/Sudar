import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, full_name')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    success: true,
    orgId: profile?.org_id ?? null,
    fullName: profile?.full_name ?? null,
  })
}
