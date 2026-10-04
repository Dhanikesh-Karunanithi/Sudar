# SudarSim — Voice MVP scenario seed (Stream C)

Seeds **3 published** contact-center scenarios for voice testing (Zenarate-style library cards). Data lives in `scripts/data/sudarsim-voice-mvp-scenarios.json`; the upsert script writes via the Supabase **service role**.

## Scenarios

| Title | Difficulty | Tags | Seed reference |
|-------|------------|------|----------------|
| Billing Dispute Resolution | Beginner | empathy, accuracy, resolution | `seed:voice-mvp:billing-dispute-resolution` |
| Chasing Refunds | Advanced | active-listening, objection-handling, empathy | `seed:voice-mvp:chasing-refunds` |
| Retention - Service Cancellation | Advanced | empathy, probing, resolution | `seed:voice-mvp:retention-service-cancellation` |

Channels: **phone + chat** (`email: false`). Locale: `en`. Status: `published`.

Initial persona state is stored under `persona_state_rules.initial_state` (mood / trust / difficulty). Learn session create applies that state when a learner starts a run.

## Prerequisites

1. Migration [`supabase/migrations/20260616000000_sudarsim.sql`](../supabase/migrations/20260616000000_sudarsim.sql) applied (`sim_scenarios` table).
2. Target **organisation** UUID and a **profile** UUID (creator) that exist in that Supabase project.
3. Env: `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`) + `SUPABASE_SERVICE_ROLE_KEY` (script also loads `sudar-studio/.env.local` / `sudar-learn/.env.local`).

Do **not** hardcode a production org id in the script or commit secrets.

## Run the seed

From `sudar-studio` (so `@supabase/supabase-js` resolves):

```bash
cd sudar-studio

# Dry run
ORG_ID=<org-uuid> CREATED_BY=<profile-uuid> node ../scripts/seed-sudarsim-voice-scenarios.mjs --dry-run

# Upsert (idempotent by org_id + source.reference)
ORG_ID=<org-uuid> CREATED_BY=<profile-uuid> node ../scripts/seed-sudarsim-voice-scenarios.mjs

# Or resolve creator by email
ORG_ID=<org-uuid> CREATED_BY_EMAIL=you@company.com node ../scripts/seed-sudarsim-voice-scenarios.mjs
```

The script prints each scenario **id** and a Learn path:

`/sim/session/new?scenario_id=<uuid>`

Re-running updates the same rows (matched on `source.reference`).

### How to obtain IDs later

- Script stdout after seed, or
- Studio **SudarSim** library (`/sudarsim`), or
- SQL:

```sql
SELECT id, title, status, source->>'reference' AS seed_ref
FROM sim_scenarios
WHERE org_id = '<org-uuid>'
  AND source->>'reference' LIKE 'seed:voice-mvp:%';
```

## Open in Learn

1. Sign in as a learner whose `profiles.org_id` matches the seeded org.
2. Visit (Learn app, typically port 3001):

```
/sim/session/new?scenario_id=<id-from-seed-output>
```

Example:

```
http://localhost:3001/sim/session/new?scenario_id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
```

Published scenarios only (non-preview). Voice UI / STT are separate streams; this seed only populates scenario content.

## Optional SQL upsert

If you prefer SQL Editor over Node, copy persona/rubric JSON from `scripts/data/sudarsim-voice-mvp-scenarios.json` and upsert with your `org_id` / `created_by`. Match existing rows with `source->>'reference' = 'seed:voice-mvp:…'`. Keep status `'published'`.

## Files

| Path | Role |
|------|------|
| `scripts/data/sudarsim-voice-mvp-scenarios.json` | Scenario payloads |
| `scripts/seed-sudarsim-voice-scenarios.mjs` | Service-role upsert |
| `sudar-learn/src/lib/sim/simSession.ts` | `initialPersonaStateFromScenario` |
| `sudar-learn/src/app/api/sim/session/route.ts` | Applies initial_state on session start |
