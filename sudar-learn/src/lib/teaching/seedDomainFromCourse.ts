import type { SupabaseClient } from '@supabase/supabase-js'

type ModuleRow = {
  id: string
  title: string | null
  description: string | null
  content: unknown
  order_index: number | null
}

function extractObjectives(mod: ModuleRow): string[] {
  const out: string[] = []
  const title = (mod.title ?? '').trim()
  const desc = (mod.description ?? '').trim()
  if (title) out.push(title)
  if (desc && desc.length > 20) {
    out.push(desc.slice(0, 240))
  }
  const content = mod.content
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    const obj = content as Record<string, unknown>
    const learningObjectives = obj.learning_objectives ?? obj.objectives
    if (Array.isArray(learningObjectives)) {
      for (const o of learningObjectives) {
        if (typeof o === 'string' && o.trim()) out.push(o.trim().slice(0, 240))
      }
    }
    if (typeof obj.summary === 'string' && obj.summary.trim()) {
      out.push(obj.summary.trim().slice(0, 240))
    }
  }
  // Dedupe
  const seen = new Set<string>()
  return out.filter((s) => {
    const k = s.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function defaultMisconceptions(stem: string): string[] {
  return [
    `Confusing “${stem.slice(0, 40)}” with a related but different idea`,
    'Memorizing the label without being able to apply it',
  ]
}

/**
 * Seed (or refresh) a learning domain from a published course's modules.
 * Prefer module titles/objectives over free LLM dumps. Idempotent per org+course.
 */
export async function seedDomainFromCourse(
  admin: SupabaseClient,
  args: { orgId: string; courseId: string; replaceClaims?: boolean },
): Promise<{ domainId: string; claimCount: number; created: boolean }> {
  const { data: course, error: courseErr } = await admin
    .from('courses')
    .select('id, title, description, org_id')
    .eq('id', args.courseId)
    .maybeSingle()
  if (courseErr || !course) {
    throw new Error(courseErr?.message ?? 'Course not found')
  }
  const orgId = args.orgId || String(course.org_id)

  const { data: existing } = await admin
    .from('learning_domains')
    .select('id')
    .eq('org_id', orgId)
    .eq('source_course_id', args.courseId)
    .maybeSingle()

  let domainId: string
  let created = false
  if (existing?.id) {
    domainId = String(existing.id)
    await admin
      .from('learning_domains')
      .update({
        title: String(course.title ?? 'Course domain'),
        description: course.description != null ? String(course.description) : null,
        updated_at: new Date().toISOString(),
        source: 'course',
      })
      .eq('id', domainId)
    if (args.replaceClaims) {
      const { data: oldClaims } = await admin
        .from('learning_claims')
        .select('id')
        .eq('domain_id', domainId)
      const ids = (oldClaims ?? []).map((c) => String(c.id))
      if (ids.length) {
        await admin.from('claim_content_links').delete().in('claim_id', ids)
        await admin.from('claim_edges').delete().eq('domain_id', domainId)
        await admin.from('learning_claims').delete().eq('domain_id', domainId)
      }
    }
  } else {
    const { data: inserted, error } = await admin
      .from('learning_domains')
      .insert({
        org_id: orgId,
        title: String(course.title ?? 'Course domain'),
        description: course.description != null ? String(course.description) : null,
        source: 'course',
        source_course_id: args.courseId,
        version: 1,
        metadata: { seeded_from: 'course' },
      })
      .select('id')
      .single()
    if (error || !inserted) throw new Error(error?.message ?? 'Failed to create domain')
    domainId = String(inserted.id)
    created = true
  }

  const { data: claimCheck } = await admin
    .from('learning_claims')
    .select('id')
    .eq('domain_id', domainId)
    .limit(1)
  if (claimCheck?.length && !args.replaceClaims) {
    return { domainId, claimCount: claimCheck.length, created }
  }

  const { data: modules } = await admin
    .from('modules')
    .select('id, title, description, content, order_index')
    .eq('course_id', args.courseId)
    .order('order_index', { ascending: true })

  const claimIds: string[] = []
  let sort = 0
  for (const mod of (modules ?? []) as ModuleRow[]) {
    const objectives = extractObjectives(mod)
    const stems = objectives.length
      ? objectives
      : [`Understand: ${mod.title ?? 'module'}`]
    for (const stem of stems) {
      const { data: claim, error } = await admin
        .from('learning_claims')
        .insert({
          domain_id: domainId,
          stem,
          misconceptions: defaultMisconceptions(stem),
          bloom: 'understand',
          evidence_types: ['explain_back', 'quiz', 'apply'],
          metadata: { module_id: mod.id, module_title: mod.title },
          sort_order: sort++,
        })
        .select('id')
        .single()
      if (error || !claim) continue
      const claimId = String(claim.id)
      claimIds.push(claimId)
      await admin.from('claim_content_links').upsert(
        {
          claim_id: claimId,
          link_kind: 'module',
          target_id: String(mod.id),
          metadata: {},
        },
        { onConflict: 'claim_id,link_kind,target_id' },
      )
    }
  }

  // Chain prerequisites in module order (claim i → claim i+1)
  for (let i = 0; i < claimIds.length - 1; i++) {
    await admin.from('claim_edges').upsert(
      {
        domain_id: domainId,
        from_claim_id: claimIds[i],
        to_claim_id: claimIds[i + 1],
        kind: 'prerequisite',
      },
      { onConflict: 'from_claim_id,to_claim_id,kind' },
    )
  }

  return { domainId, claimCount: claimIds.length, created }
}
