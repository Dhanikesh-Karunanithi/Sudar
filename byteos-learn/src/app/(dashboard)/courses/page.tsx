import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { getCachedPublishedCourses } from '@/lib/cache'
import CourseCatalogClient from './CourseCatalogClient'

export const metadata: Metadata = { title: 'Courses' }

export default async function CourseCatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

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
      enrollments={enrollments ?? []}
    />
  )
}
