'use client'

import { useEffect, useState } from 'react'
import { Users, Building2, Loader2, AlertCircle, Trash2 } from 'lucide-react'

interface PlatformUser {
  id: string
  email: string | null
  status: string
  created_at: string | null
  last_sign_in_at: string | null
  full_name: string | null
  profile_role: string | null
  primary_org_name: string | null
  memberships: { org_id: string; role: string; org_name: string }[]
}

interface PlatformOrg {
  id: string
  name: string
  slug: string
  plan: string | null
  created_at: string | null
  member_count: number
}

export default function SystemAdminPage() {
  const [tab, setTab] = useState<'users' | 'orgs'>('users')
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [orgs, setOrgs] = useState<PlatformOrg[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialTab = params.get('tab') === 'orgs' ? 'orgs' : 'users'
    setTab(initialTab)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      try {
        const [usersRes, orgsRes] = await Promise.all([
          fetch('/api/admin/system/users'),
          fetch('/api/admin/system/orgs'),
        ])
        if (usersRes.status === 403 || orgsRes.status === 403) {
          setError('Access restricted. Only Super Admins can see this page.')
          return
        }
        if (!usersRes.ok || !orgsRes.ok) {
          setError('Failed to load system data.')
          return
        }
        const [usersJson, orgsJson] = await Promise.all([usersRes.json(), orgsRes.json()])
        if (!cancelled) {
          setUsers(Array.isArray(usersJson) ? usersJson : [])
          setOrgs(Array.isArray(orgsJson) ? orgsJson : [])
        }
      } catch {
        if (!cancelled) setError('Failed to load system data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  function toggleUserSelection(id: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleHardDelete() {
    if (selectedUserIds.size === 0) return
    if (!window.confirm(`Permanently delete ${selectedUserIds.size} user(s) from the platform? This cannot be undone.`)) {
      return
    }
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/system/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: Array.from(selectedUserIds) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Failed to delete users.')
      } else {
        const remaining = users.filter((u) => !selectedUserIds.has(u.id))
        setUsers(remaining)
        setSelectedUserIds(new Set())
      }
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Platform administration</h1>
            <p className="text-slate-400 text-sm">
              Global view of all users and organisations (Super Admin only).
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex border-b border-slate-800">
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === 'users'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Users
        </button>
        <button
          type="button"
          onClick={() => setTab('orgs')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === 'orgs'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Organisations
        </button>
      </div>

      {tab === 'users' ? (
        <div className="space-y-3">
          {selectedUserIds.size > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-slate-100">
                <strong>{selectedUserIds.size}</strong> user(s) selected for hard delete.
              </p>
              <button
                type="button"
                onClick={handleHardDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting…' : 'Delete from platform'}
              </button>
            </div>
          )}

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            {users.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No users found.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3"></th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Profile role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Primary org</th>
                    <th className="px-4 py-3">Last sign-in</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800/70 hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(u.id)}
                          onChange={() => toggleUserSelection(u.id)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-100">{u.email ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{u.full_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-200">
                          {u.profile_role ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            u.status === 'active' ? 'text-emerald-400 text-xs' : 'text-amber-400 text-xs'
                          }
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {u.primary_org_name ?? (u.memberships[0]?.org_name ?? '—')}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at).toLocaleString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          {orgs.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No organisations found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id} className="border-b border-slate-800/70 hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-100">{o.name}</td>
                    <td className="px-4 py-3 text-slate-400">{o.slug}</td>
                    <td className="px-4 py-3 text-slate-300">{o.plan ?? 'free'}</td>
                    <td className="px-4 py-3 text-slate-100">{o.member_count}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

