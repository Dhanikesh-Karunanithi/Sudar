# Sudar — Pilot onboarding (Talisma, Foundever, staging)

Operator runbook for standing up partner pilot orgs on **staging**:

| Surface | Branded URL | Fallback |
|---------|-------------|----------|
| Sudar Learn | `https://staging.learn.thesudar.com` | `https://sudar-learn.vercel.app` |
| Sudar Studio | `https://staging.studio.thesudar.com` | `https://sudar-studio.vercel.app` |

Uses the **same Supabase project** as production (`qnsrrboprydmjyormlky`); pilot orgs are isolated by `org_id`. Extends [PILOT_PLAN.md](PILOT_PLAN.md).

---

## Prerequisites

- Migration `20260620100000_profiles_active_org_id.sql` applied on shared Supabase.
- Vercel **Production** env on both projects with staging URL vars (see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)).
- Supabase auth redirect URLs include `staging.learn.thesudar.com/**` and `staging.studio.thesudar.com/**` (`node scripts/ops/patch-supabase-auth-urls.mjs`).
- Cloudflare DNS A records for `staging.learn` and `staging.studio` → `76.76.21.21` (DNS only / grey cloud). Script: `node scripts/ops/cloudflare-dns-staging-vercel.mjs` (requires `CLOUDFLARE_API_TOKEN` with DNS Edit).
- At least one cloud fallback key on staging (`TOGETHER_API_KEY` recommended).
---

## 1. Bootstrap FreeLLMAPI (included Sudar AI tier)

```bash
# Clone + register free upstreams (kilo, llm7, pollinations)
node scripts/ops/bootstrap-freellmapi.mjs

# Or start server and bootstrap in one step (local dev)
node scripts/ops/bootstrap-freellmapi.mjs --start
```

Copy the unified API key from the FreeLLMAPI server log. Set on **Studio**, **Learn**, and **Intelligence** staging:

```env
FREELLMAPI_BASE_URL=https://<your-staging-proxy>/v1
FREELLMAPI_API_KEY=freellmapi-...
ALLOW_ORG_PLATFORM_AI=true
TOGETHER_API_KEY=...   # fallback
ADMIN_EMAILS=connect@dhanikeshkarunanithi.com,dhanikeshkarunanithi@foundever.com
EARLY_ACCESS_ENABLED=true
```

---

## 2. Provision pilot orgs

```bash
export NEXT_PUBLIC_SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...

# Preview
node scripts/ops/provision-pilot-org.mjs --dry-run

# Apply
node scripts/ops/provision-pilot-org.mjs
```

Creates:

| Org | Slug | Plan | Sudar AI | Token cap |
|-----|------|------|----------|-----------|
| Talisma | `talisma` | enterprise | enabled | 50M / month hard stop |
| Foundever | `foundever` | enterprise | enabled | 50M / month hard stop |

Also grants `super_admin` + `unlimited` access tier to:

- `connect@dhanikeshkarunanithi.com`
- `dhanikeshkarunanithi@foundever.com`

Integration API keys are printed once per org — save for batch user provisioning.

---

## 3. Manage multiple orgs (platform operator)

1. Log into **Sudar Studio** staging with either super-admin account.
2. Use the **organisation switcher** in the sidebar (visible when you belong to 2+ orgs).
3. Or open **Platform → Organisations** (`/admin/system?tab=orgs`) and click **Switch**.

All Studio org-scoped actions (users, courses, settings) apply to the **active** org.

---

## 4. Invite partner users (Talisma / Foundever)

When you have partner emails:

**Option A — Studio UI**

1. Switch to the partner org.
2. **Users → Invite** (org-invite bypasses early-access gate).

**Option B — Provisioning API**

```bash
curl -X POST "https://staging.studio.thesudar.com/api/org/provisioning/users" \
  -H "x-alp-api-key: <integration-key-from-step-2>" \
  -H "Content-Type: application/json" \
  -d '{"users":[{"email":"partner@talisma.ai","full_name":"Name","role":"ADMIN"}]}'
```

Roles: `ADMIN` | `MANAGER` | `CREATOR` | `LEARNER`.

**Early access:** Talisma can also use invite code `EARLY_TALISMA` (see migration `20260617000002_seed_early_talisma_invite.sql`).

---

## 5. Partner demo checklist

- [ ] Staging URLs shared: Studio + Learn
- [ ] At least one demo course or path in the partner org
- [ ] Org settings → **Sudar AI (included for pilots)** enabled (pre-seeded by provision script)
- [ ] Tutor + content generation smoke-tested under partner org
- [ ] Monitor **Analytics → AI usage** and `ai_usage_daily_org` during eval week

---

## 6. What partners see

- Product branding: **Sudar AI** (never “FreeLLMAPI”).
- Staging **Early Access** banner on all pages.
- Position as evaluation sandbox — production (`learn.thesudar.com`) uses paid cloud providers.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Sudar AI toggle disabled | Set `ALLOW_ORG_PLATFORM_AI=true` + `FREELLMAPI_*` on staging |
| Chat falls back silently | Expected when FreeLLMAPI upstream fails; check Together fallback key |
| Wrong org in Studio | Use org switcher or `/admin/system?tab=orgs` → Switch |
| Quota exceeded | Raise `ai_entitlements.monthly_token_allowance` in org settings JSON or re-run provision merge |

---

*Last updated: 2026-06-20*
