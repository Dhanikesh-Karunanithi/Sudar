import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClaimContentLink, ClaimEdge, LearningClaim, LearningDomain } from '@/types/teaching'

export interface DomainGraph {
  domain: LearningDomain
  claims: LearningClaim[]
  edges: ClaimEdge[]
  links: ClaimContentLink[]
}

function mapClaim(row: Record<string, unknown>): LearningClaim {
  const misconceptions = Array.isArray(row.misconceptions)
    ? (row.misconceptions as unknown[]).filter((m): m is string => typeof m === 'string')
    : []
  const evidence_types = Array.isArray(row.evidence_types)
    ? (row.evidence_types as LearningClaim['evidence_types'])
    : (['explain_back', 'quiz'] as LearningClaim['evidence_types'])
  return {
    id: String(row.id),
    domain_id: String(row.domain_id),
    stem: String(row.stem ?? ''),
    misconceptions,
    bloom: row.bloom != null ? String(row.bloom) : null,
    evidence_types,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at != null ? String(row.created_at) : undefined,
  }
}

export async function loadDomainGraph(
  admin: SupabaseClient,
  domainId: string,
): Promise<DomainGraph | null> {
  const { data: domain, error } = await admin
    .from('learning_domains')
    .select('*')
    .eq('id', domainId)
    .maybeSingle()
  if (error || !domain) return null

  const [{ data: claims }, { data: edges }, { data: links }] = await Promise.all([
    admin.from('learning_claims').select('*').eq('domain_id', domainId).order('sort_order'),
    admin.from('claim_edges').select('*').eq('domain_id', domainId),
    admin
      .from('claim_content_links')
      .select('*, learning_claims!inner(domain_id)')
      .eq('learning_claims.domain_id', domainId),
  ])

  const claimRows = (claims ?? []).map((c) => mapClaim(c as Record<string, unknown>))
  const claimIds = new Set(claimRows.map((c) => c.id))

  let linkRows: ClaimContentLink[] = []
  if (links && links.length > 0) {
    linkRows = (links as Array<Record<string, unknown>>).map((l) => ({
      id: String(l.id),
      claim_id: String(l.claim_id),
      link_kind: l.link_kind as ClaimContentLink['link_kind'],
      target_id: String(l.target_id),
      metadata: (l.metadata as Record<string, unknown>) ?? {},
    }))
  } else if (claimIds.size > 0) {
    const { data: fallbackLinks } = await admin
      .from('claim_content_links')
      .select('*')
      .in('claim_id', [...claimIds])
    linkRows = (fallbackLinks ?? []).map((l) => ({
      id: String(l.id),
      claim_id: String(l.claim_id),
      link_kind: l.link_kind as ClaimContentLink['link_kind'],
      target_id: String(l.target_id),
      metadata: (l.metadata as Record<string, unknown>) ?? {},
    }))
  }

  return {
    domain: {
      id: String(domain.id),
      org_id: String(domain.org_id),
      title: String(domain.title),
      description: domain.description != null ? String(domain.description) : null,
      source: domain.source as LearningDomain['source'],
      source_course_id: domain.source_course_id != null ? String(domain.source_course_id) : null,
      version: Number(domain.version ?? 1),
      metadata: (domain.metadata as Record<string, unknown>) ?? {},
      created_at: domain.created_at != null ? String(domain.created_at) : undefined,
      updated_at: domain.updated_at != null ? String(domain.updated_at) : undefined,
    },
    claims: claimRows,
    edges: (edges ?? []).map((e) => ({
      id: String(e.id),
      domain_id: String(e.domain_id),
      from_claim_id: String(e.from_claim_id),
      to_claim_id: String(e.to_claim_id),
      kind: e.kind as ClaimEdge['kind'],
    })),
    links: linkRows,
  }
}

/** Claims that must be known before `claimId` (prerequisite closure). */
export function prerequisiteClosure(claimId: string, edges: ClaimEdge[]): string[] {
  const prereqOf = new Map<string, string[]>()
  for (const e of edges) {
    if (e.kind !== 'prerequisite') continue
    // from → to means from is prereq of to
    const list = prereqOf.get(e.to_claim_id) ?? []
    list.push(e.from_claim_id)
    prereqOf.set(e.to_claim_id, list)
  }
  const out = new Set<string>()
  const stack = [...(prereqOf.get(claimId) ?? [])]
  while (stack.length) {
    const id = stack.pop()!
    if (out.has(id)) continue
    out.add(id)
    for (const p of prereqOf.get(id) ?? []) stack.push(p)
  }
  return [...out]
}

export async function claimsForModule(
  admin: SupabaseClient,
  moduleId: string,
): Promise<LearningClaim[]> {
  const { data: links } = await admin
    .from('claim_content_links')
    .select('claim_id')
    .eq('link_kind', 'module')
    .eq('target_id', moduleId)
  const ids = (links ?? []).map((l) => String(l.claim_id))
  if (!ids.length) return []
  const { data: claims } = await admin.from('learning_claims').select('*').in('id', ids)
  return (claims ?? []).map((c) => mapClaim(c as Record<string, unknown>))
}

export async function findDomainForCourse(
  admin: SupabaseClient,
  orgId: string,
  courseId: string,
): Promise<LearningDomain | null> {
  const { data } = await admin
    .from('learning_domains')
    .select('*')
    .eq('org_id', orgId)
    .eq('source_course_id', courseId)
    .maybeSingle()
  if (!data) return null
  return {
    id: String(data.id),
    org_id: String(data.org_id),
    title: String(data.title),
    description: data.description != null ? String(data.description) : null,
    source: data.source as LearningDomain['source'],
    source_course_id: data.source_course_id != null ? String(data.source_course_id) : null,
    version: Number(data.version ?? 1),
    metadata: (data.metadata as Record<string, unknown>) ?? {},
  }
}
