#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createSudarMcpServer } from './server.js'

async function main(): Promise<void> {
  const server = createSudarMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('[sudar-mcp]', err)
  process.exit(1)
})
