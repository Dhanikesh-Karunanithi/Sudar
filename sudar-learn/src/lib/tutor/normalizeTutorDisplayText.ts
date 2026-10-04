/**
 * Convert accidental HTML in tutor chat prose into readable markdown-ish text.
 * Models sometimes put lesson HTML in the chat body instead of lesson_html BLOCKS.
 */

const HTML_TAG_RE = /<\/?(?:p|h[1-6]|ul|ol|li|pre|code|strong|em|b|i|br|hr|div|span|blockquote|table|thead|tbody|tr|th|td|a|section|article)\b[^>]*>/i

export function textLooksLikeHtml(input: string): boolean {
  return HTML_TAG_RE.test(input)
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

/**
 * Best-effort HTML → markdown for ChatMarkdown. Not a full browser parser.
 */
export function htmlToReadableMarkdown(html: string): string {
  let s = html.trim()
  if (!s) return ''

  s = s.replace(/<script[\s\S]*?<\/script>/gi, '')
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '')

  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
  s = s.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n')

  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<\/p>/gi, '\n\n')
  s = s.replace(/<p[^>]*>/gi, '')
  s = s.replace(/<\/div>/gi, '\n')
  s = s.replace(/<div[^>]*>/gi, '')

  s = s.replace(/<li[^>]*>/gi, '- ')
  s = s.replace(/<\/li>/gi, '\n')
  s = s.replace(/<\/?ul[^>]*>/gi, '\n')
  s = s.replace(/<\/?ol[^>]*>/gi, '\n')

  s = s.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
  s = s.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
  s = s.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
  s = s.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')

  s = s.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, inner: string) => {
    const code = decodeBasicEntities(inner.replace(/<[^>]+>/g, '')).trim()
    return `\n\n\`\`\`\n${code}\n\`\`\`\n\n`
  })
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, inner: string) => {
    const code = decodeBasicEntities(inner.replace(/<[^>]+>/g, ''))
    return `\`${code}\``
  })

  s = s.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
  s = s.replace(/<\/?blockquote[^>]*>/gi, '\n')
  s = s.replace(/<hr\s*\/?>/gi, '\n\n---\n\n')

  s = s.replace(/<[^>]+>/g, '')
  s = decodeBasicEntities(s)
  s = s.replace(/[ \t]+\n/g, '\n')
  s = s.replace(/\n{3,}/g, '\n\n')
  return s.trim()
}

/** Plain markdown/prose → simple allowlisted HTML for lesson_html fallback. */
export function proseToSimpleLessonHtml(prose: string): string {
  const trimmed = prose.trim()
  if (!trimmed) return '<p></p>'
  if (textLooksLikeHtml(trimmed)) return trimmed

  const blocks = trimmed.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  const parts: string[] = []
  for (const block of blocks) {
    if (/^###\s+/.test(block)) {
      parts.push(`<h3>${escapeHtml(block.replace(/^###\s+/, ''))}</h3>`)
      continue
    }
    if (/^##\s+/.test(block)) {
      parts.push(`<h2>${escapeHtml(block.replace(/^##\s+/, ''))}</h2>`)
      continue
    }
    if (/^#\s+/.test(block)) {
      parts.push(`<h2>${escapeHtml(block.replace(/^#\s+/, ''))}</h2>`)
      continue
    }
    const lines = block.split('\n')
    if (lines.every((l) => /^[-*]\s+/.test(l) || l.trim() === '')) {
      const items = lines
        .filter((l) => /^[-*]\s+/.test(l))
        .map((l) => `<li>${escapeHtml(l.replace(/^[-*]\s+/, ''))}</li>`)
        .join('')
      parts.push(`<ul>${items}</ul>`)
      continue
    }
    if (lines.every((l) => /^\d+\.\s+/.test(l) || l.trim() === '')) {
      const items = lines
        .filter((l) => /^\d+\.\s+/.test(l))
        .map((l) => `<li>${escapeHtml(l.replace(/^\d+\.\s+/, ''))}</li>`)
        .join('')
      parts.push(`<ol>${items}</ol>`)
      continue
    }
    parts.push(`<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
  }
  return parts.join('') || `<p>${escapeHtml(trimmed)}</p>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Normalize tutor chat body for display: convert leaked HTML; leave clean markdown alone.
 */
export function normalizeTutorDisplayText(input: string): string {
  const t = (input ?? '').trim()
  if (!t) return ''
  if (textLooksLikeHtml(t)) return htmlToReadableMarkdown(t)
  return t
}
