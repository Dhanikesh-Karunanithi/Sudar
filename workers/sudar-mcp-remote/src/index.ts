/**
 * Hosted Sudar MCP — token exchange + SSE transport.
 * POST /token { api_key, learn_url? } → { access_token, expires_in }
 * GET /sse — MCP SSE (Authorization: Bearer access_token)
 * POST /message — MCP message channel for SSE session
 */
import express from 'express'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { createSudarMcpServer } from '@sudar/mcp-server/server'
import { issueMcpToken, verifyMcpToken } from './token.js'

const PORT = Number(process.env.MCP_REMOTE_PORT || 8787)
const DEFAULT_LEARN = (process.env.SUDAR_LEARN_URL || '').replace(/\/$/, '')
const TOKEN_TTL = Number(process.env.MCP_TOKEN_TTL_SEC || 3600)

const app = express()
app.use(express.json())

const sessions = new Map<string, SSEServerTransport>()

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'sudar-mcp-remote' })
})

app.post('/token', (req, res) => {
  const apiKey = typeof req.body?.api_key === 'string' ? req.body.api_key.trim() : ''
  const learnUrl =
    typeof req.body?.learn_url === 'string' && req.body.learn_url.trim()
      ? req.body.learn_url.trim().replace(/\/$/, '')
      : DEFAULT_LEARN
  if (!apiKey) {
    res.status(400).json({ error: 'api_key required' })
    return
  }
  if (!learnUrl) {
    res.status(400).json({ error: 'learn_url required (body or SUDAR_LEARN_URL env)' })
    return
  }
  try {
    const access_token = issueMcpToken(apiKey, learnUrl, TOKEN_TTL)
    res.json({ access_token, expires_in: TOKEN_TTL, token_type: 'Bearer' })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'token_failed' })
  }
})

function authFromRequest(req: express.Request): ReturnType<typeof verifyMcpToken> {
  const raw = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim()
  if (!raw) return null
  return verifyMcpToken(raw)
}

app.get('/sse', async (req, res) => {
  const payload = authFromRequest(req)
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  const transport = new SSEServerTransport('/message', res)
  const sessionId = transport.sessionId
  sessions.set(sessionId, transport)
  res.on('close', () => sessions.delete(sessionId))

  const server = createSudarMcpServer({
    learnUrl: payload.learn_url,
    alpApiKey: payload.alp_api_key,
    toolset: 'integrator',
    mcpAudit: false,
  })
  await server.connect(transport)
})

app.post('/message', async (req, res) => {
  const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : ''
  const transport = sessions.get(sessionId)
  if (!transport) {
    res.status(404).json({ error: 'Unknown session' })
    return
  }
  await transport.handlePostMessage(req, res)
})

app.listen(PORT, () => {
  console.log(`[sudar-mcp-remote] listening on http://127.0.0.1:${PORT}`)
  console.log(`  POST /token  GET /sse  POST /message?sessionId=...`)
})
