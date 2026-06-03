import { ENTRY_TYPES, EXIT_TYPES, SIDE_NOTE_TYPES } from './prompts'

export function extractSummary(content: string, title: string): string {
  const lines = content.split('\n').filter((l) => l.trim().length > 0 && !l.startsWith('#'))
  const meaningful = lines.slice(0, 6).join(' ').replace(/\[.*?\]/g, '').trim()
  const truncated = meaningful.length > 300 ? meaningful.slice(0, 300) + '…' : meaningful
  return truncated || `Covers the topic "${title}".`
}

/** Split markdown by ## headings into sections so the curriculum structure is visible. */
export function parseMarkdownSections(markdown: string): { heading: string; content: string }[] {
  const trimmed = markdown.trim()
  if (!trimmed) return [{ heading: '', content: '' }]
  const parts = trimmed.split(/\n(?=##\s+)/)
  return parts.map((block) => {
    const firstLine = block.indexOf('\n')
    const head = firstLine === -1 ? block : block.slice(0, firstLine)
    const body = firstLine === -1 ? '' : block.slice(firstLine + 1).trim()
    const isHeading = /^##\s+/.test(head)
    const heading = isHeading ? head.replace(/^##\s*/, '').trim() : ''
    const content = isHeading ? body : block.trim()
    return { heading, content }
  })
}

export type SideCardVisibility = 'hidden' | 'floating' | 'visible'

export function parseEnvelope(raw: string): {
  entryState?: { type: string; content: string }
  exitState?: { type: string; content: string }
  sideCard?: {
    title: string
    content: string
    tips?: string[]
    noteType?: string
    visibility?: SideCardVisibility
  }
} | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0]) as Record<string, unknown>
    const out: {
      entryState?: { type: string; content: string }
      exitState?: { type: string; content: string }
      sideCard?: { title: string; content: string; tips?: string[]; noteType?: string }
    } = {}
    const entry = parsed.entryState as { type?: string; content?: string } | null | undefined
    if (
      entry &&
      entry !== null &&
      entry.type &&
      ENTRY_TYPES.includes(entry.type as (typeof ENTRY_TYPES)[number]) &&
      typeof entry.content === 'string' &&
      entry.content.trim().length > 10
    ) {
      out.entryState = { type: entry.type, content: entry.content.trim() }
    }
    const exit = parsed.exitState as { type?: string; content?: string } | undefined
    if (exit?.type && EXIT_TYPES.includes(exit.type as (typeof EXIT_TYPES)[number]) && typeof exit.content === 'string') {
      out.exitState = { type: exit.type, content: exit.content }
    }
    const side = parsed.sideCard as {
      title?: string
      content?: string
      noteType?: string
      visibility?: string
    } | undefined
    if (side?.title && typeof side.content === 'string' && side.content.trim().length > 20) {
      const noteType =
        side.noteType && SIDE_NOTE_TYPES.includes(side.noteType as (typeof SIDE_NOTE_TYPES)[number])
          ? side.noteType
          : undefined
      const vis =
        side.visibility === 'visible' || side.visibility === 'floating' || side.visibility === 'hidden'
          ? side.visibility
          : 'hidden'
      out.sideCard = { title: side.title, content: side.content, noteType, visibility: vis }
    }
    return out
  } catch {
    return null
  }
}
