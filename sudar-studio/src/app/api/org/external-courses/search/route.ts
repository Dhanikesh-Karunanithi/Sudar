import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getProviderAdapter } from '@/lib/providers'

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireOrgAdmin(session.user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const provider = request.nextUrl.searchParams.get('provider') ?? ''
  const query = request.nextUrl.searchParams.get('q') ?? ''
  if (!query.trim()) return NextResponse.json({ results: [] })

  const adapter = getProviderAdapter(provider)
  if (!adapter) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  const results = await adapter.search(query.trim())
  return NextResponse.json({ results })
}
