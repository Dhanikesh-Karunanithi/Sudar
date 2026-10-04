/**
 * Allowlisted HTML for tutor lesson_html blocks (server + client safe).
 * Strips scripts, event handlers, and dangerous URLs. Not a full browser XSS engine —
 * keep the allowlist tight and prefer structured blocks when possible.
 */

const ALLOWED_TAGS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'ul',
  'ol',
  'li',
  'strong',
  'b',
  'em',
  'i',
  'code',
  'pre',
  'blockquote',
  'br',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'a',
  'span',
  'div',
  'section',
  'article',
])

const MAX_HTML_CHARS = 40_000

function stripDangerousChunks(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|svg|math)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|svg|math)[^>]*\/?\s*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '')
    .replace(/\s(href|src)\s*=\s*javascript:[^\s>]+/gi, '')
}

function isAllowedHref(href: string): boolean {
  const t = href.trim()
  if (t.startsWith('#') || t.startsWith('/')) return true
  return /^https:\/\//i.test(t)
}

/**
 * Returns sanitized HTML, or empty string if nothing safe remains.
 */
export function sanitizeLessonHtml(raw: string): string {
  if (!raw || typeof raw !== 'string') return ''
  let html = raw.trim().slice(0, MAX_HTML_CHARS)
  if (!html) return ''

  html = stripDangerousChunks(html)

  // Drop or neutralize disallowed tags; keep text content.
  html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (full, tagName: string) => {
    const tag = tagName.toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) {
      return ''
    }
    if (full.startsWith('</')) {
      return `</${tag}>`
    }
    if (tag === 'br' || tag === 'hr') {
      return `<${tag} />`
    }
    if (tag === 'a') {
      const hrefMatch = full.match(/\bhref\s*=\s*(["'])(.*?)\1/i)
      const href = hrefMatch?.[2]?.trim() ?? ''
      if (!href || !isAllowedHref(href)) {
        return '<span>'
      }
      const safe = href.replace(/"/g, '&quot;')
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer">`
    }
    // Strip all attributes on other tags (class/id/style not needed for lessons).
    return `<${tag}>`
  })

  // Unclosed / leftover junk from stripping
  html = html.replace(/<(?!\/?(?:h[1-4]|p|ul|ol|li|strong|b|em|i|code|pre|blockquote|br|hr|table|thead|tbody|tr|th|td|a|span|div|section|article)\b)[^>]*>/gi, '')

  return html.trim()
}
