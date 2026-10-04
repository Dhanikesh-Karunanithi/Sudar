export function withStudioDirective(ok: boolean, body: string): string {
  if (ok) {
    return [
      'Sudar Studio created or exported this course.',
      'Give the user the studio_url so they can edit, preview, and re-export in Studio.',
      'If html.modules or html.combined_html is present, the course already has HTML lesson pages — summarize them; do not rewrite a new curriculum.',
      'If scorm.zip_base64 is present, tell the user it is a SCORM 1.2 ZIP encoded as base64 they can save and upload to an LMS.',
      'If scorm.too_large is true, tell them to download SCORM from Studio using the studio_url.',
      'Do not invent a different outline or write a substitute course.',
      '',
      body,
    ].join('\n')
  }
  return [
    'Sudar Studio could not complete this request. Report the error below.',
    'Do not write a substitute course outline.',
    '',
    body,
  ].join('\n')
}

export function parseObject(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
  } catch {
    return null
  }
}

export function ensureStudioUrl(payload: Record<string, unknown>, studioBase: string): Record<string, unknown> {
  const id =
    typeof payload.course_id === 'string'
      ? payload.course_id
      : typeof payload.id === 'string'
        ? payload.id
        : null
  if (id && typeof payload.studio_url !== 'string') {
    return { ...payload, studio_url: `${studioBase.replace(/\/$/, '')}/courses/${id}` }
  }
  return payload
}

export function nestedData(payload: Record<string, unknown>): Record<string, unknown> {
  const data = payload.data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>
  }
  return payload
}
