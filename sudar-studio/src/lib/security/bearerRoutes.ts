// Only routes that resolve the caller via getRequestSession may be reached with a Bearer token;
// everything else is cookie-session only so a forged Authorization header cannot skip auth.
const BEARER_API_ROUTES: RegExp[] = [
  /^\/api\/ai\/(generate-course|generate-course-metadata|generate-outline|generate-quiz|generate-from-document)$/,
  /^\/api\/courses$/,
  /^\/api\/courses\/[^/]+\/export$/,
  /^\/api\/mcp\/(complete-oauth|audit)$/,
  /^\/api\/agents\/runs$/,
  /^\/api\/org\/external-courses\/(search|import|settings)$/,
]

export function isBearerApiRoute(pathname: string): boolean {
  return BEARER_API_ROUTES.some((re) => re.test(pathname))
}

// These routes verify their own shared secret (CRON_SECRET, org integration key, render grant)
// and fail closed when it is missing, so middleware must not require a user session.
const SELF_AUTHENTICATING_PREFIXES = [
  '/api/cron/',
  '/api/org/provisioning/',
  '/api/studio/ai/generate-video/render/',
]

export function isSelfAuthenticatingApiRoute(pathname: string): boolean {
  return SELF_AUTHENTICATING_PREFIXES.some((p) => pathname.startsWith(p))
}
