import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PreviewCourseView, type PreviewCourse, type PreviewModule } from '@/components/preview/PreviewCourseView'

export default async function CoursePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: course, error } = await admin
    .from('courses')
    .select('id, title, description, modules(id, title, content, order_index)')
    .eq('id', id)
    .eq('created_by', user.id)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single()

  if (error || !course) redirect('/courses')

  type CourseRow = { id: string; title: string | null; description: string | null; modules?: Array<{ id: string; title: string; content: unknown; order_index: number }> }
  const c = course as CourseRow
  const modules: PreviewModule[] = (c.modules ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    content: m.content as PreviewModule['content'],
    order_index: m.order_index,
  }))
  const courseForView: PreviewCourse = {
    id: c.id,
    title: c.title ?? '',
    description: c.description ?? '',
    modules,
  }

  return <PreviewCourseView course={courseForView} />
}
