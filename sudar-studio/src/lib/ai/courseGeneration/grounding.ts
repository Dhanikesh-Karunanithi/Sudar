/**
 * Relevance-based document grounding: pick the passages of the source document that match the module,
 * instead of slicing the document by module position (which misaligns whenever the source isn't
 * ordered the same way as the curriculum).
 */

const STOPWORDS = new Set(
  'a an and are as at be by for from has have how in into is it its of on or that the their this to was were what when where which who why will with you your about after before between can do does not our more most other some such than then there these they through under up we'.split(
    ' ',
  ),
)

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9'-]{2,}/g) ?? []).filter((t) => !STOPWORDS.has(t))
}

function splitPassages(full: string, target = 1200): string[] {
  const paragraphs = full.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const passages: string[] = []
  let current = ''
  for (const p of paragraphs) {
    if (current && current.length + p.length > target) {
      passages.push(current)
      current = ''
    }
    current = current ? `${current}\n\n${p}` : p
    while (current.length > target * 2) {
      passages.push(current.slice(0, target))
      current = current.slice(target)
    }
  }
  if (current) passages.push(current)
  return passages
}

/**
 * BM25-style scoring of passages against the module query; returns the best passages up to
 * `maxChars`, restored to document order so the excerpt reads naturally.
 */
export function selectRelevantDocumentChunk(
  full: string,
  query: { title: string; brief?: string; headings?: string[] },
  maxChars = 12000,
): string {
  const text = full.trim()
  if (!text) return ''
  if (text.length <= maxChars) return text

  const passages = splitPassages(text)
  const queryTerms = [
    ...tokenize(query.title),
    ...tokenize(query.title),
    ...tokenize(query.brief ?? ''),
    ...(query.headings ?? []).flatMap(tokenize),
  ]
  const uniqueTerms = [...new Set(queryTerms)]
  if (uniqueTerms.length === 0) return text.slice(0, maxChars)

  const tokenized = passages.map(tokenize)
  const avgLen = tokenized.reduce((n, t) => n + t.length, 0) / Math.max(1, tokenized.length)
  const df = new Map<string, number>()
  for (const toks of tokenized) {
    for (const term of new Set(toks)) df.set(term, (df.get(term) ?? 0) + 1)
  }
  const N = passages.length
  const k1 = 1.4
  const b = 0.75
  const qWeight = new Map<string, number>()
  for (const t of queryTerms) qWeight.set(t, (qWeight.get(t) ?? 0) + 1)

  const scored = tokenized.map((toks, index) => {
    const tf = new Map<string, number>()
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1)
    let score = 0
    for (const term of uniqueTerms) {
      const f = tf.get(term) ?? 0
      if (!f) continue
      const n = df.get(term) ?? 0
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5))
      score += (qWeight.get(term) ?? 1) * idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * toks.length) / Math.max(1, avgLen))))
    }
    return { index, score }
  })

  const chosen: number[] = []
  let used = 0
  for (const { index, score } of [...scored].sort((a, b2) => b2.score - a.score)) {
    if (score <= 0 && chosen.length > 0) break
    const len = passages[index]!.length
    if (used + len > maxChars && chosen.length > 0) continue
    chosen.push(index)
    used += len
    if (used >= maxChars * 0.9) break
  }
  return chosen
    .sort((a, b2) => a - b2)
    .map((i) => passages[i]!)
    .join('\n\n[…]\n\n')
}
