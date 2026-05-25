import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export type EnvAuth = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  MCP_TOKEN_SECRET: string
}

export type McpSessionPayload = {
  sub: string
  access_token: string
  exp: number
  nonce: string
}

function sign(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url')
}

export function issueMcpSession(accessToken: string, userId: string, secret: string, ttlSec: number): string {
  const payload: McpSessionPayload = {
    sub: userId,
    access_token: accessToken,
    exp: Math.floor(Date.now() / 1000) + ttlSec,
    nonce: randomBytes(8).toString('hex'),
  }
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${payloadB64}.${sign(payloadB64, secret)}`
}

export function verifyMcpSession(token: string, secret: string): McpSessionPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sig] = parts
  const expected = sign(payloadB64, secret)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as McpSessionPayload
    if (!payload.access_token || !payload.sub || !payload.exp) return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export async function validateSupabaseAccessToken(
  accessToken: string,
  env: EnvAuth,
): Promise<{ userId: string } | null> {
  const res = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: env.SUPABASE_ANON_KEY,
    },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { id?: string }
  return data.id ? { userId: data.id } : null
}

export async function resolveAuth(
  request: Request,
  env: EnvAuth,
): Promise<{ accessToken: string; userId: string } | null> {
  const auth = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!auth) return null

  const session = verifyMcpSession(auth, env.MCP_TOKEN_SECRET)
  if (session) {
    const valid = await validateSupabaseAccessToken(session.access_token, env)
    if (valid && valid.userId === session.sub) {
      return { accessToken: session.access_token, userId: session.sub }
    }
    return null
  }

  if (auth.includes('.')) {
    const valid = await validateSupabaseAccessToken(auth, env)
    if (valid) return { accessToken: auth, userId: valid.userId }
  }

  return null
}
