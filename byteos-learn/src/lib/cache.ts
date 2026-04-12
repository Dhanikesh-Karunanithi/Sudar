import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

const CATALOG_REVALIDATE_SECONDS = 90
const PATHS_REVALIDATE_SECONDS = 90

/** Cached published courses list (shared by catalog page and tutor API). */
export async function getCachedPublishedCourses() {
  return unstable_cache(
    async () => {
      const admin = createAdminClient()
      const { data } = await admin
        .from('courses')
        .select('id, title, description, difficulty, tags, estimated_duration_mins, published_at, thumbnail_url, banner_url')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
      return data ?? []
    },
    ['courses-published'],
    { revalidate: CATALOG_REVALIDATE_SECONDS }
  )()
}

/** Cached published learning paths list. */
export async function getCachedPublishedPaths() {
  return unstable_cache(
    async () => {
      const admin = createAdminClient()
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
