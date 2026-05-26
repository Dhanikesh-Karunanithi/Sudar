# Teach with Sudar | Marketing & Documentation Site

Dedicated website for **teachwithsudar.com**: research, story, mission, self-host guides, plugins, help, legal, and community.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- Static content; no database. Blog/updates can be extended with MDX later.

## Run locally

```bash
npm install
npm run dev
```

Runs at [http://localhost:3002](http://localhost:3002).

## Build

```bash
npm run build
npm start
```

## Deploy to Cloudflare Pages (teachwithsudar.com)

Production host: **Cloudflare Pages** (static export). Preview URL: `https://teachwithsudar.pages.dev`.

### One-time CLI setup

```bash
cd teachwithsudar
npm install
npm run build          # outputs static site to out/
npx wrangler login
npx wrangler pages project create teachwithsudar --production-branch main
npx wrangler pages deploy out --project-name=teachwithsudar --branch=main
```

Attach the custom domain in Cloudflare Dashboard → **Workers & Pages** → **teachwithsudar** → **Custom domains** → add `teachwithsudar.com`. If DNS is not auto-created, add a proxied **CNAME** for `@` → `teachwithsudar.pages.dev` in the zone’s DNS tab.

### Automatic deploy (GitHub Actions)

On every push to **`main`** that touches `teachwithsudar/` or `help-center/`, [`.github/workflows/teachwithsudar-pages.yml`](../.github/workflows/teachwithsudar-pages.yml) builds the static export and runs `wrangler pages deploy`.

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

Optional env at build time: `NEXT_PUBLIC_ECOSYSTEM_DEMO_URL` (e.g. `https://demo.thesudar.app`) for the `/demo` page link.

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
