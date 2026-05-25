# ChatGPT + Sudar MCP launch runbook

Operator guide to connect **ChatGPT**, **Claude**, and **Cursor** to Sudar at **thesudar.app**.

## Architecture

| URL | Role |
|-----|------|
| `https://mcp.thesudar.app` | Remote MCP (Cloudflare Worker) |
| `https://studio.thesudar.app` | Studio — creator tools |
| `https://learn.thesudar.app` | Learn — learner + ALP tools |

See [MCP_SERVERS.md](MCP_SERVERS.md) for tool catalog.

---

## Prerequisites

1. Complete [DEPLOY_THESUDAR_APP.md](DEPLOY_THESUDAR_APP.md) and [DNS_THESUDAR_APP.md](DNS_THESUDAR_APP.md).
2. Deploy MCP worker:

```bash
cd workers/sudar-mcp-cloudflare
cp .dev.vars.example .dev.vars   # local only
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put MCP_TOKEN_SECRET
npx wrangler secret put SUDAR_STUDIO_URL
npx wrangler secret put SUDAR_LEARN_URL
npx wrangler secret put MCP_PUBLIC_URL
npx wrangler deploy
```

3. Verify: `curl https://mcp.thesudar.app/health`

---

## Register ChatGPT Connector

1. Ensure your OpenAI workspace has **Connectors** / developer MCP enabled.
2. Open [OpenAI Platform](https://platform.openai.com/) → your project → **Connectors** (or ChatGPT → Settings → Connectors).
3. **Add connector**:
   - **MCP server URL:** `https://mcp.thesudar.app/mcp`
   - **OAuth discovery:** `https://mcp.thesudar.app/.well-known/oauth-authorization-server`
4. On first use, ChatGPT redirects through **Sudar Studio login** (`/oauth/authorize` → `studio.thesudar.app/login?mcp_oauth=1`).
5. After sign-in, exchange Supabase access token at `POST /oauth/token` (automatic in connector flow when configured).

### Token exchange (manual / debugging)

If your client supports token exchange with a Supabase session JWT:

```bash
curl -X POST https://mcp.thesudar.app/oauth/token \
  -H "Content-Type: application/json" \
  -d '{"grant_type":"urn:ietf:params:oauth:grant-type:token-exchange","access_token":"<SUPABASE_ACCESS_JWT>"}'
```

Use returned `access_token` as `Authorization: Bearer` on `/mcp`.

---

## Test prompts in ChatGPT

**Creator (Studio):**

> Using Sudar, generate a 5-module course outline for "Cybersecurity basics for new hires".

Expect tool: `sudar_generate_outline`.

**Learner (Learn):**

> Using Sudar, get the next best action for the signed-in learner.

Expect tool: `sudar_learner_next_action` (requires learner account OAuth).

---

## Claude Desktop (remote)

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sudar": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.thesudar.app/mcp"]
    }
  }
}
```

Complete OAuth in browser when prompted.

---

## Cursor (local stdio)

Use [packages/sudar-mcp/examples/mcp.json](../packages/sudar-mcp/examples/mcp.json) with production URLs and `SUDAR_TOOLSET=all`.

---

## Custom GPT Actions (fallback)

If MCP connector review is delayed, publish [openapi/sudar-creator-v1.json](../openapi/sudar-creator-v1.json) as a ChatGPT **Action** with Bearer auth (Supabase JWT or ALP key per route).

---

## Security checklist

- Never expose `SUPABASE_SERVICE_ROLE` or `INTELLIGENCE_SERVICE_SECRET` to MCP clients.
- Rotate `MCP_TOKEN_SECRET` if leaked.
- Enable org MCP policy toggles when shipped (see org settings roadmap).
- Privacy policy at `https://thesudar.app/privacy` for connector submission.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 on `/mcp` | Refresh OAuth; confirm Supabase JWT valid |
| 401 on creator tools | User must be Studio org member with AI keys configured |
| 403 on learner agent | Org Sudar Agents toggles / learner opt-outs |
| Tools missing | Set `SUDAR_TOOLSET=all` on worker |

---

*Sudar — Learns with you, for you.*
