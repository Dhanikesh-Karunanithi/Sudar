import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import Link from 'next/link'
import { Route, Plus } from 'lucide-react'
import { PathListClient } from './PathListClient'

interface PathCourse {
  course_id: string
  order_index: number
  is_mandatory: boolean
  title: string
}

interface PathRow {
  id: string
  title: string
  description: string | null
  status?: string
  is_adaptive?: boolean
  is_mandatory?: boolean
  issues_certificate?: boolean
  courses?: PathCourse[]
}

export default async function PathsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user!.id)

  const { data: pathsData } = await admin
    .from('learning_paths')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  const paths = (pathsData ?? []) as PathRow[]
  const pathIds = paths.map((p) => p.id)
  const { data: enrollments } = pathIds.length > 0
    ? await admin.from('enrollments').select('path_id, status').in('path_id', pathIds)
    : { data: [] }

  const enrollmentsByPath: Record<string, Array<{ status: string }>> = {}
  for (const e of enrollments ?? []) {
    if (e.path_id) {
      if (!enrollmentsByPath[e.path_id]) enrollmentsByPath[e.path_id] = []
      enrollmentsByPath[e.path_id].push({ status: e.status })
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Route className="w-6 h-6 text-indigo-400" />Learning Paths
          </h1>
          <p className="text-slate-400 text-sm mt-1">Curate sequences of courses into structured programmes</p>
        </div>
        <Link
          href="/paths/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />New path
        </Link>
      </div>

      {paths.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Route className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <p className="text-slate-300 font-medium">No learning paths yet</p>
            <p className="text-slate-500 text-sm mt-1">Create structured programmes that chain courses into a journey.</p>
          </div>
          <Link
            href="/paths/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />Create your first path
          </Link>
        </div>
      ) : (
        <PathListClient paths={paths} enrollmentsByPath={enrollmentsByPath} />
      )}
    </div>
  )
}
