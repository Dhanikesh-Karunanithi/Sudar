import fs from 'fs'
import path from 'path'
import { cache } from 'react'
import { splitYamlFrontmatter } from '@/lib/helpCenter/splitYamlFrontmatter'
import { HELP_CATEGORY_ORDER } from '@/lib/helpCenter/categoryLabels'
import type { HelpArticle, HelpArticleMeta, HelpAudience } from '@/lib/helpCenter/types'
import { helpArticlesRoot } from '@/lib/helpCenter/paths'

export { HELP_CATEGORY_ORDER, helpCategoryLabel } from '@/lib/helpCenter/categoryLabels'

function readableOnLearn(audience: HelpAudience): boolean {
  return audience === 'learner' || audience === 'both'
}

function walkMarkdownSlugs(absDir: string, relParts: string[] = []): string[] {
  if (!fs.existsSync(absDir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue
    const full = path.join(absDir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkMarkdownSlugs(full, [...relParts, entry.name]))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const base = entry.name.replace(/\.md$/i, '')
      out.push([...relParts, base].join('/'))
    }
  }
  return out
}

function parseAudience(v: unknown): HelpAudience {
  if (v === 'learner' || v === 'admin' || v === 'both') return v
  return 'both'
}

function metaFromGray(slug: string, data: Record<string, unknown>): HelpArticleMeta {
  const category = typeof data.category === 'string' && data.category.trim() ? data.category.trim() : 'start-here'
  const title = typeof data.title === 'string' && data.title.trim() ? data.title.trim() : slug.replace(/\//g, ' — ')
  const description =
    typeof data.description === 'string' && data.description.trim() ? data.description.trim() : undefined
  const audience = parseAudience(data.audience)
  const orderRaw = typeof data.order === 'number' ? data.order : Number(data.order)
  const order = Number.isFinite(orderRaw) ? orderRaw : 999
  const marketing = Boolean(data.marketing === true || data.marketing === 'true')
  return { slug, title, description, audience, category, order, marketing }
}

function slugToAbsolutePath(slug: string): string | null {
  const parts = slug.split('/').filter(Boolean)
  if (parts.some((p) => p.includes('..'))) return null
  return path.join(helpArticlesRoot(), ...parts) + '.md'
}

export const loadHelpArticlesIndex = cache(() => {
  const root = helpArticlesRoot()
  if (!fs.existsSync(root)) {
    return [] as HelpArticleMeta[]
  }
  const metaList: HelpArticleMeta[] = []
  for (const slug of walkMarkdownSlugs(root)) {
    const fp = slugToAbsolutePath(slug)
    if (!fp || !fs.existsSync(fp)) continue
    const raw = fs.readFileSync(fp, 'utf8')
    const { data } = splitYamlFrontmatter(raw)
    const meta = metaFromGray(slug, data as Record<string, unknown>)
    if (!readableOnLearn(meta.audience)) continue
    metaList.push(meta)
  }
  return metaList.sort((a, b) => {
    const catA = HELP_CATEGORY_ORDER.indexOf(a.category as (typeof HELP_CATEGORY_ORDER)[number])
    const catB = HELP_CATEGORY_ORDER.indexOf(b.category as (typeof HELP_CATEGORY_ORDER)[number])
    const cA = catA === -1 ? 999 : catA
    const cB = catB === -1 ? 999 : catB
    if (cA !== cB) return cA - cB
    if (a.order !== b.order) return a.order - b.order
    return a.title.localeCompare(b.title)
  })
})

export function groupedByCategory(items: HelpArticleMeta[]): Record<string, HelpArticleMeta[]> {
  const out: Record<string, HelpArticleMeta[]> = {}
  for (const m of items) {
    ;(out[m.category] ??= []).push(m)
  }
  for (const k of Object.keys(out)) {
    out[k]!.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
  }
  return out
}

export function getHelpArticle(slug: string[]): HelpArticle | null {
  if (slug.some((s) => s.includes('..'))) return null
  const key = slug.join('/')
  const fp = slugToAbsolutePath(key)
  if (!fp || !fs.existsSync(fp)) return null
  const raw = fs.readFileSync(fp, 'utf8')
  const { data, content } = splitYamlFrontmatter(raw)
  const meta = metaFromGray(key, data as Record<string, unknown>)
  if (!readableOnLearn(meta.audience)) return null
  return {
    ...meta,
    bodyMarkdown: content.trim(),
  }
}

export function slugArrayForGenerateStatic(): { slug: string[] }[] {
  return loadHelpArticlesIndex().map((m) => ({ slug: m.slug.split('/') }))
}
