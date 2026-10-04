# ChatGPT + Cursor + Sudar MCP launch runbook

Operator guide to connect **ChatGPT**, **Claude**, and **Cursor** to Sudar at **thesudar.com**.

Production MCP is OAuth 2.1 **PKCE S256** with RFC 9728 protected-resource metadata. ChatGPT and Cursor both require `code_challenge_methods_supported` to include `S256`.

## Architecture

| URL | Role |
|-----|------|
| `https://mcp.thesudar.com` | Remote MCP (Cloudflare Worker) |
| `https://studio.thesudar.com` | Studio — creator tools + OAuth sign-in |
| `https://learn.thesudar.com` | Learn — learner + ALP tools |

See [MCP_SERVERS.md](MCP_SERVERS.md) for tool catalog.

---

## Prerequisites

1. Complete [DEPLOY_THESUDAR_COM.md](DEPLOY_THESUDAR_COM.md) and [DNS_THESUDAR_COM.md](DNS_THESUDAR_COM.md).
2. Deploy MCP worker:

```bash
cd workers/sudar-mcp-cloudflare
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put MCP_TOKEN_SECRET
npx wrangler secret put SUDAR_STUDIO_URL
npx wrangler secret put SUDAR_LEARN_URL
npx wrangler secret put MCP_PUBLIC_URL
npx wrangler deploy
```

Or from repo root: `npm run mcp:cloudflare:deploy`.

3. Verify:

```bash
curl -s https://mcp.thesudar.com/health
curl -s https://mcp.thesudar.com/.well-known/oauth-authorization-server
# must include: "code_challenge_methods_supported":["S256"]
curl -s https://mcp.thesudar.com/.well-known/oauth-protected-resource
```

4. Studio production must include the MCP login bridge (`/login?mcp_oauth=1`). Deploy Studio after changing `LoginClient.tsx` / `middleware.ts`.

---

## Register ChatGPT Connector

1. ChatGPT → **Settings** → **Security and login** → enable **Developer mode** (or Connectors, depending on plan).
2. **Create app** / **Add connector**:
   - **MCP server URL:** `https://mcp.thesudar.com/mcp`
   - Auth: **OAuth** (discovery is automatic)
3. ChatGPT registers via `/oauth/register`, then opens `/oauth/authorize`.
4. Studio login (`studio.thesudar.com/login?mcp_oauth=1&mcp_auth=…`) signs the user in and `POST`s `/oauth/complete`.
5. Browser returns to ChatGPT with `code` + PKCE; ChatGPT exchanges at `/oauth/token`.

### Token exchange (manual / debugging)

If your client supports token exchange with a Supabase session JWT:

```bash
curl -X POST https://mcp.thesudar.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{"grant_type":"urn:ietf:params:oauth:grant-type:token-exchange","access_token":"<SUPABASE_ACCESS_JWT>"}'
```

Use returned `access_token` as `Authorization: Bearer` on `/mcp`.

---

## Test prompts in ChatGPT

**Creator (Studio) — full course, not a chat outline:**

> Using Sudar, build a microlearning course on Generative AI for instructional designers. Create it in Studio and give me HTML and SCORM.

Expect tool: `sudar_build_course`. ChatGPT must **not** write the modules itself. The reply should include:
- a **Studio URL** (`https://studio.thesudar.com/courses/…`)
- HTML lesson pages (or `combined_html`)
- SCORM 1.2 ZIP as `zip_base64` (or a note to download from Studio if the package is large)

If ChatGPT returns a markdown outline with no Studio link, it skipped the tool — reconnect the connector after deploying MCP + Studio, then retry.

**Learner (Learn):**

> Using Sudar, get the next best action for the signed-in learner.

Expect tool: `sudar_learner_next_action` (requires learner account OAuth).

---

## Cursor (remote HTTP + OAuth)

Add to `.cursor/mcp.json` (or Cursor Settings → MCP):

```json
{
  "mcpServers": {
    "sudar-remote": {
      "url": "https://mcp.thesudar.com/mcp"
    }
  }
}
```

Click **Connect**. Cursor uses PKCE with `http://localhost:8787/callback` (desktop) or `https://www.cursor.com/agents/mcp/oauth/callback` (web/agents). Sign in on Studio, then return to Cursor.

Do not run Wrangler (or anything else) on port **8787** during desktop Connect — Cursor falls back to `cursor://` if that port is taken.

## Cursor (local stdio)

Use [packages/sudar-mcp/examples/mcp.json](../packages/sudar-mcp/examples/mcp.json) with Learn running and a real Studio ALP key. Default `SUDAR_TOOLSET=integrator` does **not** include course-authoring tools; use `all` or the remote worker (`SUDAR_TOOLSET=all`).

---

## Claude Desktop (remote)

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sudar": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.thesudar.com/mcp"]
    }
  }
}
```

Complete OAuth in the browser when prompted.

---

## Custom GPT Actions (fallback)

If MCP connector review is delayed, publish [openapi/sudar-creator-v1.json](../openapi/sudar-creator-v1.json) as a ChatGPT **Action** with Bearer auth (Supabase JWT or ALP key per route).

---

## Security checklist

- Never expose `SUPABASE_SERVICE_ROLE` or `INTELLIGENCE_SERVICE_SECRET` to MCP clients.
- Rotate `MCP_TOKEN_SECRET` if leaked.
- Enable org MCP policy toggles when shipped (see org settings roadmap).
- Privacy policy at `https://thesudar.com/privacy` for connector submission.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| ChatGPT: metadata must advertise PKCE S256 | Deploy current `workers/sudar-mcp-cloudflare`; confirm `code_challenge_methods_supported` |
| 401 on `/mcp` with no `WWW-Authenticate` | Old worker; redeploy |
| Studio login returns to dashboard instead of ChatGPT/Cursor | Studio missing `mcp_oauth` bridge; deploy Studio |
| 401 on creator tools | User must be Studio org member with AI keys configured. Studio middleware must let `/api/*` through when `Authorization: Bearer` is set (cookie-less MCP). |
| 403 on learner agent | Org Sudar Agents toggles / learner opt-outs |
| Tools missing | Set `SUDAR_TOOLSET=all` on worker; public Studio/Learn URLs are wrangler `[vars]` |
| Plugin connected but ChatGPT says `sudar_build_course` is not exposed | Worker was stateful (`sessionIdGenerator`) on Cloudflare — ChatGPT `tools/list` hit a new isolate. Redeploy stateless JSON MCP, then **new chat** (not the failed thread) |
| ChatGPT writes a markdown course instead of creating one | Connector did not call `sudar_build_course`. Reconnect Sudar, wait 1–2 minutes (Studio generation is slow), retry the prompt above |
| Cursor Connect `fetch failed` on local stdio | Learn not running, or placeholder ALP key |

---

*Sudar — Learns with you, for you.*
