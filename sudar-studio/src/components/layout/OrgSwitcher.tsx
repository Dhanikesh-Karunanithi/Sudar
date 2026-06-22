'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Membership = {
  org_id: string
  org_name: string
  org_slug: string
  role: string
}

export function OrgSwitcher() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/org/memberships')
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setMemberships(Array.isArray(data.memberships) ? data.memberships : [])
        setActiveOrgId(typeof data.active_org_id === 'string' ? data.active_org_id : null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading || memberships.length <= 1) return null

  const active = memberships.find((m) => m.org_id === activeOrgId) ?? memberships[0]

  async function handleSwitch(orgId: string) {
    if (orgId === activeOrgId || switching) return
    setSwitching(true)
    try {
      const res = await fetch('/api/org/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId }),
      })
      if (!res.ok) return
      setActiveOrgId(orgId)
      setOpen(false)
      router.refresh()
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="relative px-4 pb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={switching}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch organisation"
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-left text-sm text-foreground hover:bg-card transition-colors disabled:opacity-60"
      >
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-medium">{active?.org_name ?? 'Organisation'}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Organisations"
          className="absolute left-4 right-4 z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
        >
          {memberships.map((m) => (
            <li key={m.org_id}>
              <button
                type="button"
                role="option"
                aria-selected={m.org_id === activeOrgId}
                onClick={() => handleSwitch(m.org_id)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60',
                  m.org_id === activeOrgId && 'bg-muted/40'
                )}
              >
                <span className="min-w-0 flex-1 truncate">{m.org_name}</span>
                {m.org_id === activeOrgId && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
