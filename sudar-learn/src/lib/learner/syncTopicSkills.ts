import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Admin = SupabaseClient<Database>

function topicSlug(orgId: string, label: string): string {
  const n = label.toLowerCase().trim().slice(0, 120)
  const h = createHash('sha256').update(`${orgId}\0${n}`).digest('hex').slice(0, 22)
  return `t_${h}`
}

async function ensureSkill(admin: Admin, orgId: string, label: string): Promise<string | null> {
  const name = label.trim()
  if (!name) return null
  const slug = topicSlug(orgId, name)
  const { data: hit } = await admin.from('skills').select('id').eq('slug', slug).maybeSingle()
  if (hit?.id) return hit.id

  const { data: row, error } = await admin
    .from('skills')
    .insert({ slug, name, org_id: orgId, category: 'inferred' })
    .select('id')
    .single()
  if (error || !row?.id) return null
  return row.id
}

/** Upsert struggle signals into skills / learner_skills / skill_gaps (org-scoped). */
export async function recordStruggleTopics(
  admin: Admin,
  userId: string,
  orgId: string,
  topics: string[]
): Promise<void> {
  const unique = [...new Set(topics.map((t) => t.trim()).filter(Boolean))]
  if (!unique.length) return

  for (const label of unique) {
    const skillId = await ensureSkill(admin, orgId, label)
    if (!skillId) continue

    const { data: openGap } = await admin
      .from('skill_gaps')
      .select('id')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .is('resolved_at', null)
      .maybeSingle()

    if (!openGap) {
      await admin.from('skill_gaps').insert({
        user_id: userId,
        skill_id: skillId,
        gap_score: 0.72,
        identified_at: new Date().toISOString(),
      })
    }

    const { data: existing } = await admin
      .from('learner_skills')
      .select('id, proficiency_level, evidence_count')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .maybeSingle()

    if (existing?.id) {
      const prof = typeof existing.proficiency_level === 'number' ? existing.proficiency_level : 0.5
      await admin
        .from('learner_skills')
        .update({
          proficiency_level: Math.max(0.05, prof - 0.1),
          evidence_count: (existing.evidence_count ?? 0) + 1,
          last_assessed_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await admin.from('learner_skills').insert({
        user_id: userId,
        skill_id: skillId,
        proficiency_level: 0.36,
        evidence_count: 1,
        last_assessed_at: new Date().toISOString(),
      })
    }
  }
}

/** Reinforce mastery from tutor / memory extractions. */
export async function recordMasteredTopics(
  admin: Admin,
  userId: string,
  orgId: string,
  topics: string[]
): Promise<void> {
  const unique = [...new Set(topics.map((t) => t.trim()).filter(Boolean))]
  if (!unique.length) return

  for (const label of unique) {
    const skillId = await ensureSkill(admin, orgId, label)
    if (!skillId) continue

    await admin
      .from('skill_gaps')
      .update({ resolved_at: new Date().toISOString(), gap_score: 0.15 })
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .is('resolved_at', null)

    const { data: existing } = await admin
      .from('learner_skills')
      .select('id, proficiency_level, evidence_count')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .maybeSingle()

    if (existing?.id) {
      const prof = typeof existing.proficiency_level === 'number' ? existing.proficiency_level : 0.5
      await admin
        .from('learner_skills')
        .update({
          proficiency_level: Math.min(0.98, prof + 0.08),
          evidence_count: (existing.evidence_count ?? 0) + 1,
          last_assessed_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await admin.from('learner_skills').insert({
        user_id: userId,
        skill_id: skillId,
        proficiency_level: 0.62,
        evidence_count: 1,
        last_assessed_at: new Date().toISOString(),
      })
    }
  }
}

/** Skill names from open gaps + parent names for prerequisite hinting. */
export async function loadSkillGapSummary(admin: Admin, userId: string): Promise<string> {
  const { data: gaps } = await admin
    .from('skill_gaps')
    .select('skill_id, gap_score')
    .eq('user_id', userId)
    .is('resolved_at', null)
    .order('identified_at', { ascending: false })
    .limit(12)

  if (!gaps?.length) return ''

  const skillIds = [...new Set(gaps.map((g) => g.skill_id))]
  const { data: skillRows } = await admin
    .from('skills')
    .select('id, name, parent_skill_id')
    .in('id', skillIds)

  const byId = Object.fromEntries((skillRows ?? []).map((s) => [s.id, s]))
  const parentIds = [
    ...new Set(
      (skillRows ?? []).map((s) => s.parent_skill_id).filter(Boolean) as string[]
    ),
  ]
  let parentNames: Record<string, string> = {}
  if (parentIds.length) {
    const { data: parents } = await admin.from('skills').select('id, name').in('id', parentIds)
    parentNames = Object.fromEntries((parents ?? []).map((p) => [p.id, p.name]))
  }

  const lines = gaps
    .map((g) => {
      const s = byId[g.skill_id]
      if (!s?.name) return null
      const parent = s.parent_skill_id ? parentNames[s.parent_skill_id] : null
      const gv = typeof g.gap_score === 'number' ? ` (gap ${Math.round(g.gap_score * 100)}%)` : ''
      return parent ? `- ${s.name}${gv} — prerequisite area: ${parent}` : `- ${s.name}${gv}`
    })
    .filter(Boolean) as string[]

  if (!lines.length) return ''
  return `\nStructured skill gaps (from assessments and practice):\n${lines.join('\n')}`
}

/** Topic labels from open skill gaps (for NBA / search scoring). */
export async function gapTopicLabelsForUser(admin: Admin, userId: string): Promise<string[]> {
  const { data: gaps } = await admin
    .from('skill_gaps')
    .select('skill_id')
    .eq('user_id', userId)
    .is('resolved_at', null)
    .limit(24)

  if (!gaps?.length) return []
  const ids = [...new Set(gaps.map((g) => g.skill_id))]
  const { data: skills } = await admin.from('skills').select('id, name').in('id', ids)
  return (skills ?? []).map((s) => s.name.toLowerCase()).filter(Boolean)
}
