# Deploy Sudar on Cloudflare (thesudar.com)

Production deployment for **Sudar Learn**, **Sudar Studio**, and the **thesudar.com** marketing site using Cloudflare Workers/Pages and GitHub Actions.

**Target URLs:**

| Service | URL |
|---------|-----|
| Marketing | `https://thesudar.com` |
| Studio | `https://studio.thesudar.com` |
| Learn | `https://learn.thesudar.com` |
| Intelligence | `https://intelligence.thesudar.com` |
| MCP | `https://mcp.thesudar.com` |

DNS: [DNS_THESUDAR_COM.md](DNS_THESUDAR_COM.md)

---

## Why Cloudflare?

- Domain already registered at Cloudflare
- **Free** Workers/Pages tier for Learn, Studio, and static marketing site
- GitHub-native CI via Actions (no Vercel seat fees)
- Cron workers replace Vercel Cron for scheduled jobs

Learn and Studio use **[@opennextjs/cloudflare](https://opennext.js.org/cloudflare)** (OpenNext adapter) to run Next.js 15 on Cloudflare Workers.

---

## One-time setup

### 1. GitHub secrets

Repository → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Token with **Account → Cloudflare Workers/Pages → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL — **required at OpenNext build time** (client bundle) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key — **required at OpenNext build time** |

`NEXT_PUBLIC_*` values must also exist on the Worker (Dashboard secrets or `wrangler secret put`) for SSR/middleware, but the **GitHub secrets above are mandatory** so CI embeds them into the browser bundle. Without them, Learn/Studio show `@supabase/ssr: Your project's URL and API key are required`.

### 2. Cloudflare Workers — environment variables

Set **production** variables on each Worker in Dashboard → **Workers & Pages** → worker → **Settings** → **Variables and Secrets** (or use `wrangler secret put`).

Copy from `sudar-learn/.env.example` and `sudar-studio/.env.example`. Minimum:

**sudar-learn** (`learn.thesudar.com`):

| Variable | Example |
|----------|---------|
| `NEXTAUTH_URL` | `https://learn.thesudar.com` |
| `NEXT_PUBLIC_APP_URL` | `https://learn.thesudar.com` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role |
| `SUDAR_INTELLIGENCE_URL` | `https://intelligence.thesudar.com` |
| `INTELLIGENCE_SERVICE_SECRET` | shared with Intelligence |
| `CRON_SECRET` | random secret (also on cron worker) |
| AI keys | `TOGETHER_API_KEY` and/or others |

**sudar-studio** (`studio.thesudar.com`):

| Variable | Example |
|----------|---------|
| `NEXTAUTH_URL` | `https://studio.thesudar.com` |
| `NEXT_PUBLIC_LEARN_APP_URL` | `https://learn.thesudar.com` |
| `NEXT_PUBLIC_MCP_URL` | `https://mcp.thesudar.com` |
| `SUDAR_INTELLIGENCE_URL` | `https://intelligence.thesudar.com` |
| `CRON_SECRET` | same pattern as Learn |
| Supabase + AI keys | same project as Learn |

### 3. Custom domains

After first deploy:

1. **sudar-learn** → Domains → `learn.thesudar.com`
2. **sudar-studio** → Domains → `studio.thesudar.com`
3. Pages project **thesudar** → Custom domains → `thesudar.com`, `www.thesudar.com` (optional: `teachwithsudar.com`)

### 4. Cron workers

```bash
cd workers/sudar-cron-learn && npx wrangler deploy
cd ../sudar-cron-studio && npx wrangler deploy
```

See [DNS_THESUDAR_COM.md](DNS_THESUDAR_COM.md) for secrets.

### 5. Supabase Auth

Add redirect URLs for `learn.thesudar.com`, `studio.thesudar.com`, and `mcp.thesudar.com` (see DNS doc).

---

## Automatic deploy (GitHub Actions)

| Workflow | Triggers on | Deploys |
|----------|-------------|---------|
| `.github/workflows/sudar-learn-cloudflare.yml` | `sudar-learn/**` | Worker **sudar-learn** |
| `.github/workflows/sudar-studio-cloudflare.yml` | `sudar-studio/**` | Worker **sudar-studio** |
| `.github/workflows/teachwithsudar-pages.yml` | `teachwithsudar/**` | Pages **thesudar** |

Manual redeploy: **Actions** → select workflow → **Run workflow**.

---

## Local commands

```bash
# Learn
cd sudar-learn
npm install
npm run preview:cf    # build + local Workers preview
npm run deploy:cf     # build + deploy

# Studio
cd sudar-studio
npm install
npm run preview:cf
npm run deploy:cf

# Marketing site
cd teachwithsudar
npm run build
npx wrangler pages deploy out --project-name=thesudar --branch=main
```

---

## Intelligence (unchanged host)

Deploy `sudar-intelligence/` to Railway/Render/Fly. Set:

- `LEARN_INTERNAL_URL=https://learn.thesudar.com`
- `CORS_ORIGINS=https://learn.thesudar.com,https://studio.thesudar.com`

Reference: [INTELLIGENCE_DEPLOYMENT.md](INTELLIGENCE_DEPLOYMENT.md)

---

## Post-deploy smoke matrix

| Check | Action |
|-------|--------|
| Landing | Open `https://thesudar.com` — login links to Learn / Studio |
| Learn | Open `https://learn.thesudar.com` — sign in, tutor message |
| Studio | Open `https://studio.thesudar.com` — sign in, course list |
| MCP | `curl https://mcp.thesudar.com/health` → `{"ok":true}` |
| Cron | Cloudflare Dashboard → Workers → **sudar-cron-learn** → recent invocations |

---

## Vercel fallback

Existing Vercel projects (`sudar-learn.vercel.app`, `sudar-studio.vercel.app`) can remain as staging. Point Cloudflare DNS CNAMEs to Workers when ready; rollback by switching DNS back to `cname.vercel-dns.com`.

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for the Vercel path.

---

*Sudar — Learns with you, for you.*
