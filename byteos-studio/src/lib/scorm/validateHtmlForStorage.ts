/** Basic checks before writing SCORM HTML back to Supabase Storage. */
const MAX_CHARS = 4 * 1024 * 1024

export function validateHtmlForScormStorage(raw: string): { ok: true } | { ok: false; error: string } {
  if (raw.includes('\0')) return { ok: false, error: 'Content contains invalid null bytes.' }
  if (raw.length > MAX_CHARS) return { ok: false, error: 'Content is too large (max about 4MB).' }
  const t = raw.trim()
  if (t.length < 8) return { ok: false, error: 'Content is too short.' }
  if (!t.includes('<') || !t.includes('>')) return { ok: false, error: 'Content does not look like HTML.' }
  return { ok: true }
}
