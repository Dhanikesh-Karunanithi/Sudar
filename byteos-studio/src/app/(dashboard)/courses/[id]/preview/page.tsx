import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { authorizeCourseAccess } from '@/lib/courseAccess'
import { createAdminClient } from '@/lib/supabase/server'
import { PreviewCourseView } from '@/components/preview/PreviewCourseView'

export default async function CoursePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const access = await authorizeCourseAccess(id, 'preview')
  if (!access.ok) {
    if (access.status === 401) redirect('/login')
    if (access.status === 404) redirect('/courses')

    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to courses
          </Link>
          <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold">Preview unavailable</h1>
              <p className="text-sm text-slate-400">{access.error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const admin = createAdminClient()
  const { data: course, error } = await admin
    .from('courses')
    .select('id, title, description, modules(id, title, content, order_index)')
    .eq('id', id)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single()

  if (error || !course) redirect('/courses')

  const modules = (course as { modules?: unknown[] }).modules ?? []
  const courseForView = {
    id: course.id,
    title: course.title,
    description: course.description,
    modules,
  }

  return <PreviewCourseView course={courseForView} />
}
