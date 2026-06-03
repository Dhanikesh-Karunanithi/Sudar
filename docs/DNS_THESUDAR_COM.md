# DNS — thesudar.com (Cloudflare)

Operator runbook for **thesudar.com** on Cloudflare Registrar + DNS.

> **Legacy:** [DNS_THESUDAR_APP.md](DNS_THESUDAR_APP.md) documents the older **thesudar.app** zone. Use **thesudar.com** for new production deployments.

## 1. Domain

1. Confirm **thesudar.com** is **Active** in Cloudflare (nameservers on Cloudflare).
2. **SSL/TLS** → **Full (strict)**.
3. **Always Use HTTPS** → On.

## 2. Recommended hostnames

| Host | Type | Target | Purpose |
|------|------|--------|---------|
| `@` | CNAME (proxied) | Cloudflare Pages project **thesudar** | Marketing / landing (Teach with Sudar) |
| `www` | CNAME (proxied) | `thesudar.com` | Optional redirect to apex |
| `learn` | Custom domain on Worker **sudar-learn** | OpenNext Worker | Sudar Learn |
| `studio` | Custom domain on Worker **sudar-studio** | OpenNext Worker | Sudar Studio |
| `intelligence` | CNAME | Railway/Render hostname | Sudar Intelligence (Python) |
| `mcp` | Worker custom domain | `sudar-mcp-cloudflare` | Remote MCP (ChatGPT) |
| `demo` | CNAME (optional) | Cloudflare Pages / Vercel | Ecosystem demo |

### Attaching Learn / Studio custom domains

After the first OpenNext deploy (see [CLOUDFLARE_PAGES_DEPLOY.md](CLOUDFLARE_PAGES_DEPLOY.md)):

1. Cloudflare Dashboard → **Workers & Pages** → **sudar-learn** → **Settings** → **Domains & Routes** → **Add** → `learn.thesudar.com`
2. Repeat for **sudar-studio** → `studio.thesudar.com`
3. Cloudflare creates proxied DNS records automatically when the zone is on the same account.

### Landing (thesudar.com + teachwithsudar.com)

Use **two** Cloudflare Pages projects (same repo build, different `NEXT_PUBLIC_SITE_VARIANT`):

| Domain | Pages project | Build variant |
|--------|---------------|---------------|
| `thesudar.com` | **thesudar** | `gateway` — app entry (Learn / Studio) |
| `teachwithsudar.com` | **teachwithsudar** | `marketing` — docs, research, guides |

1. **thesudar** → Custom domains → `thesudar.com` (and optional `www.thesudar.com`)
2. **teachwithsudar** → Custom domains → `teachwithsudar.com` only

Do **not** attach both apex domains to one project; the last deploy would overwrite both sites.

## 3. MCP worker route

After deploying [`workers/sudar-mcp-cloudflare`](../workers/sudar-mcp-cloudflare):

```bash
cd workers/sudar-mcp-cloudflare
npx wrangler deploy
# Custom domain: Dashboard → Workers → sudar-mcp-cloudflare → Triggers → mcp.thesudar.com
```

Set secrets:

```bash
npx wrangler secret put SUDAR_STUDIO_URL   # https://studio.thesudar.com
npx wrangler secret put SUDAR_LEARN_URL    # https://learn.thesudar.com
npx wrangler secret put MCP_PUBLIC_URL     # https://mcp.thesudar.com
```

## 4. Cron workers (replaces Vercel Cron)

Deploy scheduled invokers that call Learn/Studio cron API routes:

```bash
cd workers/sudar-cron-learn
npx wrangler secret put CRON_SECRET
npx wrangler secret put LEARN_APP_URL      # https://learn.thesudar.com
npx wrangler deploy

cd ../sudar-cron-studio
npx wrangler secret put CRON_SECRET
npx wrangler secret put STUDIO_APP_URL     # https://studio.thesudar.com
npx wrangler deploy
```

Schedules match former `vercel.json` crons (UTC).

## 5. Verification

```bash
curl -sI https://thesudar.com | head -5
curl -sI https://learn.thesudar.com | head -5
curl -sI https://studio.thesudar.com | head -5
curl -s https://mcp.thesudar.com/health
```

## 6. Supabase Auth redirect URLs

In Supabase → Authentication → URL configuration, add:

- `https://studio.thesudar.com/**`
- `https://learn.thesudar.com/**`
- `https://mcp.thesudar.com/oauth/callback`

Keep legacy `.app` URLs until you retire that zone.

---

*See also [CLOUDFLARE_PAGES_DEPLOY.md](CLOUDFLARE_PAGES_DEPLOY.md), [DEPLOY_THESUDAR_COM.md](DEPLOY_THESUDAR_COM.md), and [MCP_CHATGPT_LAUNCH.md](MCP_CHATGPT_LAUNCH.md).*
