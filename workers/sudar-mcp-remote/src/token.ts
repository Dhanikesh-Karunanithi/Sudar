import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

export type McpTokenPayload = {
  alp_api_key: string
  learn_url: string
  exp: number
  nonce: string
}

function secret(): string {
  const s = process.env.MCP_TOKEN_SECRET?.trim()
  if (!s) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MCP_TOKEN_SECRET is required in production')
    }
    return 'dev-mcp-token-secret-change-me'
  }
  return s
}

function sign(payloadB64: string): string {
  return createHmac('sha256', secret()).update(payloadB64).digest('base64url')
}

export function issueMcpToken(alpApiKey: string, learnUrl: string, ttlSec: number): string {
  const payload: McpTokenPayload = {
    alp_api_key: alpApiKey,
    learn_url: learnUrl.replace(/\/$/, ''),
    exp: Math.floor(Date.now() / 1000) + ttlSec,
    nonce: randomBytes(8).toString('hex'),
  }
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = sign(payloadB64)
  return `${payloadB64}.${sig}`
}

export function verifyMcpToken(token: string): McpTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sig] = parts
  const expected = sign(payloadB64)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as McpTokenPayload
    if (!payload.alp_api_key || !payload.learn_url || !payload.exp) return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
