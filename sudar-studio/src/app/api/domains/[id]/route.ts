import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)

  const { data: domain, error } = await admin
    .from('learning_domains')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .maybeSingle()
  if (error || !domain) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: claims }, { data: edges }] = await Promise.all([
    admin.from('learning_claims').select('*').eq('domain_id', id).order('sort_order'),
    admin.from('claim_edges').select('*').eq('domain_id', id),
  ])

  const claimIds = (claims ?? []).map((c) => String(c.id))
  const { data: links } = claimIds.length
    ? await admin.from('claim_content_links').select('*').in('claim_id', claimIds)
    : { data: [] }

  return NextResponse.json({
    success: true,
    data: { domain, claims: claims ?? [], edges: edges ?? [], links: links ?? [] },
  })
}

const claimSchema = z.object({
  stem: z.string().min(1).max(500),
  misconceptions: z.array(z.string()).optional(),
  bloom: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  module_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const { data: domain } = await admin
    .from('learning_domains')
    .select('id')
    .eq('id', id)
    .eq('org_id', orgId)
    .maybeSingle()
  if (!domain) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = claimSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { data: claim, error } = await admin
    .from('learning_claims')
    .insert({
      domain_id: id,
      stem: parsed.data.stem,
      misconceptions: parsed.data.misconceptions ?? [],
      bloom: parsed.data.bloom ?? 'understand',
      evidence_types: ['explain_back', 'quiz', 'apply'],
      sort_order: parsed.data.sort_order ?? 0,
      metadata: parsed.data.module_id ? { module_id: parsed.data.module_id } : {},
    })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (parsed.data.module_id) {
    await admin.from('claim_content_links').upsert(
      {
        claim_id: claim.id,
        link_kind: 'module',
        target_id: parsed.data.module_id,
        metadata: {},
      },
      { onConflict: 'claim_id,link_kind,target_id' },
    )
  }

  return NextResponse.json({ success: true, data: claim })
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const body = await request.json().catch(() => null)
  const claimId = typeof body?.claim_id === 'string' ? body.claim_id : null
  if (!claimId) return NextResponse.json({ error: 'claim_id required' }, { status: 400 })

  const { data: domain } = await admin
    .from('learning_domains')
    .select('id')
    .eq('id', id)
    .eq('org_id', orgId)
    .maybeSingle()
  if (!domain) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const patch: Record<string, unknown> = {}
  if (typeof body.stem === 'string') patch.stem = body.stem
  if (Array.isArray(body.misconceptions)) patch.misconceptions = body.misconceptions
  if (body.bloom !== undefined) patch.bloom = body.bloom
  if (typeof body.sort_order === 'number') patch.sort_order = body.sort_order

  const { data: claim, error } = await admin
    .from('learning_claims')
    .update(patch)
    .eq('id', claimId)
    .eq('domain_id', id)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: claim })
}
