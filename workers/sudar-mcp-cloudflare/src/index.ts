/**
 * Sudar remote MCP — Cloudflare Worker (ChatGPT / Claude / mcp-remote).
 * Uses WebStandardStreamableHTTPServerTransport (Workers-native).
 */
import { handleMcpRequest } from './mcp-handler'
import { resolveAuth, type EnvAuth } from './auth'
import { buildMcpDiscoveryJson, buildMcpLlmsTxt } from './discovery'
import {
  corsHeaders,
  handleAuthorizeRedirect,
  handleClientRegistration,
  handleOAuthComplete,
  handleOAuthToken,
  isProtectedResourceMetadataPath,
  jsonResponse,
  mcpUnauthorized,
  oauthMetadata,
  protectedResourceMetadata,
} from './oauth'

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const base = publicUrl(env, request)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    if (url.pathname === '/health') {
      return jsonResponse({ ok: true, service: 'sudar-mcp-cloudflare' })
    }

    if (url.pathname === '/llms.txt' && request.method === 'GET') {
      return new Response(buildMcpLlmsTxt(base), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          ...corsHeaders(),
        },
      })
    }

    if ((url.pathname === '/' || url.pathname === '/discovery') && request.method === 'GET') {
      return jsonResponse(buildMcpDiscoveryJson(base, env.SUDAR_STUDIO_URL, env.SUDAR_LEARN_URL))
    }

    if (url.pathname === '/.well-known/oauth-authorization-server') {
      return jsonResponse(oauthMetadata(base))
    }

    if (isProtectedResourceMetadataPath(url.pathname) && request.method === 'GET') {
      return jsonResponse(protectedResourceMetadata(base))
    }

    if (url.pathname === '/oauth/authorize' && request.method === 'GET') {
      return handleAuthorizeRedirect(request, base, env.SUDAR_STUDIO_URL || '', env.MCP_TOKEN_SECRET)
    }

    if (url.pathname === '/oauth/complete' && request.method === 'POST') {
      return handleOAuthComplete(request, base, env)
    }

    if (url.pathname === '/oauth/token' && request.method === 'POST') {
      return handleOAuthToken(request, base, env)
    }

    if (url.pathname === '/oauth/register' && request.method === 'POST') {
      return handleClientRegistration(request, env)
    }

    if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp')) {
      const auth = await resolveAuth(request, env)
      if (!auth) {
        return mcpUnauthorized(base)
      }
      return handleMcpRequest(request, env, auth.accessToken)
    }

    return jsonResponse(
      {
        error: 'not_found',
        message: 'Sudar MCP — see / for discovery, /llms.txt for AI-readable docs',
        endpoints: {
          discovery: `${base}/`,
          llmsTxt: `${base}/llms.txt`,
          mcp: `${base}/mcp`,
          oauth: `${base}/.well-known/oauth-authorization-server`,
          resource: `${base}/.well-known/oauth-protected-resource`,
          health: `${base}/health`,
        },
      },
      404,
    )
  },
}
