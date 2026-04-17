/** Normalize a storage path: forward slashes, no leading slash, no traversal. */
export function normalizeScormStoragePath(raw: string): string | null {
  try {
    const decoded = decodeURIComponent(raw.trim())
    const cleaned = decoded.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\//, '')
    if (!cleaned || cleaned.includes('..')) return null
    return cleaned
  } catch {
    return null
  }
}

export function isPathUnderCourseScormPackage(path: string, courseId: string): boolean {
  const prefix = `scorm-packages/${courseId}/`
  if (!path.startsWith(prefix)) return false
  const rest = path.slice(prefix.length)
  if (!rest || rest.includes('..')) return false
  return true
}
