/**
 * Server-side HTML for exported SCORM HTML — mirrors subset of
 * {@link renderStudioCourseMarkdown} / {@link renderMarkdownLines} without React.
 */
import {
  parseAdaptiveEngineMarkers,
  splitMarkdownByCodeFences,
  type AdaptiveMarkerSegment,
} from '@/lib/adaptiveEngineMarkers'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMarkdownLinesToHtml(body: string): string {
  if (!body.trim()) return ''
  const lines = body.split('\n')
  const parts: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (!t) {
      i++
      continue
    }
    if (t.startsWith('## ')) {
      parts.push(`<h2>${escapeHtml(t.slice(3))}</h2>`)
      i++
      continue
    }
    if (t.startsWith('### ')) {
      parts.push(`<h3>${escapeHtml(t.slice(4))}</h3>`)
      i++
      continue
    }
    if (t.startsWith('- ') || t.startsWith('* ')) {
      parts.push('<ul>')
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        parts.push(`<li>${escapeHtml(lines[i].trim().slice(2))}</li>`)
        i++
      }
      parts.push('</ul>')
      continue
    }
    if (t.startsWith('```')) {
      const lang = t.slice(3)
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      parts.push(
        `<div class="code-block"><div class="code-lang">${escapeHtml(lang || 'code')}</div><pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre></div>`
      )
      i++
      continue
    }
    parts.push(`<p>${escapeHtml(t)}</p>`)
    i++
  }
  return parts.join('\n')
}

function markerSegmentToHtml(segment: Exclude<AdaptiveMarkerSegment, { type: 'text' }>): string {
  switch (segment.type) {
    case 'objective':
      return `<aside class="callout callout-objective"><div class="callout-label">Objective</div><p>${escapeHtml(segment.value)}</p></aside>`
    case 'apply':
      return `<aside class="callout callout-apply"><div class="callout-label">Try this</div><p>${escapeHtml(segment.value)}</p></aside>`
    case 'concept': {
      const same =
        !segment.value.trim() || segment.value.trim().toLowerCase() === segment.label.trim().toLowerCase()
      return `<aside class="callout callout-concept"><div class="callout-label">Key concept</div><p><strong>${escapeHtml(segment.label)}</strong>${same ? '' : ` — ${escapeHtml(segment.value)}`}</p></aside>`
    }
    default:
      return ''
  }
}

function proseWithMarkersToHtml(text: string): string {
  const segments = parseAdaptiveEngineMarkers(text)
  return segments
    .map((seg) =>
      seg.type === 'text' ? renderMarkdownLinesToHtml(seg.value) : markerSegmentToHtml(seg)
    )
    .join('\n')
}

/** Converts Studio/Learn markdown (code fences + adaptive markers) to HTML. */
export function studioCourseMarkdownToHtml(body: string): string {
  if (!body?.trim()) return ''
  const chunks = splitMarkdownByCodeFences(body)
  return chunks
    .map((chunk) =>
      chunk.type === 'code'
        ? `<div class="code-block"><div class="code-lang">${escapeHtml(chunk.lang)}</div><pre><code>${escapeHtml(chunk.value)}</code></pre></div>`
        : proseWithMarkersToHtml(chunk.value)
    )
    .join('\n')
}
