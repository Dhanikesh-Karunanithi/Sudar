import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createSudarMcpServer } from '@sudar/mcp-server/server'
import type { SudarMcpConfig } from '@sudar/mcp-server/config'
import type { Env } from './index'
import { corsHeaders } from './oauth'

function withCors(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export async function handleMcpRequest(
  request: Request,
  env: Env,
  accessToken: string,
): Promise<Response> {
  // Workers do not share in-memory transports across requests. A session ID
  // here made ChatGPT initialize succeed, then tools/list 400/404 — so the
  // Sudar chip appeared with zero callable actions.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  const config: Partial<SudarMcpConfig> = {
    studioUrl: env.SUDAR_STUDIO_URL ?? '',
    learnUrl: env.SUDAR_LEARN_URL ?? '',
    intelligenceUrl: env.SUDAR_INTELLIGENCE_URL ?? '',
    alpApiKey: env.SUDAR_ALP_API_KEY ?? '',
    accessToken,
    toolset: (env.SUDAR_TOOLSET as SudarMcpConfig['toolset']) || 'all',
    mcpAudit: true,
  }

  const server = createSudarMcpServer(config)
  await server.connect(transport)
  return withCors(await transport.handleRequest(request))
}
