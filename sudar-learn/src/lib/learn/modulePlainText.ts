import type { Json } from '@/types/database'
import { isRichContent, type RichContent } from '@/types/content'

/** Flatten module JSON content to plain text for AI prompts (caps length). */
export function moduleContentToPlainText(content: Json | null, maxChars = 12000): string {
  if (content === null || content === undefined) return ''
  const c = content as Record<string, unknown>
  if (c.type === 'text' && typeof c.body === 'string') {
    return truncate(c.body, maxChars)
  }
  if (isRichContent(c as unknown as RichContent)) {
    const parts: string[] = []
    const rc = c as unknown as RichContent
    if (rc.introduction) parts.push(rc.introduction)
    rc.sections?.forEach((s) => {
      parts.push(s.heading, s.content)
    })
    if (rc.summary) parts.push(rc.summary)
    return truncate(parts.join('\n\n'), maxChars)
  }
  return truncate(JSON.stringify(content).slice(0, maxChars), maxChars)
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return `${s.slice(0, n)}\n\n[…truncated for the model…]`
}
