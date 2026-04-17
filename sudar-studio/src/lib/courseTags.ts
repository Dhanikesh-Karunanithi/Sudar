import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const AI_SUGGESTED_GROUP_NAME = 'AI suggested'

/** Normalise a human label to a stable slug (unique per org with org_tags.org_slug_unique). */
export function slugifyTagLabel(label: string): string {
  const s = label
    .trim()
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s.length > 0 ? s : 'tag'
}

type Admin = SupabaseClient<Database>

export async function getOrCreateAISuggestedGroup(admin: Admin, orgId: string): Promise<string> {
  const { data: existing } = await admin
    .from('tag_groups')
    .select('id')
    .eq('org_id', orgId)
    .eq('name', AI_SUGGESTED_GROUP_NAME)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data: created, error } = await admin
    .from('tag_groups')
    .insert({
      org_id: orgId,
      name: AI_SUGGESTED_GROUP_NAME,
      sort_order: 999,
    })
    .select('id')
    .single()

  if (error || !created) throw new Error(error?.message ?? 'Failed to create AI suggested tag group')
  return created.id
}

/** Replace junction rows and refresh `courses.tags` from master tag labels. */
export async function setCourseOrgTagIds(
  admin: Admin,
  courseId: string,
  orgTagIds: string[]
): Promise<void> {
  const { error: delErr } = await admin.from('course_org_tags').delete().eq('course_id', courseId)
  if (delErr) throw new Error(delErr.message)

  if (orgTagIds.length === 0) {
    await syncCourseDenormalizedTags(admin, courseId)
    return
  }

  const rows = orgTagIds.map((orgTagId) => ({
    course_id: courseId,
    org_tag_id: orgTagId,
  }))
  const { error: insErr } = await admin.from('course_org_tags').insert(rows)
  if (insErr) throw new Error(insErr.message)

  await syncCourseDenormalizedTags(admin, courseId)
}

/** Sets `courses.tags` to sorted unique labels from `course_org_tags` → `org_tags`. */
export async function syncCourseDenormalizedTags(admin: Admin, courseId: string): Promise<string[]> {
  const { data: rows, error } = await admin
    .from('course_org_tags')
    .select('org_tag_id')
    .eq('course_id', courseId)

  if (error) throw new Error(error.message)

  const ids = (rows ?? []).map((r) => r.org_tag_id).filter(Boolean)
  if (ids.length === 0) {
    const { error: upErr } = await admin.from('courses').update({ tags: [] }).eq('id', courseId)
    if (upErr) throw new Error(upErr.message)
    return []
  }

  const { data: labels, error: labErr } = await admin
    .from('org_tags')
    .select('label')
    .in('id', ids)

  if (labErr) throw new Error(labErr.message)

  const unique = [...new Set((labels ?? []).map((l) => l.label.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  )

  const { error: upErr } = await admin.from('courses').update({ tags: unique }).eq('id', courseId)
  if (upErr) throw new Error(upErr.message)

  return unique
}

export type OrgTagRow = { id: string; slug: string; label: string }

/**
 * Maps desired labels to org_tag ids, preferring existing tags (slug or case-insensitive label).
 * Creates missing tags under the "AI suggested" group.
 */
export async function resolveOrCreateOrgTagsForLabels(
  admin: Admin,
  orgId: string,
  labels: string[],
  catalog: OrgTagRow[]
): Promise<string[]> {
  const trimmed = [...new Set(labels.map((l) => l.trim()).filter(Boolean))]
  if (trimmed.length === 0) return []

  const bySlug = new Map(catalog.map((t) => [t.slug.toLowerCase(), t] as const))
  const byLabelLower = new Map(catalog.map((t) => [t.label.toLowerCase(), t] as const))

  const aiGroupId = await getOrCreateAISuggestedGroup(admin, orgId)
  const resultIds: string[] = []

  for (const label of trimmed) {
    const slug = slugifyTagLabel(label)
    const existing =
      bySlug.get(slug.toLowerCase()) ?? byLabelLower.get(label.toLowerCase())
    if (existing) {
      resultIds.push(existing.id)
      continue
    }

    const { data: inserted, error } = await admin
      .from('org_tags')
      .insert({
        org_id: orgId,
        group_id: aiGroupId,
        slug,
        label: label.length > 80 ? `${label.slice(0, 77)}...` : label,
      })
      .select('id, slug, label')
      .single()

    if (error) {
      const { data: retry } = await admin
        .from('org_tags')
        .select('id, slug, label')
        .eq('org_id', orgId)
        .eq('slug', slug)
        .maybeSingle()
      if (retry?.id) {
        resultIds.push(retry.id)
        bySlug.set(retry.slug.toLowerCase(), retry)
        byLabelLower.set(retry.label.toLowerCase(), retry)
        continue
      }
      throw new Error(error.message)
    }

    if (inserted) {
      resultIds.push(inserted.id)
      bySlug.set(inserted.slug.toLowerCase(), inserted)
      byLabelLower.set(inserted.label.toLowerCase(), inserted)
    }
  }

  return [...new Set(resultIds)]
}

export async function fetchOrgTagCatalog(admin: Admin, orgId: string): Promise<OrgTagRow[]> {
  const { data, error } = await admin
    .from('org_tags')
    .select('id, slug, label')
    .eq('org_id', orgId)

  if (error) throw new Error(error.message)
  return (data ?? []) as OrgTagRow[]
}
