import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { HelpMarkdown } from '@/components/help/HelpMarkdown'
import { helpCategoryLabel } from '@/lib/helpCenter/categoryLabels'
import { getHelpArticle, slugArrayForGenerateStatic } from '@/lib/helpCenter/server'

export async function generateStaticParams() {
  return slugArrayForGenerateStatic()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const article = getHelpArticle(slug)
  if (!article) return { title: 'Help' }
  return {
    title: `${article.title} — Sudar Help Center`,
    description: article.description,
  }
}

export default async function LearnHelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const article = getHelpArticle(slug)
  if (!article) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-muted-foreground text-sm flex-wrap">
        <Link href="/help" className="hover:text-primary">
          Sudar Help Center
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <span className="text-muted-foreground">{helpCategoryLabel(article.category)}</span>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <span className="text-card-foreground">{article.title}</span>
      </div>
      <h1 className="text-2xl font-semibold text-card-foreground mb-2 font-display">{article.title}</h1>
      {article.description ? <p className="text-sm text-muted-foreground mb-8">{article.description}</p> : <div className="mb-8" />}
      <HelpMarkdown markdown={article.bodyMarkdown} />
    </div>
  )
}
