import { unstable_cache } from 'next/cache'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

const CATALOG_REVALIDATE_SECONDS = 90
const PATHS_REVALIDATE_SECONDS = 90

type CourseCatalogRow = {
  id: string
  title: string
  description: string | null
  difficulty: string | null
  tags: string[] | null
  estimated_duration_mins: number | null
  published_at: string | null
  thumbnail_url: string | null
  banner_url: string | null
  is_external?: boolean
  external_provider?: string | null
  modules?: { count: number }[] | null
}

function withModuleCount(row: CourseCatalogRow) {
  const { modules, ...rest } = row
  const c = modules?.[0]?.count
  return {
    ...rest,
    module_count: typeof c === 'number' ? c : 0,
  }
}

/** Cached published courses list (shared by catalog page and tutor API). */
export async function getCachedPublishedCourses() {
  return unstable_cache(
    async () => {
      const admin = createServiceRoleSupabaseClient()
      const { data } = await admin
        .from('courses')
        .select(
          'id, title, description, difficulty, tags, estimated_duration_mins, published_at, thumbnail_url, banner_url, is_external, external_provider, modules(count)',
        )
        .eq('status', 'published')
        .order('published_at', { ascending: false })
      const rows = (data ?? []) as CourseCatalogRow[]
      return rows.map(withModuleCount)
    },
    ['courses-published'],
    { revalidate: CATALOG_REVALIDATE_SECONDS }
  )()
}

/** Cached published learning paths list. */
export async function getCachedPublishedPaths() {
  return unstable_cache(
    async () => {
      const admin = createServiceRoleSupabaseClient()
      const { data } = await admin
        .from('learning_paths')
        .select('id, title, description, courses, is_mandatory, status, issues_certificate, is_adaptive')
        .eq('status', 'published')
        .order('is_mandatory', { ascending: false })
      return data ?? []
    },
    ['paths-published'],
    { revalidate: PATHS_REVALIDATE_SECONDS }
  )()
}
