const MCP_PUBLIC_URL =
  typeof process.env.NEXT_PUBLIC_MCP_URL === 'string' && process.env.NEXT_PUBLIC_MCP_URL
    ? process.env.NEXT_PUBLIC_MCP_URL.replace(/\/$/, '')
    : 'https://mcp.thesudar.com'

export async function completeMcpOAuth(mcpAuth: string, accessToken: string): Promise<string> {
  const res = await fetch(`${MCP_PUBLIC_URL}/oauth/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mcp_auth: mcpAuth, access_token: accessToken }),
  })
  const data = (await res.json().catch(() => ({}))) as { redirect_to?: string; error?: string }
  if (!res.ok || !data.redirect_to) {
    throw new Error(data.error || 'mcp_oauth_failed')
  }
  return data.redirect_to
}
