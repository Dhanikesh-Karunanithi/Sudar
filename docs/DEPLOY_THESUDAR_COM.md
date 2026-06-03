# Deploy Sudar on thesudar.com

Production deployment checklist for **Studio**, **Learn**, **Marketing**, and **Intelligence**.

## URLs (target)

| Service | URL |
|---------|-----|
| Marketing | `https://thesudar.com` |
| Studio | `https://studio.thesudar.com` |
| Learn | `https://learn.thesudar.com` |
| Intelligence | `https://intelligence.thesudar.com` |
| MCP | `https://mcp.thesudar.com` |

**Primary guide:** [CLOUDFLARE_PAGES_DEPLOY.md](CLOUDFLARE_PAGES_DEPLOY.md)  
**DNS:** [DNS_THESUDAR_COM.md](DNS_THESUDAR_COM.md)  
**Legacy (.app zone):** [DEPLOY_THESUDAR_APP.md](DEPLOY_THESUDAR_APP.md)

---

## 1. Supabase (production)

1. Create or use production Supabase project.
2. Apply migrations: run SQL from `supabase/migrations/` and app-specific folders (`sudar-learn/supabase/migrations/`, etc.).
3. Copy **Project URL**, **anon key**, **service role key**.
4. Auth → URL configuration: add Studio/Learn/MCP redirect URLs (see DNS doc).

---

## 2. Sudar Studio (Cloudflare Workers)

1. Set Worker env vars (see [CLOUDFLARE_PAGES_DEPLOY.md](CLOUDFLARE_PAGES_DEPLOY.md)).
2. Deploy: push to `main` (GitHub Action) or `cd sudar-studio && npm run deploy:cf`.
3. Attach custom domain **studio.thesudar.com**.
4. Smoke test: login, Integrations, generate course outline.

---

## 3. Sudar Learn (Cloudflare Workers)

1. Set Worker env vars (minimum in CLOUDFLARE guide).
2. Deploy: push to `main` or `cd sudar-learn && npm run deploy:cf`.
3. Attach custom domain **learn.thesudar.com**.
4. Deploy cron worker `workers/sudar-cron-learn`.
5. Smoke test: learner login, tutor message.

---

## 4. Marketing site (thesudar.com)

Static export from `teachwithsudar/` → Cloudflare Pages project **thesudar**.

1. GitHub Action `.github/workflows/teachwithsudar-pages.yml` deploys on push.
2. Add custom domains: `thesudar.com`, optionally `teachwithsudar.com`.
3. Build-time env (set in workflow): `NEXT_PUBLIC_STUDIO_APP_URL`, `NEXT_PUBLIC_LEARN_APP_URL`.

---

## 5. Sudar Intelligence (Railway / Render / Fly)

1. Deploy `sudar-intelligence/` (Python FastAPI).
2. Set `LEARN_INTERNAL_URL=https://learn.thesudar.com`, `CORS_ORIGINS` for Learn + Studio `.com` URLs.
3. Custom domain **intelligence.thesudar.com**.

Reference: [INTELLIGENCE_DEPLOYMENT.md](INTELLIGENCE_DEPLOYMENT.md)

---

## 6. MCP worker (Cloudflare)

```bash
cd workers/sudar-mcp-cloudflare
npx wrangler secret put SUDAR_STUDIO_URL   # https://studio.thesudar.com
npx wrangler secret put SUDAR_LEARN_URL    # https://learn.thesudar.com
npx wrangler deploy
```

Attach custom domain **mcp.thesudar.com**.

See [MCP_CHATGPT_LAUNCH.md](MCP_CHATGPT_LAUNCH.md).

---

## 7. Post-deploy smoke matrix

| Check | Command / action |
|-------|------------------|
| Landing | Open `https://thesudar.com` |
| Studio up | Open `https://studio.thesudar.com` |
| Learn up | Open `https://learn.thesudar.com` |
| MCP health | `curl https://mcp.thesudar.com/health` → `{"ok":true}` |

---

*Sudar — Learns with you, for you.*
