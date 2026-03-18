# Sudar Intelligence — Production Deployment

Sudar Intelligence is a **Python FastAPI** service. It cannot run on Vercel (Node/Next.js only), so it is deployed on a separate platform. Once deployed, you set its URL as `BYTEOS_INTELLIGENCE_URL` in both [Sudar Studio](https://sudar-studio.vercel.app/) and [Sudar Learn](https://sudar-learn.vercel.app/) on Vercel.

---

## Quick summary

| Step | Action |
|------|--------|
| 1 | Deploy Intelligence to **Railway** or **Render** (see below). |
| 2 | Set env vars (Supabase, AI keys, **CORS_ORIGINS**). |
| 3 | Copy the public URL (e.g. `https://sudar-intelligence.up.railway.app`). |
| 4 | In Vercel, set `BYTEOS_INTELLIGENCE_URL` to that URL in **both** Studio and Learn; redeploy. |

---

## Option A: Railway (recommended — simplest)

1. **Sign up**: [railway.app](https://railway.app) (GitHub login).

2. **New project**:
   - **New Project** → **Deploy from GitHub repo**.
   - Select repo: `Dhanikesh-Karunanithi/Sudar`.
   - When asked for root directory, set **Root Directory** to `byteos-intelligence`.

3. **Configure build & start**:
   - **Settings** → **Build**:
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`
   - Railway sets `PORT`; use it so the app binds correctly.

4. **Environment variables** (Railway → your service → **Variables**):

   From `byteos-intelligence/.env.example`, add at least:

   | Variable | Description |
   |----------|-------------|
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
   | `SUPABASE_JWT_SECRET` | Supabase JWT secret (for validating user JWTs server-side) |
   | `TOGETHER_API_KEY` and/or `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | At least one AI provider |
   | `CORS_ORIGINS` | `https://sudar-studio.vercel.app,https://sudar-learn.vercel.app` |
   | `ENV` | `production` (disables Swagger/ReDoc) |
   | `INTELLIGENCE_SERVICE_SECRET` | Optional: shared secret for server-to-server proxy calls (e.g. ALP tutor) via `X-Intelligence-Service-Secret` |

   Optional (for full features):

   | Variable | Description |
   |----------|-------------|
   | `BYTEOS_VIDEO_SERVICE_URL` | Video microservice URL (if deployed) |
   | `REMOTION_SERVER_URL` | Remotion renderer URL (if deployed) |
   | `SUDARPLAY_JWT_SECRET` | For SudarPlay modality (min 32 chars) |
   | `WA_INSTANCE_URL` | WorkAdventure instance URL |
   | `SUDARPLAY_MAPS_BUCKET` | Supabase bucket for maps |

5. **Deploy**: Railway builds and deploys. Open **Settings** → **Networking** → **Generate Domain** to get a URL (e.g. `https://sudar-intelligence.up.railway.app`).

6. **Verify**: Open `https://sudar-intelligence.up.railway.app/api/health` (or your generated URL) — should return healthy.

7. **Wire Vercel**:
   - **Sudar Studio** (Vercel) → Settings → Environment Variables → set `BYTEOS_INTELLIGENCE_URL` = your Railway URL.
   - **Sudar Learn** (Vercel) → same.
   - Redeploy both Studio and Learn.

---

## Option B: Render (Web Service)

1. **Sign up**: [render.com](https://render.com) (GitHub login).

2. **New Web Service**:
   - **New** → **Web Service**.
   - Connect repo: `Dhanikesh-Karunanithi/Sudar`.
   - **Root Directory:** `byteos-intelligence`.

3. **Build & start**:
   - **Runtime:** Python 3.
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`
   - Render sets `PORT` (often 10000).

4. **Environment**: Add the same variables as in Railway (see table above), including `CORS_ORIGINS` and `ENVIRONMENT=production`.

5. **Deploy**: Render gives a URL like `https://sudar-intelligence.onrender.com`. Use this as `BYTEOS_INTELLIGENCE_URL` in both Vercel projects.

6. **Note**: Free tier may spin down after inactivity; first request can be slow. For always-on, use a paid plan or Railway.

---

## Option C: Fly.io

1. Install [flyctl](https://fly.io/docs/hub/installing-flyctl/) and log in.

2. In repo root:
   ```bash
   cd byteos-intelligence
   fly launch
   ```
   When prompted, choose app name (e.g. `sudar-intelligence`), region, and **do not** deploy a Postgres/Redis (we use Supabase).

3. **Dockerfile**: Fly can use a Dockerfile. Create `byteos-intelligence/Dockerfile`:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   EXPOSE 8000
   CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```
   Then in `fly.toml` set `internal_port = 8000` and ensure `PORT`/env are correct if Fly injects PORT.

4. Set secrets (env):
   ```bash
   fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... CORS_ORIGINS="https://sudar-studio.vercel.app,https://sudar-learn.vercel.app" ...
   ```

5. **Deploy**: `fly deploy`. Your URL will be `https://sudar-intelligence.fly.dev` (or the name you chose).

6. Set `BYTEOS_INTELLIGENCE_URL` in both Vercel projects to that URL.

---

## After deployment checklist

- [ ] Intelligence health check returns OK: `GET https://your-intelligence-url/api/health`
- [ ] `CORS_ORIGINS` includes `https://sudar-studio.vercel.app` and `https://sudar-learn.vercel.app`
- [ ] `BYTEOS_INTELLIGENCE_URL` set in **Sudar Studio** (Vercel) and **Sudar Learn** (Vercel)
- [ ] Studio and Learn redeployed after setting `BYTEOS_INTELLIGENCE_URL`
- [ ] From Studio or Learn, trigger an action that calls Intelligence (e.g. AI tutor, content generation) and confirm it works

---

## Troubleshooting

| Issue | Fix |
|------|-----|
| CORS errors in browser | Ensure `CORS_ORIGINS` includes the exact Studio/Learn URLs (no trailing slash). Redeploy Intelligence after changing env. |
| 502 / connection refused | Check start command uses `--host 0.0.0.0` and the platform’s `PORT`. |
| Health OK but AI features fail | Verify `SUPABASE_*` and at least one of `TOGETHER_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` are set. |
| Cold starts (Render free) | First request after idle can take 30–60 s. Use Railway or Render paid for always-on. |

For full env reference, see **docs/ENV_REFERENCE.md** (if present) or `byteos-intelligence/.env.example`.
