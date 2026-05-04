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

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const article = getHelpArticle(slug)
  if (!article) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-slate-400 text-sm">
        <Link href="/help" className="hover:text-indigo-400">
          Sudar Help Center
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <span className="text-slate-500">{helpCategoryLabel(article.category)}</span>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <span className="text-slate-300">{article.title}</span>
      </div>
      <h1 className="text-2xl font-semibold text-white mb-2">{article.title}</h1>
      {article.description ? (
        <p className="text-sm text-slate-400 mb-8">{article.description}</p>
      ) : (
        <div className="mb-8" />
      )}
      <HelpMarkdown markdown={article.bodyMarkdown} />
    </div>
  )
}
