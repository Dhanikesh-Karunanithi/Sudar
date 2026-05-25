# DNS — thesudar.app (Cloudflare)

Operator runbook for **thesudar.app** on Cloudflare Registrar + DNS.

## 1. Register domain

1. Cloudflare Dashboard → **Domain Registration** → register **thesudar.app**.
2. Confirm the zone is **Active** (nameservers on Cloudflare).

## 2. Recommended hostnames

| Host | Type | Target | Purpose |
|------|------|--------|---------|
| `studio` | CNAME | `cname.vercel-dns.com` (Vercel custom domain) | Sudar Studio |
| `learn` | CNAME | `cname.vercel-dns.com` | Sudar Learn |
| `intelligence` | CNAME | Railway/Render hostname | Sudar Intelligence |
| `mcp` | Worker route | `sudar-mcp-cloudflare` worker | Remote MCP (ChatGPT) |
| `@` or `www` | Redirect | `https://studio.thesudar.app` or marketing site | Optional landing |

Add each hostname in **Vercel** (Studio/Learn projects → Settings → Domains) before expecting SSL to provision.

## 3. Cloudflare SSL/TLS

- **SSL/TLS** → **Full (strict)** for Vercel origins.
- **Always Use HTTPS** → On.
- **Minimum TLS Version** → 1.2+

## 4. MCP worker route

After deploying [`workers/sudar-mcp-cloudflare`](../workers/sudar-mcp-cloudflare):

```bash
cd workers/sudar-mcp-cloudflare
npx wrangler deploy
# Custom domain: wrangler.toml routes or Dashboard → Workers → Triggers → Custom Domain → mcp.thesudar.app
```

## 5. Verification

```bash
curl -s https://studio.thesudar.app/api/health || true
curl -s https://learn.thesudar.app/api/health || true
curl -s https://mcp.thesudar.app/health
```

## 6. Supabase Auth redirect URLs

In Supabase → Authentication → URL configuration, add:

- `https://studio.thesudar.app/**`
- `https://learn.thesudar.app/**`
- `https://mcp.thesudar.app/oauth/callback` (MCP OAuth)

---

*See also [DEPLOY_THESUDAR_APP.md](DEPLOY_THESUDAR_APP.md) and [MCP_CHATGPT_LAUNCH.md](MCP_CHATGPT_LAUNCH.md).*
