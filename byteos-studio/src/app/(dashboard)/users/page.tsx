'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Users, Loader2, AlertCircle, UserPlus, ChevronRight, Mail, Upload, FileDown, UserMinus, Shield, Ban, CheckSquare, Square } from 'lucide-react'

interface UserRow {
  id: string
  full_name: string | null
  email: string | null
  org_role: string
  status: string
}

interface PathOption {
  id: string
  title: string
}

export default function UsersPage() {
  const [list, setList] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAssignPath, setShowAssignPath] = useState(false)
  const [showBulkRole, setShowBulkRole] = useState(false)
  const [showBulkDisable, setShowBulkDisable] = useState(false)
  const [showBulkRemove, setShowBulkRemove] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/users')
    if (res.status === 403) setForbidden(true)
    if (!res.ok) return
    const data = await res.json()
    setList(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchUsers().then(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [fetchUsers])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const selectAll = () => {
    if (selectedIds.size === list.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(list.map((u) => u.id)))
  }
  const clearSelection = () => setSelectedIds(new Set())
  const selectedCount = selectedIds.size
  const selectedList = list.filter((u) => selectedIds.has(u.id))

  const showBulkBar = selectedCount > 0

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
          <div>
            <p className="font-medium text-white">Access restricted</p>
            <p className="text-sm text-slate-400 mt-0.5">
              You need an Admin or Manager role in this organization to manage users.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Users</h1>
            <p className="text-slate-400 text-sm">
              Manage organization members, roles, and access
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add user
          </button>
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
          >
            <Mail className="w-4 h-4" />
            Invite
          </button>
          <button
            type="button"
            onClick={() => setShowBulk(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Bulk import
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-400 text-sm">
          {success}
        </div>
      )}

      {showBulkBar && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
          <span className="text-sm text-slate-300">
            <strong className="text-white">{selectedCount}</strong> selected
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="text-sm text-slate-400 hover:text-white"
          >
            Clear
          </button>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={() => setShowBulkRole(true)}
            disabled={bulkActionLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            Change role
          </button>
          <button
            type="button"
            onClick={() => setShowBulkDisable(true)}
            disabled={bulkActionLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50"
          >
            <Ban className="w-4 h-4" />
            Disable / Enable
          </button>
          <button
            type="button"
            onClick={() => setShowAssignPath(true)}
            disabled={bulkActionLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50"
          >
            Assign to path
          </button>
          <button
            type="button"
            onClick={() => {
              const header = 'Name,Email,Role,Status\n'
              const rows = selectedList
                .map((u) =>
                  [
                    (u.full_name ?? '').replace(/"/g, '""'),
                    (u.email ?? '').replace(/"/g, '""'),
                    u.org_role,
                    u.status,
                  ].join(',')
                )
                .join('\n')
              const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
              URL.revokeObjectURL(url)
              clearSelection()
              setSuccess(`Exported ${selectedCount} user(s)`)
              setTimeout(() => setSuccess(null), 3000)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-600"
          >
            <FileDown className="w-4 h-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setShowBulkRemove(true)}
            disabled={bulkActionLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
          >
            <UserMinus className="w-4 h-4" />
            Remove from org
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {list.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No users in this organization yet</p>
            <p className="text-sm mt-1">Add or invite users to get started.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="w-10 px-4 py-3">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-slate-400 hover:text-white"
                    aria-label={selectedIds.size === list.length ? 'Deselect all' : 'Select all'}
                  >
                    {selectedIds.size === list.length ? (
                      <CheckSquare className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b border-slate-800/80 transition-colors ${selectedIds.has(u.id) ? 'bg-indigo-500/10' : 'hover:bg-slate-800/30'}`}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSelect(u.id)}
                      className="text-slate-400 hover:text-white"
                      aria-label={selectedIds.has(u.id) ? 'Deselect' : 'Select'}
                    >
                      {selectedIds.has(u.id) ? (
                        <CheckSquare className="w-5 h-5 text-indigo-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">
                      {u.full_name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                      {u.org_role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.status === 'active'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {u.status === 'active' ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/users/${u.id}`}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                    >
                      View
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchUsers(); }}
        />
      )}
      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => { setShowInvite(false); fetchUsers(); }}
        />
      )}
      {showBulk && (
        <BulkImportModal
          onClose={() => setShowBulk(false)}
          onSuccess={() => { setShowBulk(false); fetchUsers(); }}
        />
      )}
      {showAssignPath && (
        <AssignToPathModal
          userIds={Array.from(selectedIds)}
          onClose={() => setShowAssignPath(false)}
          onSuccess={() => {
            setShowAssignPath(false)
            clearSelection()
            fetchUsers()
            setSuccess(`Assigned users to path`)
            setTimeout(() => setSuccess(null), 3000)
          }}
          setBulkActionLoading={setBulkActionLoading}
          setError={setError}
        />
      )}
      {showBulkRole && (
        <BulkRoleModal
          userIds={Array.from(selectedIds)}
          onClose={() => setShowBulkRole(false)}
          onSuccess={(msg) => {
            setShowBulkRole(false)
            clearSelection()
            fetchUsers()
            setSuccess(msg)
            setTimeout(() => setSuccess(null), 3000)
          }}
          setBulkActionLoading={setBulkActionLoading}
          setError={setError}
        />
      )}
      {showBulkDisable && (
        <BulkDisableModal
          userIds={Array.from(selectedIds)}
          selectedList={selectedList}
          onClose={() => setShowBulkDisable(false)}
          onSuccess={(msg) => {
            setShowBulkDisable(false)
            clearSelection()
            fetchUsers()
            setSuccess(msg)
            setTimeout(() => setSuccess(null), 3000)
          }}
          setBulkActionLoading={setBulkActionLoading}
          setError={setError}
        />
      )}
      {showBulkRemove && (
        <BulkRemoveModal
          userIds={Array.from(selectedIds)}
          onClose={() => setShowBulkRemove(false)}
          onSuccess={(msg) => {
            setShowBulkRemove(false)
            clearSelection()
            fetchUsers()
            setSuccess(msg)
            setTimeout(() => setSuccess(null), 3000)
          }}
          setBulkActionLoading={setBulkActionLoading}
          setError={setError}
        />
      )}
    </div>
  )
}

function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('LEARNER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), full_name: fullName.trim() || undefined, password: password || undefined, org_role: role }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(data.error || res.statusText)
      return
    }
    if (data.temp_password) setTempPassword(data.temp_password)
    else onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-4">Add user</h2>
        {tempPassword ? (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm">User created. Share this one-time password securely:</p>
            <p className="font-mono text-white bg-slate-800 px-3 py-2 rounded-lg break-all">{tempPassword}</p>
            <p className="text-slate-500 text-xs">They must change it on first login.</p>
            <button type="button" onClick={onSuccess} className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm" placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password (optional, min 8 chars)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm" placeholder="Leave empty for random OTP" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm">
                <option value="LEARNER">Learner</option>
                <option value="CREATOR">Creator</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">{loading ? 'Creating…' : 'Create'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function InviteUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('LEARNER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), full_name: fullName.trim() || undefined, org_role: role }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(data.error || res.statusText)
      return
    }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-4">Invite by email</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm" placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Full name (optional)</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm">
              <option value="LEARNER">Learner</option>
              <option value="CREATOR">Creator</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">{loading ? 'Sending…' : 'Send invite'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [csv, setCsv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{ email: string; ok: boolean; error?: string; temp_password?: string }[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      setCsv(text)
    }
    reader.onerror = () => setError('Failed to read file')
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const lines = csv.trim().split(/\r?\n/).filter(Boolean)
    const header = lines[0]?.toLowerCase() ?? ''
    const emailIdx = header.includes('email') ? header.split(',').map((h) => h.trim()).indexOf('email') : 0
    const nameIdx = header.includes('name') || header.includes('full_name') ? header.split(',').map((h) => h.trim()).indexOf(header.includes('full_name') ? 'full_name' : 'name') : -1
    const roleIdx = header.includes('role') ? header.split(',').map((h) => h.trim()).indexOf('role') : -1
    const users = lines.slice(1).map((line) => {
      const parts = line.split(',').map((p) => p.trim())
      return {
        email: parts[emailIdx] ?? '',
        full_name: nameIdx >= 0 ? parts[nameIdx] : undefined,
        org_role: roleIdx >= 0 ? parts[roleIdx] : undefined,
      }
    }).filter((u) => u.email)
    if (users.length === 0) {
      setError('No valid rows. CSV should have header: email, name (or full_name), role (optional).')
      return
    }
    setLoading(true)
    const res = await fetch('/api/users/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(data.error || res.statusText)
      return
    }
    setResults(data.results ?? [])
  }

  if (results?.length) {
    const ok = results.filter((r) => r.ok).length
    const failed = results.filter((r) => !r.ok)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white">Bulk import result</h2>
            <p className="text-slate-400 text-sm mt-1">{ok} created, {failed.length} failed</p>
          </div>
          <div className="p-4 overflow-y-auto flex-1 text-sm">
            {results.map((r, i) => (
              <div key={i} className={r.ok ? 'text-slate-300' : 'text-red-400'}>
                {r.email}: {r.ok ? 'OK' + (r.temp_password ? ` (password: ${r.temp_password})` : '') : r.error}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-800">
            <button type="button" onClick={onSuccess} className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">Done</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-2">Bulk import</h2>
        <p className="text-slate-500 text-sm mb-4">CSV with header: email, name (or full_name), role (optional). Max 100 rows.</p>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <a href="/users-import-template.csv" download="users-import-template.csv" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
            <FileDown className="w-4 h-4" />
            Download template
          </a>
          <span className="text-slate-600">|</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload CSV file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
          >
            <Upload className="w-4 h-4" />
            Upload CSV file
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={8} placeholder="Paste CSV here or upload a file above. Header: email, name, role&#10;user1@example.com, John, LEARNER&#10;user2@example.com, Jane, CREATOR" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm font-mono placeholder-slate-500 resize-y" />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">{loading ? 'Importing…' : 'Import'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AssignToPathModal({
  userIds,
  onClose,
  onSuccess,
  setBulkActionLoading,
  setError,
}: {
  userIds: string[]
  onClose: () => void
  onSuccess: () => void
  setBulkActionLoading: (v: boolean) => void
  setError: (v: string | null) => void
}) {
  const [paths, setPaths] = useState<PathOption[]>([])
  const [pathId, setPathId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/paths')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPaths(Array.isArray(data) ? data : []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pathId.trim()) return
    setError(null)
    setBulkActionLoading(true)
    setLoading(true)
    try {
      const res = await fetch(`/api/paths/${pathId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: userIds, due_date: dueDate || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error || res.statusText)
        return
      }
      onSuccess()
    } finally {
      setBulkActionLoading(false)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-2">Assign to path</h2>
        <p className="text-slate-400 text-sm mb-4">Assign {userIds.length} user(s) to a learning path.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Path</label>
            <select required value={pathId} onChange={(e) => setPathId(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm">
              <option value="">Select path</option>
              {paths.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Due date (optional)</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">{loading ? 'Assigning…' : 'Assign'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkRoleModal({
  userIds,
  onClose,
  onSuccess,
  setBulkActionLoading,
  setError,
}: {
  userIds: string[]
  onClose: () => void
  onSuccess: (msg: string) => void
  setBulkActionLoading: (v: boolean) => void
  setError: (v: string | null) => void
}) {
  const [role, setRole] = useState('LEARNER')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBulkActionLoading(true)
    setLoading(true)
    try {
      const res = await fetch('/api/users/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: userIds, org_role: role }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error || res.statusText)
        return
      }
      const updated = (data as { updated?: number }).updated ?? 0
      onSuccess(`Updated role for ${updated} user(s)`)
    } finally {
      setBulkActionLoading(false)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-2">Change role</h2>
        <p className="text-slate-400 text-sm mb-4">Set role for {userIds.length} selected user(s).</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm">
              <option value="LEARNER">Learner</option>
              <option value="CREATOR">Creator</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">{loading ? 'Updating…' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkDisableModal({
  userIds,
  selectedList,
  onClose,
  onSuccess,
  setBulkActionLoading,
  setError,
}: {
  userIds: string[]
  selectedList: UserRow[]
  onClose: () => void
  onSuccess: (msg: string) => void
  setBulkActionLoading: (v: boolean) => void
  setError: (v: string | null) => void
}) {
  const [action, setAction] = useState<'disable' | 'enable'>('disable')
  const [loading, setLoading] = useState(false)
  const activeCount = selectedList.filter((u) => u.status === 'active').length
  const disabledCount = selectedList.filter((u) => u.status !== 'active').length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBulkActionLoading(true)
    setLoading(true)
    try {
      const res = await fetch('/api/users/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: userIds, banned: action === 'disable' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error || res.statusText)
        return
      }
      const updated = (data as { updated?: number }).updated ?? 0
      onSuccess(action === 'disable' ? `Disabled ${updated} user(s)` : `Enabled ${updated} user(s)`)
    } finally {
      setBulkActionLoading(false)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-2">Disable / Enable</h2>
        <p className="text-slate-400 text-sm mb-4">
          {userIds.length} selected ({activeCount} active, {disabledCount} disabled).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Action</label>
            <select value={action} onChange={(e) => setAction(e.target.value as 'disable' | 'enable')} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm">
              <option value="disable">Disable access</option>
              <option value="enable">Enable access</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">{loading ? 'Updating…' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkRemoveModal({
  userIds,
  onClose,
  onSuccess,
  setBulkActionLoading,
  setError,
}: {
  userIds: string[]
  onClose: () => void
  onSuccess: (msg: string) => void
  setBulkActionLoading: (v: boolean) => void
  setError: (v: string | null) => void
}) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBulkActionLoading(true)
    setLoading(true)
    try {
      const res = await fetch('/api/users/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: userIds }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error || res.statusText)
        return
      }
      const removed = (data as { removed?: number }).removed ?? 0
      onSuccess(`Removed ${removed} user(s) from organization`)
    } finally {
      setBulkActionLoading(false)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-2">Remove from organization</h2>
        <p className="text-slate-400 text-sm mb-4">
          Remove {userIds.length} user(s) from this organization? They can be re-invited later.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50">{loading ? 'Removing…' : 'Remove'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
