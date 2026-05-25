/**
 * Smoke test: list MCP tools from stdio server.
 * Run: npm run test:smoke (from packages/sudar-mcp)
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverEntry = path.join(__dirname, '..', 'dist', 'index.js')

const transport = new StdioClientTransport({
  command: 'node',
  args: [serverEntry],
  env: {
    ...process.env,
    SUDAR_LEARN_URL: process.env.SUDAR_LEARN_URL || 'http://localhost:3001',
    SUDAR_ALP_API_KEY: process.env.SUDAR_ALP_API_KEY || 'test-key-placeholder',
    SUDAR_TOOLSET: process.env.SUDAR_TOOLSET || 'integrator',
  },
})

const client = new Client({ name: 'sudar-mcp-smoke', version: '0.1.0' })

try {
  await client.connect(transport)
  const { tools } = await client.listTools()
  console.log('OK: MCP connected')
  console.log('Tools:', tools.map((t) => t.name).join(', '))
  const expected = [
    'sudar_ingest_learning_events',
    'sudar_tutor_query',
    'sudar_next_best_action',
    'sudar_resolve_lms_user',
    'sudar_create_embed_token',
  ]
  const names = new Set(tools.map((t) => t.name))
  const missing = expected.filter((n) => !names.has(n))
  if (missing.length) {
    console.error('MISSING tools:', missing.join(', '))
    process.exit(1)
  }
  console.log('All integrator tools registered.')
} catch (err) {
  console.error('FAIL:', err.message || err)
  process.exit(1)
} finally {
  await client.close()
}
