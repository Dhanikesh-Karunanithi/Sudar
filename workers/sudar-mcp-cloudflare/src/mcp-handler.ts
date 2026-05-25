import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createSudarMcpServer } from '@sudar/mcp-server/server'
import type { SudarMcpConfig } from '@sudar/mcp-server/config'
import type { Env } from './index'

export async function handleMcpRequest(
  request: Request,
  env: Env,
  accessToken: string,
): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
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
  return transport.handleRequest(request)
}
