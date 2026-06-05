# Sudar — Deploying to Vercel

This guide walks you through connecting the Sudar repo to Vercel and hosting **Sudar Studio** and **Sudar Learn**. Sudar Intelligence (Python FastAPI) is deployed separately — see [Intelligence hosting](#intelligence-api-hosted-separately) below.

---

## 1. Prerequisites

- GitHub repo: **https://github.com/Dhanikesh-Karunanithi/Sudar**
- Vercel account: [vercel.com](https://vercel.com) (sign in with GitHub)
- Supabase project (same for both apps)
- Sudar Intelligence API hosted somewhere (e.g. Railway, Render) for production — or use a tunnel for demos

---

## 2. Deploy Sudar Studio (Admin app)

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import** the repo: `Dhanikesh-Karunanithi/Sudar`. Authorize Vercel to access GitHub if prompted.
3. **Configure the project:**
   - **Project Name:** e.g. `sudar-studio`
   - **Root Directory:** Click **Edit** and set to **`sudar-studio`** (important — this is a monorepo).
   - **Framework Preset:** Next.js (auto-detected).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** leave default (`.next`).
   - **Install Command:** `npm install` (default).
4. **Environment Variables:** Add the variables from `sudar-studio/.env.example`. At minimum for a working deploy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXTAUTH_URL` → set to your Studio URL, e.g. `https://sudar-studio.vercel.app`
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `BYTEOS_INTELLIGENCE_URL` → your Intelligence API URL (e.g. Railway/Render URL or tunnel)
   - `INTELLIGENCE_SERVICE_SECRET` → optional, must match Railway `INTELLIGENCE_SERVICE_SECRET` if using ALP tutor proxy (server-to-server)
   - At least one AI key: `TOGETHER_API_KEY` and/or `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_LEARN_APP_URL` → your Learn app URL (e.g. `https://sudar-learn.vercel.app`)
   - `ENABLE_ANALYTICS_ENGINE=true` → enables analytics APIs and refresh endpoints
5. Click **Deploy**. After the first deploy, set **NEXTAUTH_URL** to the actual Vercel URL (e.g. `https://sudar-studio-xxx.vercel.app`) and redeploy if you used a placeholder.

---

## 3. Deploy Sudar Learn (Learner app)

1. Go to [vercel.com/new](https://vercel.com/new) again (or **Add New** → **Project**).
2. Import the **same** repo: `Dhanikesh-Karunanithi/Sudar`.
3. **Configure the project:**
   - **Project Name:** e.g. `sudar-learn`
   - **Root Directory:** Set to **`sudar-learn`**.
   - **Framework Preset:** Next.js.
   - **Build / Install:** leave defaults.
4. **Environment Variables:** Add from `sudar-learn/.env.example`. Minimum:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXTAUTH_URL` → your Learn app URL, e.g. `https://sudar-learn.vercel.app`
   - `NEXTAUTH_SECRET` (same as Studio for shared auth if desired, or separate)
   - `BYTEOS_INTELLIGENCE_URL` → same Intelligence API URL as Studio
   - `NEXT_PUBLIC_APP_URL` → same as NEXTAUTH_URL for Learn
   - `INTELLIGENCE_SERVICE_SECRET` → optional, must match Railway `INTELLIGENCE_SERVICE_SECRET` for ALP tutor proxy
   - `ENABLE_ANALYTICS_ENGINE=true` → enables learner insights APIs
   - **`CRON_SECRET`** → random string (e.g. `openssl rand -base64 32`); **required** for Learn cron route handlers to run. Vercel [Cron Jobs](https://vercel.com/docs/cron-jobs) send `Authorization: Bearer <CRON_SECRET>` when this env var is set on the project.
5. Click **Deploy**.

**Learn — scheduled crons (Vercel):** `sudar-learn/vercel.json` defines a daily job (**04:30 UTC**) for **`GET /api/cron/consolidate-learner-memory`**. **`process-kb-uploads`** is **not** on Vercel (Hobby tier allows daily crons only); it runs on Cloudflare — see [CLOUDFLARE_PAGES_DEPLOY.md](CLOUDFLARE_PAGES_DEPLOY.md) and [§8 Multi-platform](#8-multi-platform-vercel--cloudflare). Ensure **`CRON_SECRET`** is set on the Learn Vercel project for the daily job.

---

## 4. Post-deploy: wire URLs

- In **Sudar Studio** project settings → Environment Variables:
  - Set `NEXT_PUBLIC_LEARN_APP_URL` to your deployed Learn URL (e.g. `https://sudar-learn.vercel.app`).
- In **Sudar Learn** project settings:
  - Ensure `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` match the Learn deployment URL.
- Redeploy both if you changed any of these.

---

## 5. Intelligence API (hosted separately)

Vercel runs **Node.js/Next.js** only. The **Sudar Intelligence** service (Python FastAPI in `sudar-intelligence/`) must be hosted elsewhere and its URL used as `BYTEOS_INTELLIGENCE_URL` in both Studio and Learn.

**Full step-by-step:** See **[docs/INTELLIGENCE_DEPLOYMENT.md](INTELLIGENCE_DEPLOYMENT.md)** for Railway, Render, and Fly.io.

**Options (summary):**

| Option   | Notes |
|----------|--------|
| **Railway** | Add `sudar-intelligence` (or repo + root dir `sudar-intelligence`), set env vars (including `CORS_ORIGINS`), deploy. Gives a URL like `https://xxx.up.railway.app`. |
| **Render**  | New Web Service, connect repo, root `sudar-intelligence`, build `pip install -r requirements.txt`, start `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`. |
| **Fly.io**  | Use Docker or `fly launch` in `sudar-intelligence` and expose port 8000. |

Then set **BYTEOS_INTELLIGENCE_URL** in both Vercel projects to that URL (e.g. `https://sudar-intelligence.up.railway.app` for the canonical Railway deployment).

---

## 6. Custom domains (optional)

- In each Vercel project → **Settings** → **Domains**, add your domain (e.g. `studio.yourdomain.com`, `learn.yourdomain.com`).
- Update `NEXTAUTH_URL`, `NEXT_PUBLIC_LEARN_APP_URL`, and `NEXT_PUBLIC_APP_URL` to use these domains and redeploy.

---

## 7. Summary checklist

- [ ] Repo pushed to GitHub: `Dhanikesh-Karunanithi/Sudar`
- [ ] Vercel project **Sudar Studio** with root **sudar-studio** and env vars set
- [ ] Vercel project **Sudar Learn** with root **sudar-learn** and env vars set
- [ ] Sudar Intelligence deployed (Railway/Render/Fly) and URL set in both Vercel projects
- [ ] `NEXTAUTH_URL` / `NEXT_PUBLIC_LEARN_APP_URL` / `NEXT_PUBLIC_APP_URL` updated to production URLs
- [ ] Analytics scheduler configured to call `POST /api/cron/analytics-rollups` daily with `Authorization: Bearer <CRON_SECRET>`
- [ ] **Learn:** `CRON_SECRET` set on the Learn Vercel project (required for cron routes); verify `sudar-learn/vercel.json` crons (memory consolidation) or equivalent external scheduler

For full env reference, see **docs/ENV_REFERENCE.md**.

---

## 8. Multi-platform: Vercel + Cloudflare

Sudar Learn and Studio deploy to **Cloudflare Workers** on every push to `main` (see [CLOUDFLARE_PAGES_DEPLOY.md](CLOUDFLARE_PAGES_DEPLOY.md)). Vercel projects remain as **staging** (`sudar-learn.vercel.app`, `sudar-studio.vercel.app`).

### OpenNext dev init (required for Vercel builds)

Both apps use `@opennextjs/cloudflare` for Cloudflare deploys. **`initOpenNextCloudflareForDev()` must not run on Vercel or CI** — it starts Miniflare/Wrangler and breaks Vercel builds. In each `next.config.mjs`:

```js
if (process.env.NODE_ENV === 'development' && !process.env.VERCEL && !process.env.CI) {
  const { initOpenNextCloudflareForDev } = await import('@opennextjs/cloudflare')
  initOpenNextCloudflareForDev()
}
```

### Studio build on Vercel

`sudar-studio/package.json` uses `next build` on Linux/Vercel. Windows local builds can use `npm run build:win` (wraps `scripts/run-next.mjs` for custom `distDir`).

### Learn crons on Vercel Hobby

**Hobby** accounts only allow **daily** cron schedules. `sudar-learn/vercel.json` keeps the daily memory-consolidation cron only. **`/api/cron/process-kb-uploads`** (every 10 minutes) runs on **Cloudflare** via `workers/sudar-cron-learn` — do not add sub-daily crons back to Learn `vercel.json` unless the Vercel project is on Pro.

### Monorepo CLI deploy

Deploy from the **repo root**, not from inside `sudar-learn/` or `sudar-studio/` (Vercel Root Directory is already set per project):

```bash
cd /path/to/Sudar
npx vercel deploy --prod --yes --project sudar-learn
npx vercel deploy --prod --yes --project sudar-studio
```

Prefer **git push to `main`** so Vercel builds from GitHub with the correct root directory and cache.
