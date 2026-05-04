/** Split Markdown body into structured sections for the AI literacy navigator. */
export function markdownBodyToLessonSections(body: string): { heading?: string; paragraphs: string[] }[] {
  const trimmed = body.trim()
  if (!trimmed) return []

  const rawParts = trimmed.split(/\n(?=## )/)
  return rawParts
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('## ')) {
        const nlIdx = part.indexOf('\n')
        const heading = (nlIdx === -1 ? part.slice(3) : part.slice(3, nlIdx)).trim()
        const rest = nlIdx === -1 ? '' : part.slice(nlIdx + 1).trim()
        const paragraphs = rest
          ? rest
              .split(/\n\s*\n+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : []
        return heading ? { heading, paragraphs } : { paragraphs }
      }
      const paragraphs = part
        .split(/\n\s*\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
      return paragraphs.length ? { paragraphs } : { paragraphs: [] }
    })
    .filter((s) => (s.paragraphs?.length ?? 0) > 0 || Boolean(s.heading))
}
