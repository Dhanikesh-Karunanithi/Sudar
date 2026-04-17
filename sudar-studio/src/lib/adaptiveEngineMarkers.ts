/**
 * Parses AI "personalization markers" from module prose (see courseGeneration prompts).
 * Studio preview renders these as callouts — keep in sync with sudar-learn/src/lib/adaptiveEngineMarkers.ts
 */

export type AdaptiveMarkerSegment =
  | { type: 'text'; value: string }
  | { type: 'objective'; value: string }
  | { type: 'apply'; value: string }
  | { type: 'concept'; label: string; value: string }

export type MarkdownCodeOrText =
  | { type: 'text'; value: string }
  | { type: 'code'; lang: string; value: string }

export function splitMarkdownByCodeFences(body: string): MarkdownCodeOrText[] {
  const chunks: MarkdownCodeOrText[] = []
  let pos = 0
  while (pos < body.length) {
    const idx = body.indexOf('```', pos)
    if (idx === -1) {
      if (pos < body.length) chunks.push({ type: 'text', value: body.slice(pos) })
      break
    }
    if (idx > pos) chunks.push({ type: 'text', value: body.slice(pos, idx) })
    const lineBreak = body.indexOf('\n', idx + 3)
    if (lineBreak === -1) {
      chunks.push({ type: 'text', value: body.slice(pos) })
      break
    }
    const lang = body.slice(idx + 3, lineBreak).trim()
    const codeStart = lineBreak + 1
    const closeIdx = body.indexOf('```', codeStart)
    if (closeIdx === -1) {
      chunks.push({ type: 'text', value: body.slice(pos) })
      break
    }
    const code = body.slice(codeStart, closeIdx)
    chunks.push({ type: 'code', lang: lang || 'code', value: code })
    pos = closeIdx + 3
    if (body[pos] === '\r') pos++
    if (body[pos] === '\n') pos++
  }
  return chunks
}

export function parseAdaptiveEngineMarkers(input: string): AdaptiveMarkerSegment[] {
  const out: AdaptiveMarkerSegment[] = []
  let i = 0
  while (i < input.length) {
    const rest = input.slice(i)
    const idxObj = rest.indexOf('[objective]')
    const idxApply = rest.indexOf('[apply]')
    const idxConcept = rest.indexOf('[concept:')
    const candidates: { pos: number; kind: 'o' | 'a' | 'c' }[] = []
    if (idxObj >= 0) candidates.push({ pos: idxObj, kind: 'o' })
    if (idxApply >= 0) candidates.push({ pos: idxApply, kind: 'a' })
    if (idxConcept >= 0) candidates.push({ pos: idxConcept, kind: 'c' })
    if (candidates.length === 0) {
      out.push({ type: 'text', value: input.slice(i) })
      break
    }
    candidates.sort((a, b) => a.pos - b.pos)
    const first = candidates[0]
    const startInInput = i + first.pos
    if (startInInput > i) {
      out.push({ type: 'text', value: input.slice(i, startInInput) })
    }

    if (first.kind === 'o') {
      const afterOpen = startInInput + '[objective]'.length
      const close = input.indexOf('[/objective]', afterOpen)
      if (close === -1) {
        out.push({ type: 'text', value: input.slice(startInInput) })
        break
      }
      out.push({ type: 'objective', value: input.slice(afterOpen, close).trim() })
      i = close + '[/objective]'.length
      continue
    }
    if (first.kind === 'a') {
      const afterOpen = startInInput + '[apply]'.length
      const close = input.indexOf('[/apply]', afterOpen)
      if (close === -1) {
        out.push({ type: 'text', value: input.slice(startInInput) })
        break
      }
      out.push({ type: 'apply', value: input.slice(afterOpen, close).trim() })
      i = close + '[/apply]'.length
      continue
    }

    const afterConceptTag = startInInput
    const labelEnd = input.indexOf(']', afterConceptTag + '[concept:'.length)
    if (labelEnd === -1) {
      out.push({ type: 'text', value: input.slice(startInInput) })
      break
    }
    const label = input.slice(afterConceptTag + '[concept:'.length, labelEnd).trim()
    const afterOpen = labelEnd + 1
    const close = input.indexOf('[/concept]', afterOpen)
    if (close === -1) {
      out.push({ type: 'text', value: input.slice(startInInput) })
      break
    }
    out.push({ type: 'concept', label, value: input.slice(afterOpen, close).trim() })
    i = close + '[/concept]'.length
  }
  return out
}
