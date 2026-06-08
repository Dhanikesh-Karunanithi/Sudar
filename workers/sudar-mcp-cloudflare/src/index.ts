/**
 * Sudar remote MCP — Cloudflare Worker (ChatGPT / Claude / mcp-remote).
 * Uses WebStandardStreamableHTTPServerTransport (Workers-native).
 */
import { handleMcpRequest } from './mcp-handler'
import { issueMcpSession, resolveAuth, validateSupabaseAccessToken, type EnvAuth } from './auth'
import { buildMcpDiscoveryJson, buildMcpLlmsTxt } from './discovery'

export interface Env extends EnvAuth {
  SUDAR_STUDIO_URL: string
  SUDAR_LEARN_URL: string
  SUDAR_INTELLIGENCE_URL?: string
  SUDAR_TOOLSET?: string
  SUDAR_ALP_API_KEY?: string
  MCP_PUBLIC_URL?: string
}

function publicUrl(env: Env, request: Request): string {
  return (env.MCP_PUBLIC_URL || new URL(request.url).origin).replace(/\/$/, '')
}

function oauthMetadata(env: Env, request: Request) {
  const base = publicUrl(env, request)
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    registration_endpoint: `${base}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: [
      'authorization_code',
      'urn:ietf:params:oauth:grant-type:token-exchange',
    ],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
    scopes_supported: ['openid', 'profile', 'sudar.creator', 'sudar.learner'],
  }
}

async function handleOAuthToken(request: Request, env: Env): Promise<Response> {
  let body: Record<string, string> = {}
  const ct = request.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    body = (await request.json().catch(() => ({}))) as Record<string, string>
  } else {
    const text = await request.text()
    for (const part of text.split('&')) {
      const [k, v] = part.split('=')
      if (k) body[decodeURIComponent(k)] = decodeURIComponent(v || '')
    }
  }

  const accessToken = body.access_token || body.subject_token || body.code || ''
  if (!accessToken) {
    return Response.json({ error: 'access_token or code required' }, { status: 400 })
  }

  const valid = await validateSupabaseAccessToken(accessToken, env)
  if (!valid) {
    return Response.json({ error: 'invalid_token' }, { status: 401 })
  }

  const mcpToken = issueMcpSession(accessToken, valid.userId, env.MCP_TOKEN_SECRET, 3600)
  return Response.json({
    access_token: mcpToken,
    token_type: 'Bearer',
    expires_in: 3600,
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    const base = publicUrl(env, request)

    if (url.pathname === '/health') {
      return Response.json({ ok: true, service: 'sudar-mcp-cloudflare' })
    }

    if (url.pathname === '/llms.txt' && request.method === 'GET') {
      return new Response(buildMcpLlmsTxt(base), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    if ((url.pathname === '/' || url.pathname === '/discovery') && request.method === 'GET') {
      return Response.json(
        buildMcpDiscoveryJson(base, env.SUDAR_STUDIO_URL, env.SUDAR_LEARN_URL),
        {
          headers: { 'Cache-Control': 'public, max-age=3600' },
        }
      )
    }

    if (url.pathname === '/.well-known/oauth-authorization-server') {
      return Response.json(oauthMetadata(env, request))
    }

    if (url.pathname === '/oauth/authorize' && request.method === 'GET') {
      const studio = (env.SUDAR_STUDIO_URL || '').replace(/\/$/, '')
      const returnUrl = url.searchParams.get('redirect_uri') || `${publicUrl(env, request)}/oauth/callback`
      const state = url.searchParams.get('state') || ''
      const loginUrl = studio
        ? `${studio}/login?mcp_oauth=1&redirect_uri=${encodeURIComponent(returnUrl)}&state=${encodeURIComponent(state)}`
        : returnUrl
      return Response.redirect(loginUrl, 302)
    }

    if (url.pathname === '/oauth/token' && request.method === 'POST') {
      return handleOAuthToken(request, env)
    }

    if (url.pathname === '/oauth/register' && request.method === 'POST') {
      return Response.json({
        client_id: 'sudar-mcp-public',
        redirect_uris: [`${publicUrl(env, request)}/oauth/callback`],
        grant_types: ['authorization_code', 'urn:ietf:params:oauth:grant-type:token-exchange'],
      })
    }

    if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp')) {
      const auth = await resolveAuth(request, env)
      if (!auth) {
        return new Response('Unauthorized', { status: 401 })
      }
      return handleMcpRequest(request, env, auth.accessToken)
    }

    return Response.json(
      {
        error: 'not_found',
        message: 'Sudar MCP — see / for discovery, /llms.txt for AI-readable docs',
        endpoints: {
          discovery: `${base}/`,
          llmsTxt: `${base}/llms.txt`,
          mcp: `${base}/mcp`,
          oauth: `${base}/.well-known/oauth-authorization-server`,
          health: `${base}/health`,
        },
      },
      { status: 404 }
    )
  },
}
