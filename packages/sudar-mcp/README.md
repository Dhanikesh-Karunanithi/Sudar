# @sudar/mcp-server

Sudar Model Context Protocol (MCP) server — thin adapter over [ALP](https://github.com/Dhanikesh-Karunanithi/Sudar/blob/main/docs/ALP_API.md) and Sudar Agents BFFs.

## Quick start

```bash
cd packages/sudar-mcp
npm install
npm run build
```

Set env vars (see [docs/MCP_SERVERS.md](../../docs/MCP_SERVERS.md)) and add [examples/mcp.json](./examples/mcp.json) to your Cursor MCP settings.

## Toolsets

| `SUDAR_TOOLSET` | Tools |
|-----------------|-------|
| `integrator` (default) | ALP: events, tutor, NBA, identity, embed |
| `admin` | `sudar_run_admin_agent`, `sudar_list_agent_skills` |
| `learner` | learner agent, tutor, NBA, proactive nudge |
| `all` | All of the above |

## License

Apache-2.0
