/**
 * OAuth 2.1 (PKCE S256) for ChatGPT / Claude MCP connectors.
 * Stateless HMAC-signed auth requests and authorization codes — no KV required.
 */
import { createHash } from 'node:crypto'
import { issueMcpSession, signPayload, validateSupabaseAccessToken, verifyPayload, type EnvAuth } from './auth'

export const MCP_SCOPES = ['openid', 'profile', 'sudar.creator', 'sudar.learner'] as const

const AUTH_TTL_SEC = 600
const CODE_TTL_SEC = 300

type AuthRequest = {
  typ: 'auth'
  client_id: string
  redirect_uri: string
  state: string
  code_challenge: string
  scope: string
  resource: string
  exp: number
}

type AuthCode = {
  typ: 'code'
  sub: string
  access_token: string
  code_challenge: string
  redirect_uri: string
  client_id: string
  resource: string
  exp: number
}

type RegisteredClient = {
  typ: 'client'
  redirect_uris: string[]
  exp: number
}

function pkceS256(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Authorization, Content-Type, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-Id',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Expose-Headers': 'Mcp-Session-Id',
  }
}

export function jsonResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
      ...extraHeaders,
    },
  })
}

export function oauthMetadata(issuer: string) {
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: [
      'authorization_code',
      'urn:ietf:params:oauth:grant-type:token-exchange',
    ],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: [...MCP_SCOPES],
    client_id_metadata_document_supported: false,
  }
}

export function protectedResourceMetadata(issuer: string) {
  const resource = `${issuer}/mcp`
  return {
    resource,
    authorization_servers: [issuer],
    scopes_supported: [...MCP_SCOPES],
    bearer_methods_supported: ['header'],
    resource_documentation: `${issuer}/llms.txt`,
  }
}

export function mcpUnauthorized(issuer: string): Response {
  const metadata = `${issuer}/.well-known/oauth-protected-resource`
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': `Bearer realm="sudar", resource_metadata="${metadata}"`,
      ...corsHeaders(),
    },
  })
}

function isAllowedRedirectUri(uri: string, registered: string[]): boolean {
  if (registered.includes(uri)) return true
  try {
    const u = new URL(uri)
    if (u.protocol === 'cursor:' && u.hostname === 'anysphere.cursor-mcp') return true
    if (
      u.protocol === 'http:' &&
      (u.hostname === 'localhost' || u.hostname === '127.0.0.1') &&
      u.pathname === '/callback'
    ) {
      return true
    }
    if (u.protocol !== 'https:') return false
    if (u.hostname === 'chatgpt.com' && u.pathname.startsWith('/connector/oauth/')) return true
    if (u.hostname === 'chatgpt.com' && u.pathname === '/connector_platform_oauth_redirect') return true
    if (u.hostname === 'claude.ai' && (u.pathname.includes('/mcp') || u.pathname.includes('callback'))) {
      return true
    }
    if (u.hostname === 'claude.com' && (u.pathname.includes('/mcp') || u.pathname.includes('callback'))) {
      return true
    }
    if (
      (u.hostname === 'www.cursor.com' || u.hostname === 'cursor.com') &&
      u.pathname === '/agents/mcp/oauth/callback'
    ) {
      return true
    }
    return false
  } catch {
    return false
  }
}

async function parseBody(request: Request): Promise<Record<string, string>> {
  const ct = request.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'string') out[k] = v
      else if (Array.isArray(v) && typeof v[0] === 'string') out[k] = v[0]
      else if (v != null) out[k] = String(v)
    }
    return out
  }
  const text = await request.text()
  const out: Record<string, string> = {}
  for (const part of text.split('&')) {
    const [k, v] = part.split('=')
    if (k) out[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '))
  }
  return out
}

export async function handleClientRegistration(request: Request, env: EnvAuth): Promise<Response> {
  const raw = (await request.json().catch(() => ({}))) as {
    redirect_uris?: unknown
    token_endpoint_auth_method?: unknown
    grant_types?: unknown
  }
  const redirectUris = Array.isArray(raw.redirect_uris)
    ? raw.redirect_uris.filter((u): u is string => typeof u === 'string' && isAllowedRedirectUri(u, []))
    : []
  if (redirectUris.length === 0) {
    return jsonResponse({ error: 'invalid_client_metadata', error_description: 'redirect_uris required' }, 400)
  }

  const client: RegisteredClient = {
    typ: 'client',
    redirect_uris: redirectUris,
    exp: Math.floor(Date.now() / 1000) + 86400 * 365,
  }
  const clientId = signPayload(client, env.MCP_TOKEN_SECRET)

  return jsonResponse({
    client_id: clientId,
    redirect_uris: redirectUris,
    grant_types: ['authorization_code'],
    token_endpoint_auth_method:
      typeof raw.token_endpoint_auth_method === 'string' ? raw.token_endpoint_auth_method : 'none',
    client_id_issued_at: Math.floor(Date.now() / 1000),
  })
}

