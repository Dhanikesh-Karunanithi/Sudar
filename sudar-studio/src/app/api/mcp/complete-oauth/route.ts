import { getRequestSession } from '@/lib/auth/requestSession'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const BodySchema = z.object({
  mcp_auth: z.string().min(1),
})

function mcpPublicUrl(): string {
  const raw = process.env.NEXT_PUBLIC_MCP_URL
  if (typeof raw === 'string' && raw.trim()) return raw.trim().replace(/\/$/, '')
  return 'https://mcp.thesudar.com'
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'mcp_auth required' }, { status: 400 })
  }

  const res = await fetch(`${mcpPublicUrl()}/oauth/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mcp_auth: parsed.data.mcp_auth,
      access_token: session.accessToken,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as { redirect_to?: string; error?: string }
  if (!res.ok || !data.redirect_to) {
    return NextResponse.json(
      { success: false, error: data.error || 'mcp_oauth_failed' },
      { status: res.ok ? 502 : res.status },
    )
  }

  return NextResponse.json({ success: true, redirect_to: data.redirect_to })
}
