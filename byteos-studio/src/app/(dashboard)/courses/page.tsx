import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { getOrCreateOrg } from '@/lib/org'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import { CourseListClient } from './CourseListClient'

export const metadata: Metadata = { title: 'Courses' }

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const orgId = await getOrCreateOrg(user!.id)
  const admin = createAdminClient()

  const { data: courses } = await admin
    .from('courses')
    .select('id, title, description, status, difficulty, estimated_duration_mins, updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Courses</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {courses?.length ?? 0} course{courses?.length !== 1 ? 's' : ''} in your workspace
          </p>
        </div>
        <Link
          href="/courses/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New course
        </Link>
      </div>

      {!courses || courses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7 text-slate-600" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-medium text-white">No courses yet</h2>
            <p className="text-slate-500 text-sm">Create your first course to get started.</p>
          </div>
          <Link
            href="/courses/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create course
          </Link>
        </div>
      ) : (
        <CourseListClient courses={courses} />
      )}
    </div>
  )
}
