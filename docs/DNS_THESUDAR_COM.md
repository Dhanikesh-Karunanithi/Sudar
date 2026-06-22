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

### Staging (Vercel — pilot / Talisma eval)

Production Learn and Studio stay on Cloudflare Workers. Staging uses **Vercel Production env** with branded subdomains:

| Host | Type | Target | Purpose |
|------|------|--------|---------|
| `staging.learn` | A (DNS only) | `76.76.21.21` | Sudar Learn on Vercel |
| `staging.studio` | A (DNS only) | `76.76.21.21` | Sudar Studio on Vercel |

Add domains in Vercel (`vercel domains add …`) then create the records above in Cloudflare (grey cloud until Vercel issues SSL). Ops script: `node scripts/ops/cloudflare-dns-staging-vercel.mjs` (needs `CLOUDFLARE_API_TOKEN` with **Zone → DNS → Edit**; wrangler OAuth alone is read-only for DNS).

**If the API token lacks DNS Edit** (Workers/Pages token only), deploy the edge proxy instead — it attaches custom domains and Cloudflare creates DNS automatically:

```bash
cd workers/sudar-staging-vercel && npm install && npx wrangler deploy
# Or: GitHub Actions → "Ops — staging access (Cloudflare → Vercel)"
```

Also add staging origins to Intelligence `CORS_ORIGINS` and redeploy (`scripts/ops/patch-render-intelligence-cors.mjs` with `RENDER_API_KEY`, or Render dashboard).

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

In Supabase → **Authentication** → **URL configuration**, set:

| Setting | Recommended value |
|---------|-------------------|
| **Site URL** | `https://thesudar.com` (gateway) or `https://learn.thesudar.com` |
| **Redirect URLs** | Wildcards below |

Add **every origin** learners and admins may sign in from (production + Vercel staging):

```
https://learn.thesudar.com/**
https://studio.thesudar.com/**
https://sudar-learn.vercel.app/**
https://sudar-studio.vercel.app/**
https://mcp.thesudar.com/oauth/callback
```

Password reset emails use `auth/callback?next=/reset-password` on Learn — no extra redirect entry beyond the wildcards above.

### Auth email templates (invite, etc.)

Invite emails are **Supabase Auth templates**, not app code. Source of truth:

- `supabase/templates/invite.html` — Sudar branding (teachwithsudar dark theme, `thesudar.com` URLs, current logo)
- `scripts/ops/update-supabase-email-templates.mjs` — push to hosted Supabase via Management API

After editing templates or changing **Site URL**, deploy:

```bash
# Token: https://supabase.com/dashboard/account/tokens (store in sudar-studio/.env.local)
node scripts/ops/update-supabase-email-templates.mjs
```

Set **Site URL** to `https://studio.thesudar.com` (org invites) or `https://learn.thesudar.com`. The invite template links to `learn.thesudar.com` and `studio.thesudar.com` — not Vercel staging hosts.

Logo image for emails: `learn.thesudar.com/brand/Sudar_Logo.svg` (same mark as `sudar-learn/public/brand/Sudar_Logo.svg`).

**Personalization:** Studio `POST /api/users/invite` passes `invited_by_name` and `org_name` in `inviteUserByEmail` metadata; the template uses `{{ .Data.invited_by_name }}` / `{{ .Data.org_name }}` with fallbacks to generic copy.

Verify after changes:

```bash
node scripts/verify-production-domains.mjs
```

Keep legacy `.app` URLs until you retire that zone.

---

*See also [CLOUDFLARE_PAGES_DEPLOY.md](CLOUDFLARE_PAGES_DEPLOY.md), [DEPLOY_THESUDAR_COM.md](DEPLOY_THESUDAR_COM.md), and [MCP_CHATGPT_LAUNCH.md](MCP_CHATGPT_LAUNCH.md).*
