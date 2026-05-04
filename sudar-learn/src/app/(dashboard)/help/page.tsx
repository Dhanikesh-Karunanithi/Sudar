import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { HelpCenterSearch } from '@/components/help/HelpCenterSearch'
import { HELP_CATEGORY_ORDER, helpCategoryLabel } from '@/lib/helpCenter/categoryLabels'
import { groupedByCategory, loadHelpArticlesIndex } from '@/lib/helpCenter/server'

export const metadata = {
  title: 'Sudar Help Center — Sudar Learn',
}

export default function LearnHelpHubPage() {
  const articles = loadHelpArticlesIndex()
  const grouped = groupedByCategory(articles)

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-6 h-6 text-primary shrink-0" />
        <h1 className="text-xl font-semibold text-card-foreground font-display">Sudar Help Center</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Guides while you study: modalities, tutor and memory, paths, certificates, and trust FAQs. Administrators maintain
        additional articles inside Sudar Studio.
      </p>

      <HelpCenterSearch articles={articles} />

      <div className="space-y-10">
        {HELP_CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat]
          if (!items?.length) return null
          return (
            <section key={cat} id={`category-${cat}`}>
              <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider mb-3 font-display">
                {helpCategoryLabel(cat)}
              </h2>
              <ul className="space-y-2">
                {items.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/help/${a.slug}`} className="text-sm text-primary hover:underline block font-medium">
                      {a.title}
                    </Link>
                    {a.description ? (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
