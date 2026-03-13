'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Loader2,
  AlertCircle,
  Route,
  BarChart2,
  Shield,
  Plus,
  Trash2,
  Key,
  UserCheck,
  UserX,
} from 'lucide-react'

interface UserDetail {
  id: string
  full_name: string | null
  email: string | null
  org_role: string
  status: string
}

interface PerfRecord {
  id: string
  source_type: string
  key: string
  value: number
  value_display: string | null
  period_start: string | null
  period_end: string | null
  recorded_at: string
  created_at: string
}

interface Enrollment {
  id: string
  path_id: string
  path_title: string | null
  status: string
  progress_pct: number
  due_date: string | null
  completed_at: string | null
  created_at: string
}

interface OrgSettings {
  institution_type: string | null
  kpis: { id: string; name: string; unit?: string; period?: string }[]
  terms: { id: string; name: string; start: string; end: string }[]
  scale: string | null
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>()
  const userId = params?.id ?? ''
  const [user, setUser] = useState<UserDetail | null>(null)
  const [perfRecords, setPerfRecords] = useState<PerfRecord[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null)
  const [paths, setPaths] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [assignPathId, setAssignPathId] = useState('')
  const [assignDueDate, setAssignDueDate] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [perfForm, setPerfForm] = useState({
    source_type: 'kpi' as 'kpi' | 'grade' | 'custom',
    key: '',
    value: '',
    value_display: '',
    period_start: '',
    period_end: '',
  })
  const [addingPerf, setAddingPerf] = useState(false)
  const [disabling, setDisabling] = useState<string | null>(null)
  const [resettingPwd, setResettingPwd] = useState(false)
  const [otp, setOtp] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    if (!userId) return
    const res = await fetch(`/api/users/${userId}`)
    if (res.status === 403) setForbidden(true)
    if (res.ok) setUser(await res.json())
  }, [userId])

  const fetchPerf = useCallback(async () => {
    if (!userId) return
    const res = await fetch(`/api/users/${userId}/performance`)
    if (res.ok) setPerfRecords(await res.json())
  }, [userId])

  const fetchEnrollments = useCallback(async () => {
    if (!userId) return
    const res = await fetch(`/api/users/${userId}/enrollments`)
    if (res.ok) setEnrollments(await res.json())
  }, [userId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!userId) return
      await fetchUser()
      if (cancelled) return
      const [perfRes, enrollRes, settingsRes, pathsRes] = await Promise.all([
        fetch(`/api/users/${userId}/performance`),
        fetch(`/api/users/${userId}/enrollments`),
        fetch('/api/org/settings'),
        fetch('/api/paths'),
      ])
      if (cancelled) return
      if (perfRes.ok) setPerfRecords(await perfRes.json())
      if (enrollRes.ok) setEnrollments(await enrollRes.json())
      if (settingsRes.ok) {
        const s = await settingsRes.json()
        setOrgSettings({
          institution_type: s.institution_type ?? null,
          kpis: s.kpis ?? [],
          terms: s.terms ?? [],
          scale: s.scale ?? null,
        })
      }
      if (pathsRes.ok) {
        const p = await pathsRes.json()
        setPaths(Array.isArray(p) ? p.filter((x: { status?: string }) => x.status === 'published') : [])
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [userId, fetchUser])

  async function handleAddPerf() {
    if (!userId || !perfForm.key || perfForm.value === '') return
    setAddingPerf(true)
    const res = await fetch(`/api/users/${userId}/performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_type: perfForm.source_type,
        key: perfForm.key,
        value: Number(perfForm.value),
        value_display: perfForm.value_display || null,
        period_start: perfForm.period_start || null,
        period_end: perfForm.period_end || null,
      }),
    })
    setAddingPerf(false)
    if (res.ok) {
      setPerfForm({ ...perfForm, key: '', value: '', value_display: '', period_start: '', period_end: '' })
      fetchPerf()
    }
  }

  async function handleDeletePerf(recordId: string) {
    if (!userId) return
    const res = await fetch(`/api/users/${userId}/performance/${recordId}`, { method: 'DELETE' })
    if (res.ok) fetchPerf()
  }

  async function handleAssignPath() {
    if (!userId || !assignPathId) return
    setAssigning(true)
    const res = await fetch(`/api/paths/${assignPathId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids: [userId], due_date: assignDueDate || undefined }),
    })
    setAssigning(false)
    if (res.ok) {
      setAssignPathId('')
      setAssignDueDate('')
      fetchEnrollments()
    }
  }

  async function handleToggleDisable() {
    if (!user) return
    setDisabling(user.id)
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banned: user.status === 'active' }),
    })
    setDisabling(null)
    if (res.ok) fetchUser()
  }

  async function handleResetPassword() {
    if (!user) return
    setResettingPwd(true)
    setOtp(null)
    const res = await fetch(`/api/users/${user.id}/reset-password`, { method: 'POST' })
    const data = res.ok ? await res.json() : null
    setResettingPwd(false)
    if (data?.otp) setOtp(data.otp)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
          <p className="text-amber-200">You don’t have permission to view this user.</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center">
          <p className="text-slate-400">User not found.</p>
          <Link href="/users" className="inline-flex items-center gap-2 mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to users
          </Link>
        </div>
      </div>
    )
  }

  const kpiKeys = orgSettings?.kpis ?? []
  const termKeys = orgSettings?.terms ?? []

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Users
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <User className="w-7 h-7 text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-white truncate">{user.full_name || 'Unnamed user'}</h1>
          <p className="text-slate-400 mt-0.5 truncate">{user.email || '—'}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
              {user.org_role}
            </span>
            <span className={user.status === 'active' ? 'text-emerald-400 text-sm' : 'text-amber-400 text-sm'}>
              {user.status === 'active' ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Learning paths */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Route className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-white text-sm">Learning paths</h2>
        </div>
        {enrollments.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {enrollments.map((e) => (
              <li key={e.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-200">{e.path_title ?? e.path_id}</span>
                <span className="text-slate-500">
                  {e.status} · {Math.round(e.progress_pct)}%
                  {e.due_date && ` · Due ${new Date(e.due_date).toLocaleDateString()}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm mb-4">Not enrolled in any path yet.</p>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <select
            value={assignPathId}
            onChange={(e) => setAssignPathId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm min-w-[200px]"
          >
            <option value="">Select path</option>
            {paths.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <input
            type="date"
            value={assignDueDate}
            onChange={(e) => setAssignDueDate(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAssignPath}
            disabled={!assignPathId || assigning}
            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium"
          >
            {assigning ? 'Assigning…' : 'Assign to path'}
          </button>
        </div>
      </section>

      {/* Performance data */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-white text-sm">Performance data</h2>
        </div>
        {perfRecords.length > 0 ? (
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-slate-400 text-left">
                <th className="pb-2">Type</th>
                <th className="pb-2">Key</th>
                <th className="pb-2">Value</th>
                <th className="pb-2">Period</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {perfRecords.map((r) => (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="py-2 text-slate-300">{r.source_type}</td>
                  <td className="py-2 text-slate-300">{r.key}</td>
                  <td className="py-2 text-slate-300">{r.value_display ?? r.value}</td>
                  <td className="py-2 text-slate-500">
                    {r.period_start && r.period_end
                      ? `${r.period_start} – ${r.period_end}`
                      : r.period_start ?? '—'}
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => handleDeletePerf(r.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 text-sm mb-4">No performance records yet.</p>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <select
            value={perfForm.source_type}
            onChange={(e) => setPerfForm({ ...perfForm, source_type: e.target.value as 'kpi' | 'grade' | 'custom' })}
            className="rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          >
            <option value="kpi">KPI</option>
            <option value="grade">Grade</option>
            <option value="custom">Custom</option>
          </select>
          {perfForm.source_type === 'kpi' && kpiKeys.length > 0 && (
            <select
              value={perfForm.key}
              onChange={(e) => setPerfForm({ ...perfForm, key: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm min-w-[120px]"
            >
              <option value="">Select KPI</option>
              {kpiKeys.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
          )}
          {perfForm.source_type === 'grade' && termKeys.length > 0 && (
            <select
              value={perfForm.key}
              onChange={(e) => setPerfForm({ ...perfForm, key: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm min-w-[120px]"
            >
              <option value="">Select term</option>
              {termKeys.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          {(perfForm.source_type === 'custom' || (perfForm.source_type === 'kpi' && kpiKeys.length === 0) || (perfForm.source_type === 'grade' && termKeys.length === 0)) && (
            <input
              type="text"
              placeholder="Key"
              value={perfForm.key}
              onChange={(e) => setPerfForm({ ...perfForm, key: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm w-28"
            />
          )}
          <input
            type="number"
            step="any"
            placeholder="Value"
            value={perfForm.value}
            onChange={(e) => setPerfForm({ ...perfForm, value: e.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm w-24"
          />
          <input
            type="text"
            placeholder="Display (e.g. A+)"
            value={perfForm.value_display}
            onChange={(e) => setPerfForm({ ...perfForm, value_display: e.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm w-20"
          />
          <input
            type="date"
            placeholder="Start"
            value={perfForm.period_start}
            onChange={(e) => setPerfForm({ ...perfForm, period_start: e.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          />
          <input
            type="date"
            placeholder="End"
            value={perfForm.period_end}
            onChange={(e) => setPerfForm({ ...perfForm, period_end: e.target.value })}
            className="rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAddPerf}
            disabled={!perfForm.key || perfForm.value === '' || addingPerf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </section>

      {/* Actions */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-white text-sm">Actions</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleToggleDisable}
            disabled={disabling !== null}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-sm font-medium"
          >
            {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            {user.status === 'active' ? 'Disable access' : 'Enable access'}
          </button>
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resettingPwd}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-200 text-sm font-medium"
          >
            <Key className="w-4 h-4" />
            Reset password (OTP)
          </button>
        </div>
        {otp && (
          <div className="mt-3 p-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">One-time password (share securely):</p>
            <p className="font-mono text-white font-semibold">{otp}</p>
            <p className="text-xs text-slate-500 mt-1">User must change password on first login.</p>
          </div>
        )}
      </section>
    </div>
  )
}
