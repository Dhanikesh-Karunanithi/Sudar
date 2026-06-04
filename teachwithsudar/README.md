# Teach with Sudar | Marketing & Documentation Site

**teachwithsudar.com** — research, story, mission, self-host guides, plugins, help, legal, and community (original marketing site).

**thesudar.com** — separate Cloudflare Pages deploy (`NEXT_PUBLIC_SITE_VARIANT=gateway`): cinematic app gateway into Learn and Studio. Docs stay on teachwithsudar.com.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- Static content; no database. Blog/updates can be extended with MDX later.

## Run locally

```bash
npm install
npm run dev
```

Runs at [http://localhost:3002](http://localhost:3002) (marketing site by default).

### Preview thesudar.com (gateway) locally

PowerShell:

```powershell
$env:NEXT_PUBLIC_SITE_VARIANT="gateway"
npm run dev
```

Bash:

```bash
NEXT_PUBLIC_SITE_VARIANT=gateway npm run dev
```

Open [http://localhost:3002](http://localhost:3002) — same port, gateway homepage with Option A brand tokens (deep night `#0D1026`, indigo + ember accents, Manrope headings).

Gateway build before deploy:

```powershell
$env:NEXT_PUBLIC_SITE_VARIANT="gateway"
npm run build
```

## Build

```bash
npm run build
npm start
```

## Deploy to Cloudflare Pages

Two production hosts from the same `teachwithsudar/` source, **different builds**:

| Domain | Pages project | Env |
|--------|---------------|-----|
| `thesudar.com` | **thesudar** | `NEXT_PUBLIC_SITE_VARIANT=gateway` |
| `teachwithsudar.com` | **teachwithsudar** | default (marketing) |

Attach each custom domain only to its project (see [docs/DNS_THESUDAR_COM.md](../docs/DNS_THESUDAR_COM.md)).

### One-time CLI setup

```bash
cd teachwithsudar
npm install
NEXT_PUBLIC_STUDIO_APP_URL=https://studio.thesudar.com \
NEXT_PUBLIC_LEARN_APP_URL=https://learn.thesudar.com \
npm run build          # outputs static site to out/
npx wrangler login
npx wrangler pages project create thesudar --production-branch main
npx wrangler pages deploy out --project-name=thesudar --branch=main
```

Attach custom domains in Cloudflare Dashboard → **Workers & Pages** → **thesudar** → **Custom domains**:

- `thesudar.com` (apex)
- `www.thesudar.com` (optional)
- `teachwithsudar.com` (optional alias)

### Automatic deploy (GitHub Actions)

On every push to **`main`** that touches `teachwithsudar/` or `help-center/`, [`.github/workflows/teachwithsudar-pages.yml`](../.github/workflows/teachwithsudar-pages.yml) builds and deploys to project **thesudar**.

**One-time repo secrets** (Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with **Account → Cloudflare Pages → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (Dashboard → Workers & Pages URL or Overview) |

**Launch demo:** `npm run build` bundles `sudar-ecosystem-demo` into `public/launch-demo/` so [teachwithsudar.com/demo](https://teachwithsudar.com/demo) and [/launch-demo](https://teachwithsudar.com/launch-demo) work without localhost.

Manual redeploy without a code change: **Actions → Deploy teachwithsudar → Run workflow**.

### Manual redeploy (CLI)

```bash
cd teachwithsudar
npm run build
npx wrangler pages deploy out --project-name=teachwithsudar --branch=main
```

Optional env at build time: `NEXT_PUBLIC_ECOSYSTEM_DEMO_URL` (e.g. `https://demo.thesudar.com`) for the `/demo` page link.

## Deploy to Vercel (alternative)

1. In Vercel, import the repo **Dhanikesh-Karunanithi/Sudar**.
2. Set **Root Directory** to **`teachwithsudar`** (this app).
3. Framework: Next.js (auto-detected). Build/install: defaults.
4. Add custom domain **teachwithsudar.com** in Project Settings → Domains.

No environment variables are required for the marketing site unless you add a contact form or newsletter (e.g. Resend).

## Routes

- `/` Home (hero, what is Sudar, problem, how it works, CTAs)
- `/story`, `/mission`, `/research`, `/papers` About
- `/features`, `/guides`, `/modalities`, `/alp` Product
- `/self-host`, `/plugins`, `/monetize` Get started
- `/guides` Animated wireframe walkthroughs (Studio, Learn, ALP, MCP, deploy)
- `/blog`, `/updates`, `/edtech`, `/best-practices` Resources
- `/help/studio`, `/help/learn`, `/faq` Help (synced from `help-center/`)
- `/privacy`, `/terms` Legal
- `/collaborate`, `/contact` Community
- `/demo`, `/roadmap`, `/compare`, `/accessibility` Extra

Content is derived from the repo `docs/` and `ECOSYSTEM.md`; update pages when those sources change.
