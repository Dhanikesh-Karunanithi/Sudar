'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Fuse from 'fuse.js'
import { Search } from 'lucide-react'
import { helpCategoryLabel } from '@/lib/helpCenter/categoryLabels'
import type { HelpArticleMeta } from '@/lib/helpCenter/types'

type Props = {
  articles: Pick<HelpArticleMeta, 'slug' | 'title' | 'description' | 'category'>[]
}

type ArticleSummary = Props['articles'][number]

export function HelpCenterSearch({ articles }: Props) {
  const [q, setQ] = useState('')

  const fuse = useMemo(
    () =>
      new Fuse<ArticleSummary>(articles, {
        keys: ['title', 'description', 'category'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [articles]
  )

  const results = useMemo(() => {
    const trimmed = q.trim()
    if (!trimmed) return []
    return fuse.search(trimmed, { limit: 12 }).map((r) => r.item)
  }, [fuse, q])

  return (
    <div className="mb-8">
      <label className="relative block">
        <span className="sr-only">Search help articles</span>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search topics (e.g. ALP, modalities, agents)…"
          className="w-full bg-slate-900/60 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          autoComplete="off"
        />
      </label>

      {q.trim() && (
        <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900/50 divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">No matches. Try keywords like “SCORM”, “SSO”, or “tutor”.</p>
          ) : (
            results.map((a) => (
              <Link
                key={a.slug}
                href={`/help/${a.slug}`}
                className="block p-3 hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-sm font-medium text-white">{a.title}</span>
                {a.description ? (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                ) : null}
                <p className="text-[10px] text-slate-500 mt-1">{helpCategoryLabel(a.category)}</p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
