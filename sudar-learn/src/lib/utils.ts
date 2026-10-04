import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Strip raw ACTIONS: [...] line from tutor message content so it is never shown as code. */
export function stripTutorActionsFromText(content: string): string {
  if (!content?.trim()) return content ?? ''
  const t = content.trim()
  const withNewline = t.match(/\nACTIONS:\s*[\s\S]+$/)
  if (withNewline && typeof withNewline.index === 'number') {
    return t.slice(0, withNewline.index).trim().replace(/\n+$/, '')
  }
  const noNewline = t.match(/ACTIONS:\s*[\s\S]+$/)
  if (noNewline && typeof noNewline.index === 'number') {
    return t.slice(0, noNewline.index).trim().replace(/\n+$/, '')
  }
  return t
}

/** Strip trailing BLOCKS: [...] JSON from tutor text (not shown in chat when blocks are rendered separately). */
export function stripTutorBlocksFromText(content: string): string {
  if (!content?.trim()) return content ?? ''
  let t = content.trim()
  const withNewline = t.match(/\nBLOCKS:\s*[\s\S]+$/i)
  if (withNewline && typeof withNewline.index === 'number') {
    t = t.slice(0, withNewline.index).trim().replace(/\n+$/, '')
  }
  const noNewline = t.match(/BLOCKS:\s*[\s\S]+$/i)
  if (noNewline && typeof noNewline.index === 'number') {
    t = t.slice(0, noNewline.index).trim().replace(/\n+$/, '')
  }
  t = t.replace(/\n?```tutor_blocks\s*[\s\S]*?```\s*$/i, '').trim()
  // Trailing raw JSON array that looks like tutor blocks (no BLOCKS: prefix)
  t = t
    .replace(
      /\n?\[[\s\S]*"type"\s*:\s*"(lesson_html|video_embed|resource_card|choice_group|quiz|concept_card|diagram)"[\s\S]*$/i,
      '',
    )
    .trim()
  // Entire message is a single leaked block object
  if (
    /^\s*\{[\s\S]*"type"\s*:\s*"(lesson_html|video_embed|resource_card)"[\s\S]*"payload"\s*:/i.test(t)
  ) {
    return ''
  }
  return t
}

/** Strip ACTIONS and BLOCKS markers so assistant bubbles never leak structured tails. */
export function stripTutorModelArtifactsFromText(content: string): string {
  return stripTutorBlocksFromText(stripTutorActionsFromText(content))
}

/**
 * Safe one-line preview for notebook pages — never show BLOCKS JSON or raw payloads.
 */
export function safeNotebookPreview(text: string | undefined | null, maxLen = 160): string {
  const stripped = stripTutorModelArtifactsFromText(text ?? '').trim()
  if (!stripped) return ''
  if (
    /^\s*[\[{]/.test(stripped) ||
    /"type"\s*:\s*"(lesson_html|video_embed|resource_card)"/i.test(stripped) ||
    /BLOCKS\s*:/i.test(stripped)
  ) {
    return ''
  }
  return stripped.length > maxLen ? `${stripped.slice(0, maxLen)}…` : stripped
}
