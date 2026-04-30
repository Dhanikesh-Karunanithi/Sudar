/**
 * LTI 1.3 tool JWKS (public keys) for platform registration in Moodle/Canvas.
 * Configure Moodle "Public keyset" URL to this route.
 * Env: ALP_LTI_TOOL_JWKS_JSON — JSON object { "keys": [ JWK, ... ] } (RFC 7517).
 */
import { NextResponse } from 'next/server'

export async function GET() {
  const raw = process.env.ALP_LTI_TOOL_JWKS_JSON?.trim()
  if (!raw) {
    return NextResponse.json(
      { error: 'ALP_LTI_TOOL_JWKS_JSON not configured' },
      { status: 503 },
    )
  }
  try {
    const jwks = JSON.parse(raw) as { keys?: unknown[] }
    if (!Array.isArray(jwks.keys) || jwks.keys.length === 0) {
      return NextResponse.json({ error: 'Invalid JWKS: keys array required' }, { status: 503 })
    }
    return NextResponse.json(jwks)
  } catch {
    return NextResponse.json({ error: 'Invalid ALP_LTI_TOOL_JWKS_JSON' }, { status: 503 })
  }
}
