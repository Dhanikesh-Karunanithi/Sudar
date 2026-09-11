export function withStudioDirective(ok: boolean, body: string): string {
  if (ok) {
    return [
      'Sudar generated this course. Stay in this chat.',
      'Primary output is HTML lessons and SCORM for the user to download or copy here.',
      'Give package_url so they can download HTML + SCORM without opening the Studio editor.',
      'Studio URL is OPTIONAL — only mention it as a way to host, publish, or keep editing in Sudar.',
      'If html.modules are present, paste each lesson as an HTML file/code block. Do not rewrite a new curriculum.',
      'If scorm_url is present, give that download link. Do not dump zip_base64.',
      'If generation_status is running, call sudar_build_course again with the same course_id after poll_after_seconds. Do not create a second course.',
      'Do not invent a different outline or write a substitute course.',
      '',
      body,
    ].join('\n')
  }
  return [
    'Sudar could not complete this request. Report the error below.',
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

const MAX_LESSON_HTML_CHARS = 24_000

export function formatChatGptCourseDeliverable(payload: Record<string, unknown>): string {
  const title = typeof payload.title === 'string' ? payload.title : 'Sudar course'
  const courseId = typeof payload.course_id === 'string' ? payload.course_id : ''
  const remaining =
    typeof payload.remaining_empty === 'number' ? payload.remaining_empty : null
  const completed = payload.generation_completed === true || remaining === 0
  const packageUrl = typeof payload.package_url === 'string' ? payload.package_url : null
  const studioUrl = typeof payload.studio_url === 'string' ? payload.studio_url : null
  const htmlUrl = typeof payload.html_url === 'string' ? payload.html_url : packageUrl
  const scormUrl = typeof payload.scorm_url === 'string' ? payload.scorm_url : null
  const pollAfter =
    typeof payload.poll_after_seconds === 'number' ? payload.poll_after_seconds : 20

  if (!completed) {
    return [
      `# ${title}`,
      '',
      'Sudar is writing the lessons. Stay in this chat — do not send the user to the Studio editor yet.',
      '',
      packageUrl ? `**Learner package (HTML + SCORM, refreshes as lessons finish):** ${packageUrl}` : '',
      '',
      `course_id: ${courseId}`,
      `remaining_empty: ${remaining ?? 'unknown'}`,
      `generation_status: running`,
      `next_tool: sudar_build_course`,
      `poll_after_seconds: ${pollAfter}`,
      '',
      `Call sudar_build_course again with course_id ${courseId} after about ${pollAfter} seconds. Do not create a new course. Do not write the lessons yourself.`,
      studioUrl
        ? `\nOptional later: host and keep editing in Sudar Studio: ${studioUrl}`
        : '',
    ]
      .filter((line) => line !== '')
      .join('\n')
  }

  const html = payload.html
  const modules =
    html && typeof html === 'object' && !Array.isArray(html)
      ? (html as { modules?: { title?: string; html?: string }[] }).modules
      : null

  const lessonBlocks = (modules ?? [])
    .map((mod, i) => {
      const lessonTitle = typeof mod.title === 'string' ? mod.title : `Lesson ${i + 1}`
      const raw = typeof mod.html === 'string' ? mod.html : ''
      const clipped =
        raw.length > MAX_LESSON_HTML_CHARS
          ? `${raw.slice(0, MAX_LESSON_HTML_CHARS)}\n<!-- truncated; download full HTML from ${htmlUrl ?? packageUrl ?? ''} -->`
          : raw
      return `### ${i + 1}. ${lessonTitle}\n\n\`\`\`html\n${clipped}\n\`\`\``
    })
    .join('\n\n')

  return [
    `# ${title}`,
    '',
    'Sudar generated learner-ready materials. Present these in this chat. The user does not need to open Studio to take or ship the course.',
    '',
    htmlUrl ? `**Download all HTML lessons:** ${htmlUrl}` : '',
    scormUrl ? `**Download SCORM 1.2 ZIP:** ${scormUrl}` : '',
    packageUrl && packageUrl !== htmlUrl ? `**Package page:** ${packageUrl}` : '',
    '',
    lessonBlocks ? '## HTML lessons\n\nSave each block as an `.html` file, or use the combined download.\n\n' + lessonBlocks : '',
    '',
    studioUrl
      ? `---\nOptional: host, publish, and keep editing in Sudar Studio: ${studioUrl}`
      : '',
  ]
    .filter((line) => line !== '')
    .join('\n')
}
