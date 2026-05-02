import Link from 'next/link'
import { BookOpen, ExternalLink } from 'lucide-react'
import { HelpCenterSearch } from '@/components/help/HelpCenterSearch'
import { HELP_CATEGORY_ORDER, helpCategoryLabel } from '@/lib/helpCenter/categoryLabels'
import {
  groupedByCategory,
  loadHelpArticlesIndex,
  loadAiLiteracyLessons,
} from '@/lib/helpCenter/server'

export const metadata = {
  title: 'Sudar Help Center — Sudar Studio',
}

export default function HelpHubPage() {
  const articles = loadHelpArticlesIndex()
  const grouped = groupedByCategory(articles)
  const aiLiteracyCount = loadAiLiteracyLessons().length

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-6 h-6 text-indigo-400" />
        <h1 className="text-xl font-semibold text-white">Sudar Help Center</h1>
      </div>
      <p className="text-sm text-slate-400 mb-6 max-w-2xl">
        Guides for admins and authors: search below, browse by category in the sidebar, or open the short{' '}
        <Link href="/help/ai-at-sudar" className="text-indigo-400 hover:text-indigo-300">
          Understanding AI
        </Link>{' '}
        course ({aiLiteracyCount} lessons from Markdown).
      </p>

      <HelpCenterSearch articles={articles} />

      <section className="mb-10 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
        <h2 className="text-sm font-medium text-white mb-2">Understanding AI in Sudar (short course)</h2>
        <p className="text-sm text-slate-400 mb-3">
          Plain-language lessons: what AI does in Studio and Learn, cloud vs private server, Gemma, Sudar Agents, and
          troubleshooting.
        </p>
        <Link href="/help/ai-at-sudar" className="text-sm text-indigo-400 hover:text-indigo-300">
          Open the course →
        </Link>
      </section>

      <div className="space-y-10">
        {HELP_CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat]
          if (!items?.length) return null
          return (
            <section key={cat} id={`category-${cat}`}>
              <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3">
                {helpCategoryLabel(cat)}
              </h2>
              <ul className="space-y-2">
                {items.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/help/${a.slug}`}
                      className="text-sm text-indigo-400 hover:text-indigo-300 block"
                    >
                      {a.title}
                    </Link>
                    {a.description ? (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{a.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3">Quick setup</h2>
        <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2 mb-4">
          <li>
            Create a Supabase project and add env keys as described in{' '}
            <Link href="/help/start-here/getting-started" className="text-indigo-400 hover:text-indigo-300">
              Getting started
            </Link>
            .
          </li>
          <li>
            Set session auth env for Studio (see your deployment runbook).
          </li>
          <li>
            Add at least one AI key in{' '}
            <Link href="/settings/keys" className="text-indigo-400 hover:text-indigo-300">
              AI &amp; API Keys
            </Link>
            .
          </li>
          <li>
            Optional:{' '}
            <Link href="/integrations" className="text-indigo-400 hover:text-indigo-300">
              Integrations
            </Link>{' '}
            (ALP keys, embed URL, SSO).
          </li>
        </ol>
      </section>

      <section className="mt-8 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <a
          href="https://github.com/Dhanikesh-Karunanithi/Sudar"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
        >
          <BookOpen className="w-4 h-4" />
          Integration guide (docs/INTEGRATION_GUIDE.md) <ExternalLink className="w-3 h-3" />
        </a>
        <p className="text-xs text-slate-500 mt-1">LMS, ERP, user mapping, ALP events, embed, data pipelines.</p>
      </section>
    </div>
  )
}
