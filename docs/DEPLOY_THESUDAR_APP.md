# Deploy Sudar on thesudar.app

Production deployment checklist for **Studio**, **Learn**, and **Intelligence** before connecting ChatGPT MCP.

## URLs (target)

| Service | URL |
|---------|-----|
| Studio | `https://studio.thesudar.app` |
| Learn | `https://learn.thesudar.app` |
| Intelligence | `https://intelligence.thesudar.app` |
| MCP | `https://mcp.thesudar.app` |

DNS: [DNS_THESUDAR_APP.md](DNS_THESUDAR_APP.md)

---

## 1. Supabase (production)

1. Create or use production Supabase project.
2. Apply migrations: `npm run supabase db push` (or run SQL from `supabase/migrations/`).
3. Copy **Project URL**, **anon key**, **service role key**.
4. Auth → URL configuration: add Studio/Learn/MCP redirect URLs (see DNS doc).

---

## 2. Sudar Studio (Vercel)

1. [vercel.com/new](https://vercel.com/new) → import Sudar repo.
2. **Root Directory:** `sudar-studio`
3. **Environment variables** (minimum):

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `NEXTAUTH_URL` | `https://studio.thesudar.app` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_LEARN_APP_URL` | `https://learn.thesudar.app` |
| `SUDAR_INTELLIGENCE_URL` | `https://intelligence.thesudar.app` |
| `BYTEOS_INTELLIGENCE_URL` | same as above (legacy alias) |
| `INTELLIGENCE_SERVICE_SECRET` | shared secret with Intelligence + Learn |
| `TOGETHER_API_KEY` or `OPENAI_API_KEY` | AI generation |

4. Add custom domain **studio.thesudar.app** in Vercel → Domains.
5. Deploy → smoke test: login, **Integrations** → create ALP key, generate course outline.

Full reference: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

---

## 3. Sudar Learn (Vercel)

1. Second Vercel project, **Root Directory:** `sudar-learn`
2. **Environment variables** (minimum):

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | same project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same |
| `SUPABASE_SERVICE_ROLE_KEY` | same |
| `NEXT_PUBLIC_APP_URL` | `https://learn.thesudar.app` |
| `SUDAR_INTELLIGENCE_URL` | `https://intelligence.thesudar.app` |
| `INTELLIGENCE_SERVICE_SECRET` | same secret |
| `ALP_EMBED_SIGNING_SECRET` | random secret |
| `ALP_API_KEY` | optional global key |

3. Custom domain **learn.thesudar.app**
4. Smoke test: learner login, tutor message, `POST /api/alp/events` with integration key → 401 without key, 200 with key.

---

## 4. Sudar Intelligence (Railway / Render / Fly)

1. Deploy `sudar-intelligence/` (Python FastAPI).
2. Set:

| Variable | Value |
|----------|-------|
| `LEARN_INTERNAL_URL` | `https://learn.thesudar.app` |
| `INTELLIGENCE_SERVICE_SECRET` | same as Studio/Learn |
| `TOGETHER_API_KEY` / provider keys | AI |
| Supabase URL + service role | if used |

3. Custom domain **intelligence.thesudar.app**
4. Smoke test: `GET /api/health` or root health route.

Reference: [INTELLIGENCE_DEPLOYMENT.md](INTELLIGENCE_DEPLOYMENT.md)

---

## 5. MCP worker (Cloudflare)

```bash
cd workers/sudar-mcp-cloudflare
cp .dev.vars.example .dev.vars   # fill secrets locally
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put MCP_TOKEN_SECRET
npx wrangler secret put SUDAR_STUDIO_URL   # https://studio.thesudar.app
npx wrangler secret put SUDAR_LEARN_URL    # https://learn.thesudar.app
npx wrangler deploy
```

Attach custom domain **mcp.thesudar.app**.

See [MCP_CHATGPT_LAUNCH.md](MCP_CHATGPT_LAUNCH.md).

---

## 6. Post-deploy smoke matrix

| Check | Command / action |
|-------|----------------|
| Studio up | Open `https://studio.thesudar.app` |
| Learn up | Open `https://learn.thesudar.app` |
| ALP auth | `curl -X POST learn.../api/alp/events -H x-alp-api-key: bad` → 401 |
| MCP health | `curl https://mcp.thesudar.app/health` → `{"ok":true}` |
| Outline via API | Studio logged-in Bearer → `POST /api/ai/generate-outline` |

---

*Sudar — Learns with you, for you.*
