import Link from 'next/link'
import {
  HELP_CATEGORY_ORDER,
  helpCategoryLabel,
} from '@/lib/helpCenter/categoryLabels'
import { groupedByCategory, loadHelpArticlesIndex } from '@/lib/helpCenter/server'

export default function LearnHelpCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const meta = loadHelpArticlesIndex()
  const grouped = groupedByCategory(meta)

  return (
    <div className="flex flex-col lg:flex-row gap-10 max-w-[1200px] mx-auto">
      <aside className="lg:w-56 shrink-0 space-y-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Sudar Help Center</p>
          <nav className="space-y-1">
            <Link href="/help" className="block text-sm text-primary hover:underline">
              Home
            </Link>
          </nav>
        </div>
        {HELP_CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat]
          if (!items?.length) return null
          return (
            <div key={cat}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {helpCategoryLabel(cat)}
              </p>
              <ul className="space-y-0.5">
                {items.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/help/${a.slug}`} className="text-sm text-muted-foreground hover:text-card-foreground line-clamp-2 leading-snug">
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
