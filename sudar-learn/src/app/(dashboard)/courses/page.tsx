import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { getCachedPublishedCourses } from '@/lib/cache'
import CourseCatalogClient from './CourseCatalogClient'

export const metadata: Metadata = { title: 'Courses' }

export default async function CourseCatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; tab?: string }>
}) {
  const { q, tab } = (await searchParams) ?? {}
  const initialTab = tab === 'discover' ? 'discover' : 'org'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceRoleSupabaseClient()

  const [courses, { data: enrollments }] = await Promise.all([
    getCachedPublishedCourses(),
    admin
      .from('enrollments')
      .select('course_id, status, progress_pct')
      .eq('user_id', user!.id),
  ])

  return (
    <CourseCatalogClient
      courses={courses}
      enrollments={(enrollments ?? []).filter((enrollment): enrollment is { course_id: string; status: string; progress_pct: number } => (
        typeof enrollment.course_id === 'string'
      ))}
      initialSearch={q ?? ''}
      initialTab={initialTab}
    />
  )
}
