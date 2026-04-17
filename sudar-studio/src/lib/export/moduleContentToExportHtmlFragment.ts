/**
 * Builds an HTML fragment (inside body) for native module content for SCORM export.
 */
import { studioCourseMarkdownToHtml } from '@/lib/export/studioCourseMarkdownToHtml'
import type { RichContent, RichInteractiveElement } from '@/types/content'
import { isRichContent, isScormContent } from '@/types/content'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function interactiveElementToHtml(el: RichInteractiveElement, idx: number): string {
  const key = `ix-${idx}`
  if (el.type === 'expandable' && el.data?.title && el.data?.content) {
    return `<details class="ix-expandable" id="${key}"><summary>${escapeHtml(String(el.data.title))}</summary><div class="ix-body">${studioCourseMarkdownToHtml(String(el.data.content))}</div></details>`
  }
  if (el.type === 'quiz' && el.data?.question) {
    return `<div class="ix-quiz"><p class="ix-q">${escapeHtml(String(el.data.question))}</p><p class="ix-note">Quiz — complete in the LMS if required.</p></div>`
  }
  if (el.type === 'video' && el.data?.url) {
    const url = String(el.data.url).trim()
    const title = el.data?.title ? String(el.data.title) : 'Video'
    const isYouTube = /youtube\.com\/watch\?v=([^&]+)|youtu\.be\/([^?]+)/.exec(url)
    const isVimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url)
    const isDirect = /\.(mp4|webm|ogg)(\?|$)/i.test(url)
    if (isYouTube) {
      const yid = isYouTube[1] || isYouTube[2]
      return `<div class="ix-video"><p class="ix-title">${escapeHtml(title)}</p><div class="ix-aspect"><iframe title="${escapeHtml(title)}" src="https://www.youtube.com/embed/${escapeHtml(yid ?? '')}" allowfullscreen></iframe></div></div>`
    }
    if (isVimeo) {
      return `<div class="ix-video"><p class="ix-title">${escapeHtml(title)}</p><div class="ix-aspect"><iframe title="${escapeHtml(title)}" src="https://player.vimeo.com/video/${escapeHtml(isVimeo[1] ?? '')}" allowfullscreen></iframe></div></div>`
    }
    if (isDirect) {
      return `<div class="ix-video"><p class="ix-title">${escapeHtml(title)}</p><video controls src="${escapeHtml(url)}">Video not supported.</video></div>`
    }
    return `<div class="ix-video"><p><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></p></div>`
  }
  if (el.type === 'timeline' && Array.isArray(el.data?.steps)) {
    const steps = el.data.steps as { title?: string; description?: string }[]
    const lis = steps
      .map(
        (s) =>
          `<li><strong>${escapeHtml(String(s?.title || 'Step'))}</strong>${s?.description ? ` — ${escapeHtml(String(s.description))}` : ''}</li>`
      )
      .join('')
    return `<div class="ix-timeline"><p class="ix-label">Timeline</p><ul>${lis}</ul></div>`
  }
  if (el.type === 'flipcard' && Array.isArray(el.data?.cards)) {
    const cards = el.data.cards as { front?: string; back?: string }[]
    const rows = cards
      .map(
        (c) =>
          `<tr><td>${escapeHtml(String(c.front ?? ''))}</td><td>${escapeHtml(String(c.back ?? ''))}</td></tr>`
      )
      .join('')
    return `<div class="ix-flipcards"><table class="ix-cards"><thead><tr><th>Front</th><th>Back</th></tr></thead><tbody>${rows}</tbody></table></div>`
  }
  if (el.type === 'hotspot' && el.data?.imageUrl) {
    return `<div class="ix-hotspot"><img src="${escapeHtml(String(el.data.imageUrl))}" alt="" class="ix-img"/></div>`
  }
  if (el.type === 'matching' && Array.isArray(el.data?.pairs)) {
    const pairs = el.data.pairs as { term?: string }[]
    const instr =
      el.data?.instruction != null && String(el.data.instruction) !== ''
        ? `<p>${escapeHtml(String(el.data.instruction))}</p>`
        : ''
    return `<div class="ix-matching">${instr}<p>${pairs.length} matching pairs</p></div>`
  }
  if (el.type === 'tabs' && Array.isArray(el.data?.tabs)) {
    const tabs = el.data.tabs as { label?: string; content?: string }[]
    const labels = tabs.map((t) => escapeHtml(String(t?.label || 'Tab'))).join(', ')
    return `<div class="ix-tabs"><p class="ix-label">Tabs: ${labels}</p></div>`
  }
  if (el.type === 'audio' && el.data?.url) {
    const t = el.data?.title ? String(el.data.title) : 'Audio'
    return `<div class="ix-audio"><p>${escapeHtml(t)}</p><audio controls src="${escapeHtml(String(el.data.url))}"></audio></div>`
  }
  if (el.type === 'flashcard' && Array.isArray(el.data?.cards)) {
    const cards = el.data.cards as { front?: string }[]
    return `<div class="ix-flashcards"><p>${cards.length} flashcards</p><p>${escapeHtml(String(cards[0]?.front || '').slice(0, 120))}…</p></div>`
  }
  return ''
}

