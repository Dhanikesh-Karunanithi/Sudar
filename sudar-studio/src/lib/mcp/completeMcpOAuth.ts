export async function completeMcpOAuth(mcpAuth: string, _accessToken: string): Promise<string> {
  const res = await fetch('/api/mcp/complete-oauth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mcp_auth: mcpAuth }),
  })
  const data = (await res.json().catch(() => ({}))) as { redirect_to?: string; error?: string }
  if (!res.ok || !data.redirect_to) {
    throw new Error(data.error || 'mcp_oauth_failed')
  }
  return data.redirect_to
}
