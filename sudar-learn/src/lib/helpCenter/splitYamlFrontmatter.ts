import { parse as parseYaml } from 'yaml'

/**
 * Parses a leading YAML block delimited by `---` lines (same shape as gray-matter).
 */
export function splitYamlFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const text = raw.replace(/^\uFEFF/, '')
  const normalized = text.replace(/\r\n/g, '\n')
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/.exec(normalized)
  if (!m) {
    return { data: {}, content: text.trimEnd() }
  }
  let data: Record<string, unknown> = {}
  try {
    const parsed = parseYaml(m[1])
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      data = { ...(parsed as Record<string, unknown>) }
    }
  } catch {
    // invalid YAML → empty meta; body still returned
  }
  return { data, content: m[2].trimEnd() }
}
