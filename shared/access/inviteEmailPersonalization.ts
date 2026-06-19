/** First name (or email local-part) for org-invite email templates via Supabase {{ .Data.invited_by_name }}. */
export function formatInviterDisplayName(
  fullName: string | null | undefined,
  email: string | null | undefined
): string | null {
  const trimmed = fullName?.trim()
  if (trimmed) {
    const first = trimmed.split(/\s+/)[0]
    if (first) return first
  }

  const local = email?.split('@')[0]?.trim()
  if (local) return local

  return null
}
