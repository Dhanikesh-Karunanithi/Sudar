const CATEGORY_LABELS: Record<string, string> = {
  'start-here': 'Start here',
  learners: 'For learners',
  admins: 'For admins',
  'ai-literacy': 'Understanding AI',
  trust: 'Trust & privacy',
  success: 'Customer success',
}

export const HELP_CATEGORY_ORDER = ['start-here', 'learners', 'admins', 'ai-literacy', 'trust', 'success'] as const

export function helpCategoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug
}