export function handleAuthorizeRedirect(request: Request, issuer: string, studioUrl: string, secret: string): Response {
  const url = new URL(request.url)
  const responseType = url.searchParams.get('response_type') || ''
  const clientId = url.searchParams.get('client_id') || ''
  const redirectUri = url.searchParams.get('redirect_uri') || ''
  const state = url.searchParams.get('state') || ''
  const codeChallenge = url.searchParams.get('code_challenge') || ''
  const method = url.searchParams.get('code_challenge_method') || ''
  const scope = url.searchParams.get('scope') || MCP_SCOPES.join(' ')
  const resource = url.searchParams.get('resource') || `${issuer}/mcp`

  const failRedirect = (error: string, description: string): Response => {
    if (!redirectUri || !isAllowedRedirectUri(redirectUri, [])) {
      return jsonResponse({ error, error_description: description }, 400)
    }
    const dest = new URL(redirectUri)
    dest.searchParams.set('error', error)
    dest.searchParams.set('error_description', description)
    if (state) dest.searchParams.set('state', state)
    dest.searchParams.set('iss', issuer)
    return Response.redirect(dest.toString(), 302)
  }

  if (responseType !== 'code') {
    return failRedirect('unsupported_response_type', 'response_type must be code')
  }
  if (method !== 'S256' || !codeChallenge) {
    return failRedirect('invalid_request', 'PKCE S256 code_challenge is required')
  }
  if (!redirectUri || !isAllowedRedirectUri(redirectUri, registeredRedirects(clientId, secret))) {
    return jsonResponse({ error: 'invalid_request', error_description: 'redirect_uri is not allowed' }, 400)
  }

  const auth: AuthRequest = {
    typ: 'auth',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    scope,
    resource,
    exp: Math.floor(Date.now() / 1000) + AUTH_TTL_SEC,
  }
  const mcpAuth = signPayload(auth, secret)
  const studio = studioUrl.replace(/\/$/, '')
  const login = new URL(`${studio}/login`)
  login.searchParams.set('mcp_oauth', '1')
  login.searchParams.set('mcp_auth', mcpAuth)
  return Response.redirect(login.toString(), 302)
}

function registeredRedirects(clientId: string, secret: string): string[] {
  const client = verifyPayload<RegisteredClient>(clientId, secret)
  if (client?.typ === 'client' && Array.isArray(client.redirect_uris)) return client.redirect_uris
  return []
}

export async function handleOAuthComplete(request: Request, issuer: string, env: EnvAuth): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { mcp_auth?: string; access_token?: string }
  const mcpAuth = body.mcp_auth?.trim() || ''
  const accessToken = body.access_token?.trim() || ''
  if (!mcpAuth || !accessToken) {
    return jsonResponse({ error: 'invalid_request', error_description: 'mcp_auth and access_token required' }, 400)
  }

  const auth = verifyPayload<AuthRequest>(mcpAuth, env.MCP_TOKEN_SECRET)
  if (!auth || auth.typ !== 'auth') {
    return jsonResponse({ error: 'invalid_grant', error_description: 'mcp_auth expired or invalid' }, 400)
  }

  const valid = await validateSupabaseAccessToken(accessToken, env)
  if (!valid) {
    return jsonResponse({ error: 'invalid_token', error_description: 'Sudar session is not valid' }, 401)
  }

  const codePayload: AuthCode = {
    typ: 'code',
    sub: valid.userId,
    access_token: accessToken,
    code_challenge: auth.code_challenge,
    redirect_uri: auth.redirect_uri,
    client_id: auth.client_id,
    resource: auth.resource,
    exp: Math.floor(Date.now() / 1000) + CODE_TTL_SEC,
  }
  const code = signPayload(codePayload, env.MCP_TOKEN_SECRET)
  const dest = new URL(auth.redirect_uri)
  dest.searchParams.set('code', code)
  if (auth.state) dest.searchParams.set('state', auth.state)
  dest.searchParams.set('iss', issuer)
  return jsonResponse({ redirect_to: dest.toString() })
}

export async function handleOAuthToken(request: Request, issuer: string, env: EnvAuth): Promise<Response> {
  const body = await parseBody(request)

  if (body.grant_type === 'urn:ietf:params:oauth:grant-type:token-exchange') {
    const accessToken = body.access_token || body.subject_token || ''
    if (!accessToken) return jsonResponse({ error: 'invalid_request' }, 400)
    const valid = await validateSupabaseAccessToken(accessToken, env)
    if (!valid) return jsonResponse({ error: 'invalid_token' }, 401)
    const mcpToken = issueMcpSession(accessToken, valid.userId, env.MCP_TOKEN_SECRET, 3600)
    return jsonResponse({ access_token: mcpToken, token_type: 'Bearer', expires_in: 3600 })
  }

  if (body.grant_type !== 'authorization_code') {
    return jsonResponse({ error: 'unsupported_grant_type' }, 400)
  }

  const code = body.code || ''
  const verifier = body.code_verifier || ''
  const redirectUri = body.redirect_uri || ''
  if (!code || !verifier) {
    return jsonResponse({ error: 'invalid_request', error_description: 'code and code_verifier required' }, 400)
  }

  const grant = verifyPayload<AuthCode>(code, env.MCP_TOKEN_SECRET)
  if (!grant || grant.typ !== 'code') {
    return jsonResponse({ error: 'invalid_grant' }, 400)
  }
  if (redirectUri && redirectUri !== grant.redirect_uri) {
    return jsonResponse({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' }, 400)
  }
  if (pkceS256(verifier) !== grant.code_challenge) {
    return jsonResponse({ error: 'invalid_grant', error_description: 'PKCE verification failed' }, 400)
  }

  const stillValid = await validateSupabaseAccessToken(grant.access_token, env)
  if (!stillValid || stillValid.userId !== grant.sub) {
    return jsonResponse({ error: 'invalid_grant', error_description: 'Sudar session expired' }, 400)
  }

  const mcpToken = issueMcpSession(grant.access_token, grant.sub, env.MCP_TOKEN_SECRET, 3600)
  return jsonResponse(
    {
      access_token: mcpToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: MCP_SCOPES.join(' '),
    },
    200,
    { 'Cache-Control': 'no-store' },
  )
}

export function isProtectedResourceMetadataPath(pathname: string): boolean {
  return (
    pathname === '/.well-known/oauth-protected-resource' ||
    pathname.startsWith('/.well-known/oauth-protected-resource/')
  )
}
