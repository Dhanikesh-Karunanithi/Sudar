export function studioPublicOrigin(requestUrl?: string): string {
  const envUrl = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '')
    .trim()
    .replace(/\/$/, '')
  if (envUrl) return envUrl
  if (requestUrl) {
    try {
      return new URL(requestUrl).origin
    } catch {
      // ignore invalid request URL
    }
  }
  return 'https://studio.thesudar.com'
}

export function studioCourseEditorUrl(courseId: string, requestUrl?: string): string {
  return `${studioPublicOrigin(requestUrl)}/courses/${courseId}`
}

export function studioCoursePackageUrl(token: string, requestUrl?: string): string {
  return `${studioPublicOrigin(requestUrl)}/share/p/${token}`
}

export function mintCoursePackageToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8)
}
