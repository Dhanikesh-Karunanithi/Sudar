# Pilot / sandbox onboarding (current)

**Historical Talisma + Foundever pilot runbook** (closed 2026-09-15):  
[archive/pilots/PILOT_ONBOARDING_TALISMA_FOUNDEVER.md](archive/pilots/PILOT_ONBOARDING_TALISMA_FOUNDEVER.md)

## Current sandbox org: Cavi

Provision (reuses the same ops pattern as former pilots):

```bash
node --env-file=sudar-studio/.env.local scripts/ops/provision-pilot-org.mjs
```

Defaults: org **Cavi** (`slug=cavi`). Override with `ORG_NAME` / `ORG_SLUG` / `ORG_PLAN` / `PILOT_ADMIN_EMAILS`.

Credentials (invite + ALP key) write to **`.local-backups/cavi-credentials.local.json`** only — never commit invite codes.

## Staging (unchanged)

Early-access / tester hosts stay on Vercel behind the Cloudflare edge proxy:

| Surface | URL |
|---------|-----|
| Learn | `https://staging.learn.thesudar.com` |
| Studio | `https://staging.studio.thesudar.com` |

Production Learn currently also serves via that proxy → Vercel (Cloudflare Option B — Free Worker 1102 mitigation). Do not reattach OpenNext to `learn.thesudar.com` until a dedicated prod push.

Clean-slate wipe log: [CLEAN_SLATE_WIPE_PLAN.md](CLEAN_SLATE_WIPE_PLAN.md).