export function moduleContentJsonToExportHtmlFragment(content: unknown, moduleTitle: string): string {
  if (!content || typeof content !== 'object') {
    return `<p class="empty">${escapeHtml(moduleTitle)} — no content.</p>`
  }

  if (isScormContent(content)) {
    return `<p class="empty">This module is SCORM-packaged; see the linked SCO in this export.</p>`
  }

  const c = content as { type?: string; body?: string }
  if (c.type === 'text' && typeof c.body === 'string') {
    if (!c.body.trim()) return `<p class="empty">${escapeHtml(moduleTitle)} — no lesson text.</p>`
    return `<article class="mod-text">${studioCourseMarkdownToHtml(c.body)}</article>`
  }

  if (isRichContent(content)) {
    const rich = content as RichContent
    const parts: string[] = []
    if (rich.entryState?.content?.trim()) {
      parts.push(
        `<aside class="lesson-open"><div class="lbl">Lesson open</div>${studioCourseMarkdownToHtml(rich.entryState.content)}</aside>`
      )
    }
    if (rich.introduction?.trim()) {
      parts.push(`<div class="intro">${studioCourseMarkdownToHtml(rich.introduction)}</div>`)
    }
    if (rich.sections?.length) {
      for (const section of rich.sections) {
        const h = section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ''
        const body = studioCourseMarkdownToHtml(section.content)
        let fig = ''
        if (section.image?.url) {
          const alt = escapeHtml(section.image.alt ?? section.heading ?? 'Section image')
          fig = `<figure class="sec-img"><img src="${escapeHtml(section.image.url)}" alt="${alt}"/>${section.image.attribution ? `<figcaption>${escapeHtml(section.image.attribution)}</figcaption>` : ''}</figure>`
        }
        parts.push(`<section class="sec">${h}<div class="sec-body">${body}</div>${fig}</section>`)
      }
    }
    if (rich.interactiveElements?.length) {
      rich.interactiveElements.forEach((el, idx) => {
        const h = interactiveElementToHtml(el, idx)
        if (h) parts.push(h)
      })
    }
    if (rich.exitState?.content?.trim()) {
      parts.push(
        `<aside class="lesson-close"><div class="lbl">Take forward</div>${studioCourseMarkdownToHtml(rich.exitState.content)}</aside>`
      )
    }
    if (rich.sideCard?.title && rich.sideCard.content?.trim()) {
      parts.push(
        `<aside class="side-card"><h3>${escapeHtml(rich.sideCard.title)}</h3>${studioCourseMarkdownToHtml(rich.sideCard.content)}</aside>`
      )
    }
    if (rich.summary?.trim()) {
      parts.push(`<section class="summary"><h2>Summary</h2>${studioCourseMarkdownToHtml(rich.summary)}</section>`)
    }
    return parts.join('\n') || `<p class="empty">${escapeHtml(moduleTitle)} — no structured content.</p>`
  }

  return `<p class="empty">Unsupported module format (${escapeHtml(String((content as { type?: string }).type ?? 'unknown'))}).</p>`
}
