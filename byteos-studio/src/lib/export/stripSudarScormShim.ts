/**
 * Removes Sudar-only SCORM shim injected on import so packages run in external LMS players.
 */
export function stripSudarScormShim(html: string): string {
  return html.replace(/<script[^>]*\bid\s*=\s*["']sudar-scorm-shim["'][^>]*>[\s\S]*?<\/script>/gi, '')
}
