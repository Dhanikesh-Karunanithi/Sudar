'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { FEEDBACK_CATEGORY_LABELS, type FeedbackCategory, type FeedbackStatus } from '@shared-feedback/schemas'

type WaitlistEntry = {
  id: string
  email: string
  name: string | null
  use_case: string | null
  status: string
}

type InviteCode = {
  id: string
  code: string
  grants_tier: string
  uses_count: number
  max_uses: number | null
  is_active: boolean
}

type FeedbackRow = {
  id: string
  user_id: string
  user_name: string | null
  surface: string
  category: FeedbackCategory
  message: string
  page_route: string | null
  urls: string[]
  attachment_urls: string[]
  status: FeedbackStatus
  created_at: string
}

export default function EarlyAccessAdminPage() {
  const [data, setData] = useState<{ waitlist: WaitlistEntry[]; inviteCodes: InviteCode[] } | null>(null)
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [newCode, setNewCode] = useState('')
  const [issuedCode, setIssuedCode] = useState<string | null>(null)

  const load = () => {
    fetch('/api/early-access/admin')
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Access denied' : 'Failed to load')
        return r.json()
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }

  const loadFeedback = () => {
    fetch('/api/early-access/feedback')
      .then(async (r) => {
        if (!r.ok) return { feedback: [] }
        return r.json()
      })
      .then((body: { feedback?: FeedbackRow[] }) => {
        setFeedback(
          (body.feedback ?? []).map((row) => ({
            ...row,
            urls: Array.isArray(row.urls) ? row.urls : [],
            attachment_urls: Array.isArray(row.attachment_urls) ? row.attachment_urls : [],
          })),
        )
      })
      .catch(() => setFeedback([]))
  }

  useEffect(() => {
    load()
    loadFeedback()
  }, [])

  const updateFeedbackStatus = async (id: string, status: FeedbackStatus) => {
    await fetch('/api/early-access/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', id, status }),
    })
    loadFeedback()
  }

  const createCode = async () => {
    if (!newCode.trim()) return
    await fetch('/api/early-access/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_invite_code', code: newCode, type: 'early_access' }),
    })
    setNewCode('')
    load()
  }

  const inviteFromWaitlist = async (id: string) => {
    const res = await fetch('/api/early-access/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invite_waitlist', waitlistId: id }),
    })
    const body = await res.json()
    if (body.code) setIssuedCode(body.code as string)
    load()
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive mb-4">{error}</p>
        <Link href="/" className="text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  if (!data) {
    return <div className="p-8 text-muted-foreground">Loading early access admin…</div>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Early access</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage waitlist entries and invite codes for platform signup.
          </p>
        </div>
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Dashboard
        </Link>
      </div>

      {issuedCode && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
          Issued invite code: <span className="font-mono font-semibold">{issuedCode}</span> — copy and send to the user.
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-medium text-foreground">Create invite code</h2>
        <div className="flex gap-2">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="SUDAR-EARLY-2026"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void createCode()}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Create
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-foreground">Invite codes ({data.inviteCodes.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3">Code</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Uses</th>
                <th className="p-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {data.inviteCodes.map((c) => (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="p-3 font-mono">{c.code}</td>
                  <td className="p-3">{c.grants_tier}</td>
                  <td className="p-3">
                    {c.uses_count}
                    {c.max_uses != null ? ` / ${c.max_uses}` : ''}
                  </td>
                  <td className="p-3">{c.is_active ? 'yes' : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-foreground">Waitlist ({data.waitlist.length})</h2>
        <div className="space-y-2">
          {data.waitlist.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
            >
              <div>
                <p className="font-medium text-foreground">{w.email}</p>
                <p className="text-xs text-muted-foreground">
                  {[w.name, w.use_case, w.status].filter(Boolean).join(' · ')}
                </p>
              </div>
              {w.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => void inviteFromWaitlist(w.id)}
                  className="shrink-0 rounded-lg border border-primary px-3 py-1 text-xs text-primary"
                >
                  Issue invite
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-foreground">Tester feedback ({feedback.length})</h2>
        <p className="text-sm text-muted-foreground">
          Submissions from Sudar chat (early-access testers). Screenshots and URLs are included when provided.
        </p>
        {feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-border p-4">No feedback yet.</p>
        ) : (
          <div className="space-y-3">
            {feedback.map((row) => (
              <article key={row.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {FEEDBACK_CATEGORY_LABELS[row.category]} · {row.surface}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {row.user_name ?? row.user_id.slice(0, 8)} ·{' '}
                      {new Date(row.created_at).toLocaleString()}
                      {row.page_route ? ` · ${row.page_route}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs rounded-full border border-border px-2 py-0.5 capitalize">{row.status}</span>
                    {row.status === 'new' ? (
                      <button
                        type="button"
                        onClick={() => void updateFeedbackStatus(row.id, 'reviewed')}
                        className="text-xs rounded-lg border border-primary px-2 py-1 text-primary"
                      >
                        Mark reviewed
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{row.message}</p>
                {row.urls.length > 0 ? (
                  <ul className="text-xs space-y-1">
                    {row.urls.map((url) => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {row.attachment_urls.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {row.attachment_urls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block h-20 w-20 rounded-md overflow-hidden border border-border"
                      >
                        <Image src={url} alt="Feedback screenshot" fill className="object-cover" unoptimized />
                      </a>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
