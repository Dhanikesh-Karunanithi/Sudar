export type HelpAudience = 'learner' | 'admin' | 'both'

export type HelpArticleMeta = {
  slug: string
  title: string
  description: string | undefined
  audience: HelpAudience
  category: string
  order: number
  marketing: boolean
}

export type HelpArticle = HelpArticleMeta & { bodyMarkdown: string }

export type AdminAiLiteracyLesson = {
  id: string
  title: string
  summary: string
  sections: { heading?: string; paragraphs: string[] }[]
}
