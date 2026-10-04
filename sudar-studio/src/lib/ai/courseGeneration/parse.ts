import { moduleEnvelopeSchema } from '@shared-content-generation/schemas'

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
  let parsed: unknown
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null
    parsed = JSON.parse(match[0])
  } catch {
    return null
  }
  const result = moduleEnvelopeSchema.safeParse(parsed)
  if (!result.success) return null
  const env = result.data
  const out: {
    entryState?: { type: string; content: string }
    exitState?: { type: string; content: string }
    sideCard?: { title: string; content: string; tips?: string[]; noteType?: string; visibility?: SideCardVisibility }
  } = {}
  if (env.entryState && env.entryState.content.trim().length > 10) {
    out.entryState = { type: env.entryState.type, content: env.entryState.content.trim() }
  }
  if (env.exitState) {
    out.exitState = { type: env.exitState.type, content: env.exitState.content.trim() }
  }
  if (env.sideCard && env.sideCard.content.trim().length > 20) {
    out.sideCard = { ...env.sideCard }
  }
  return out
}
