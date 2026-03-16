import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOrCreateOrg } from '@/lib/org'
import { Shield, AlertTriangle, CheckCircle2, Clock, User, Route, Calendar } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

function statusFromDue(dueDate: string | null, completed: boolean): 'completed' | 'overdue' | 'at_risk' | 'on_track' {
  if (completed) return 'completed'
  if (!dueDate) return 'on_track'
  const due = new Date(dueDate).toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)
  if (due < today) return 'overdue'
  const daysUntil = Math.floor((new Date(due).getTime() - new Date(today).getTime()) / 86400000)
  if (daysUntil <= 7) return 'at_risk'
  return 'on_track'
}

export default async function CompliancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user.id)

  const { data: paths } = await admin
    .from('learning_paths')
    .select('id, title')
    .eq('org_id', orgId)

  const pathIds = (paths ?? []).map((p) => p.id)
  if (pathIds.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Compliance</h1>
            <p className="text-slate-400 text-sm">Assignments, due dates, and completion status</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-12 text-center text-slate-500">
          No learning paths yet. Create and publish a path, then assign learners to see compliance here.
        </div>
      </div>
    )
  }

  const { data: pathEnrollments } = await admin
    .from('enrollments')
    .select('id, user_id, path_id, status, progress_pct, due_date, completed_at')
    .in('path_id', pathIds)
    .not('path_id', 'is', null)
    .order('due_date', { ascending: true })

  const userIds = [...new Set((pathEnrollments ?? []).map((e) => e.user_id))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const pathTitleMap = new Map((paths ?? []).map((p) => [p.id, p.title]))
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? 'Learner']))

  const rows = (pathEnrollments ?? []).map((e) => {
    const status = statusFromDue(e.due_date, e.status === 'completed')
    return {
      id: e.id,
      user_id: e.user_id,
      full_name: profileMap.get(e.user_id) ?? 'Learner',
      path_id: e.path_id,
      path_title: pathTitleMap.get(e.path_id!) ?? 'Path',
      status: e.status,
      progress_pct: e.progress_pct,
      due_date: e.due_date,
      completed_at: e.completed_at,
      compliance_status: status,
    }
  })

  const overdue = rows.filter((r) => r.compliance_status === 'overdue')
  const atRisk = rows.filter((r) => r.compliance_status === 'at_risk')
  const onTrack = rows.filter((r) => r.compliance_status === 'on_track')
  const completed = rows.filter((r) => r.compliance_status === 'completed')

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Compliance</h1>
            <p className="text-slate-400 text-sm">Assignments, due dates, and completion status</p>
          </div>
        </div>
        <Link href="/paths" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
          Manage paths <Route className="w-4 h-4" />
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overdue', value: overdue.length, icon: AlertTriangle, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
          { label: 'At risk (≤7 days)', value: atRisk.length, icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { label: 'On track', value: onTrack.length, icon: CheckCircle2, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
          { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={cn('border rounded-xl p-4 flex items-center gap-3', color)}>
            <Icon className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-xs font-medium opacity-80">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="px-4 py-3 font-medium">Learner</th>
                <th className="px-4 py-3 font-medium">Path</th>
                <th className="px-4 py-3 font-medium">Due date</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No path assignments yet. Assign learners to a path from the path editor.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-slate-200">{r.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/paths/${r.path_id}`} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        <Route className="w-3.5 h-3.5" />{r.path_title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {r.due_date ? new Date(r.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{Math.round(r.progress_pct)}%</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                        r.compliance_status === 'overdue' && 'bg-red-500/15 text-red-400 border border-red-500/20',
                        r.compliance_status === 'at_risk' && 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
                        r.compliance_status === 'on_track' && 'bg-green-500/15 text-green-400 border border-green-500/20',
                        r.compliance_status === 'completed' && 'bg-slate-600 text-slate-300 border border-slate-500'
                      )}>
                        {r.compliance_status === 'overdue' && 'Overdue'}
                        {r.compliance_status === 'at_risk' && 'At risk'}
                        {r.compliance_status === 'on_track' && 'On track'}
                        {r.compliance_status === 'completed' && 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
