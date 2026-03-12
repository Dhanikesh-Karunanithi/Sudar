/**
 * Extract plain text from course modules for AI generation (podcast, video script).
 * Used by studio podcast/video APIs to build the "content summary" passed to the LLM.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { isRichContent, isScormContent } from '@/types/content'
import type { RichContent, ScormContent, TextContent } from '@/types/content'

const MAX_CHARS = 8000

interface ModuleRow {
  id: string
  title: string
  content: unknown
  order_index: number | null
}

function extractTextFromContent(content: unknown): string {
  if (!content || typeof content !== 'object') return ''

  if (isRichContent(content)) {
    const rich = content as RichContent
    const parts: string[] = []
    if (rich.introduction) parts.push(rich.introduction)
    if (Array.isArray(rich.sections)) {
      for (const s of rich.sections) {
        if (s.heading) parts.push(s.heading)
        if (s.content) parts.push(s.content)
      }
    }
    if (rich.summary) parts.push(rich.summary)
    return parts.join('\n\n').trim()
  }

  if (isScormContent(content)) {
    const scorm = content as ScormContent
    return (scorm.scorm_text_content ?? '').trim()
  }

  if ((content as TextContent).type === 'text' && typeof (content as TextContent).body === 'string') {
    return ((content as TextContent).body ?? '').trim()
  }

  return ''
}

/**
 * Fetch course with modules and return up to MAX_CHARS of concatenated plain text
 * for use in podcast/video script generation.
 * Returns null if course not found, not owned by user, or has no extractable content.
 */
export async function getCourseContentForGeneration(
  admin: SupabaseClient,
  courseId: string,
  userId: string
): Promise<string | null> {
  const { data, error } = await admin
    .from('courses')
    .select('id, modules(id, title, content, order_index)')
    .eq('id', courseId)
    .eq('created_by', userId)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single()

  if (error || !data) return null

  const modules = (data as { modules: ModuleRow[] }).modules
  if (!Array.isArray(modules) || modules.length === 0) return null

  const sorted = [...modules].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  const parts: string[] = []
  for (const mod of sorted) {
    const text = extractTextFromContent(mod.content)
    if (text) parts.push(`## ${mod.title}\n\n${text}`)
  }

  const combined = parts.join('\n\n').trim()
  if (!combined) return null

  return combined.length <= MAX_CHARS ? combined : combined.substring(0, MAX_CHARS)
}
