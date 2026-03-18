# Teach with Sudar — Marketing & Documentation Site

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

## Deploy to Vercel (teachwithsudar.com)

1. In Vercel, import the repo **Dhanikesh-Karunanithi/Sudar**.
2. Set **Root Directory** to **`teachwithsudar`** (this app).
3. Framework: Next.js (auto-detected). Build/install: defaults.
4. Add custom domain **teachwithsudar.com** in Project Settings → Domains.

No environment variables are required for the marketing site unless you add a contact form or newsletter (e.g. Resend).

## Routes

- `/` — Home (hero, what is Sudar, problem, how it works, CTAs)
- `/story`, `/mission`, `/research`, `/papers` — About
- `/features`, `/modalities`, `/alp` — Product
- `/self-host`, `/plugins`, `/monetize` — Get started
- `/blog`, `/updates`, `/edtech`, `/best-practices` — Resources
- `/help/studio`, `/help/learn`, `/faq` — Help
- `/privacy`, `/terms` — Legal
- `/collaborate`, `/contact` — Community
- `/demo`, `/roadmap`, `/compare`, `/accessibility` — Extra

Content is derived from the repo `docs/` and `ECOSYSTEM.md`; update pages when those sources change.
