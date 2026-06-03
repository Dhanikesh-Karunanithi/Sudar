import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { learnerKbUploadAllowed } from '@/lib/knowledge-base/resolveOrgKbIds'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  scope: z.enum(['org', 'subject', 'course']).default('org'),
  course_id: z.string().uuid().optional().nullable(),
})

async function getUserOrg(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', userId).maybeSingle()
  return profile?.org_id as string | undefined
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getUserOrg(supabase, user.id)
  if (!orgId) return NextResponse.json({ knowledge_bases: [] })

  const admin = createServiceRoleSupabaseClient()
  const { data, error } = await admin
    .from('knowledge_bases')
    .select('id, name, description, scope, course_id, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ knowledge_bases: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getUserOrg(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'No organisation' }, { status: 400 })

  const admin = createServiceRoleSupabaseClient()
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).maybeSingle()
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle()

  const role = membership?.role as string | undefined
  const canCreate =
    role && ['ADMIN', 'MANAGER', 'CREATOR'].includes(role)
      ? true
      : learnerKbUploadAllowed(org?.settings)

  if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = createSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { name, description, scope, course_id } = parsed.data
  const { data, error } = await admin
    .from('knowledge_bases')
    .insert({
      org_id: orgId,
      name,
      description: description ?? null,
      scope,
      course_id: course_id ?? null,
      created_by: user.id,
    })
    .select('id, name, scope, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ knowledge_base: data })
}
