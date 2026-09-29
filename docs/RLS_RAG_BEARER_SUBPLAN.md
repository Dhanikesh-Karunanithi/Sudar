# Sub-plan: RLS / RAG / Bearer hardening (review before schema changes)

**Status:** Clean slate done; **Phase 2 policy tighten applied** on prod (`20260915190000_post_wipe_rls_tighten`). Phase 1 RAG/Bearer app-layer still open.  
**Date:** 2026-09-15 (updated after Cavi provision + RLS apply)  
**Live project:** `qnsrrboprydmjyormlky` (Sudar; sole org **Cavi**)

**Clean slate (2026-09-15):** Pilot orgs and all course/org data will be wiped after backup + confirmation ([CLEAN_SLATE_WIPE_PLAN.md](CLEAN_SLATE_WIPE_PLAN.md)). The earlier **Phase 2 “tighten courses SELECT for existing published cross-tenant data”** work is **moot / shelved for old data**. After wipe + **Cavi** provision, apply the **rebuilt-schema** policy pass: profiles SELECT, org_members INSERT, sim_* policies, invite_codes policies (and courses/modules policies on empty catalog). RAG ingest + Bearer allowlist (Phase 1 app-layer) still apply either before or after wipe.

Related app-layer items (RAG ingest lock, Studio Bearer allowlist) are included so you can sequence them with policy work. They do **not** require a maintenance window.

---

## 1. Correction vs earlier audit

Repo-only audit assumed `profiles` / `organisations` / `courses` / `org_members` lacked RLS because migrations under `supabase/migrations/` were incomplete. **Live DB check (2026-09-15):**

| Finding | Reality |
|---------|---------|
| Tables with `relrowsecurity = false` | **None** in `public` — every table has RLS **enabled** |
| Real gaps | **Permissive or missing policies**, duplicate policies, and tables with **RLS on + 0 policies** (service-role-only) |

So this is **not** a bulk `ENABLE ROW LEVEL SECURITY` rollout. It is a **policy tighten + app-layer** pass. Lower blast radius than the original write-up implied.

---

## 2. Tables / policies that need work

### 2A — Critical: overly permissive policies (authenticated client can over-read)

| Table | Current policy issue | Desired direction |
|-------|----------------------|-------------------|
| **`profiles`** | `Users can read any profile` — `SELECT` **`qual = true`** for `authenticated` | Restrict SELECT to: own row **OR** same-org membership (via `org_members`) **OR** Studio admin helpers. Never global directory. |
| **`courses`** | Org members **OR `status = 'published'`** — any authenticated user can read **all published courses across orgs** | Published readable only if: same org, enrolled, or public catalog flag (if you add one). Cross-tenant published read is the RAG/client leak surface. |
| **`modules`** | Same pattern via course join — published courses globally readable | Mirror courses policy |
| **`organisations`** | INSERT `with_check = true` (any authenticated user can create an org) | Keep create if product needs it; otherwise gate to invite/provisioning flows |
| **`org_members`** | INSERT `user_id = auth.uid()` with no invite/org check | Insert only via invite redeem / provisioning service-role paths |

### 2B — RLS enabled, **0 policies** (effectively service-role-only for anon/authenticated)

These are **not broken** if only server service-role touches them. Risk = future client/supabase-js misuse or advisors flagging “RLS enabled but no policy.”

Priority to add explicit policies (or document “service-role only” in trust pack):

| Priority | Tables | Why |
|----------|--------|-----|
| P1 | `sim_sessions`, `sim_transcripts`, `sim_rubric_results`, `sim_scenarios`, `sim_crm_skins` | Education roleplay PII; Talisma-relevant |
| P1 | `invite_codes`, `integration_api_keys` | Secrets; must stay non-readable to clients |
| P2 | `learning_paths`, `learner_groups`, `learner_group_members` | Org content |
| P2 | `analytics_*`, `agent_runs`, `compliance_records`, `content_generation_jobs` | Ops/admin |
| P3 | `jobsy_*` (if unused) | Confirm dead product surface |

### 2C — Already in good shape (tighten only if duplicates confuse you)

- `learner_profiles`, `ai_interactions`, `learning_events`, `enrollments`, `sudar_notes_sessions`, Teaching OS claim tables — own-row / org-scoped policies exist (some duplicate `authenticated` + `public` role policies — cleanup optional).

---

## 3. Safe migration order (nothing breaks mid-flight)

**Principle:** Apps today use **service-role** for most privileged reads/writes. Tightening **client** policies does not break service-role. Risk is any **browser anon/authenticated** Supabase client path that relied on global published-course or global profile SELECT.

### Phase 0 — Inventory (no schema) — **0 downtime**

1. Grep Studio/Learn for `.from('profiles'|'courses'|'modules')` using **anon/session** client (`createClient()`), not service-role.
2. Run `scripts/sql/rls_audit.sql` + export `pg_policies` snapshot to `docs/trust/` (sign checklist).
3. Confirm Talisma/Foundever demo flows use Learn/Studio BFFs (service-role) for course lists.

### Phase 1 — App-layer first (no schema) — **0 downtime**

Do these **before** tightening `courses` SELECT (they remove the need for global published reads):

1. **RAG ingest** (`sudar-learn/.../rag/ingest/route.ts`, `ingest-external`): require org membership / content-editor; never “all published” without org pin; refuse cross-org `course_id`.
2. **Studio Bearer allowlist** (`sudar-studio/src/middleware.ts`): only MCP/OAuth/export paths skip cookie session; validate JWT before bypass; keep invite gate for human sessions.
3. Smoke: Studio login, Learn course open, MCP Bearer course build, ALP key path.

### Phase 2 — Policy tighten (low risk if Phase 0 clear) — **no maintenance window** if service-role-only

Order of SQL migrations (additive then replace):

1. **`profiles` SELECT** — add restrictive policy → drop `Users can read any profile` (same transaction).
2. **`courses` / `modules` SELECT** — replace global `published` with org ∪ enrollment ∪ creator.
3. **`org_members` INSERT** — remove open self-join; rely on invite/service-role.
4. **Sim tables** — add learner-own + org-admin policies (or leave 0-policy if confirmed service-role-only and document).
5. **Deduplicate** duplicate course/module/ai_interactions policies.

### Phase 3 — FORCE ROW LEVEL SECURITY (optional, higher risk)

Only after Phase 2 is stable for ≥1 week. `FORCE RLS` can break **table owners** / edge roles that bypass RLS today. **Not recommended** in the first pass while Talisma is live.

---

## 4. Maintenance window? (Talisma live)

| Work | Maintenance window? |
|------|---------------------|
| Phase 0 inventory + Phase 1 RAG/Bearer | **No** — deploy like any app fix; roll back via revert |
| Phase 2 policy tighten | **No full outage** if migrations are additive/swap in one transaction and apps use service-role for admin paths. Schedule a **30–60 min attention window** (you online) during low usage; watch Studio course list + Learn enroll + Sim. |
| Phase 3 FORCE RLS | **Yes** — treat as maintenance; not needed for first pass |

**Recommendation:** No customer-facing maintenance window for Phase 1–2. Do Phase 2 mid-week EU evening or weekend morning with you watching staging first (`staging.learn` / `staging.studio`) for 24h, then prod.

**Rollback:** Keep previous policy SQL in migration comments; re-apply old `CREATE POLICY` in a hotfix migration. Supabase policy changes are fast to reverse.

---

## 5. Applied (2026-09-15 post-wipe)

Migration: `supabase/migrations/20260915190000_post_wipe_rls_tighten.sql` (applied on live project).

| Change | Result |
|--------|--------|
| `profiles` SELECT | Own row **or** same-org (`org_members` / `profiles.org_id`); dropped global `true` |
| `courses` / `modules` SELECT | Org member **or** creator **or** enrollee; dropped cross-tenant `published` |
| `org_members` INSERT | Dropped open self-join (`Users can join orgs`) — invite/provisioning stay service-role |
| `organisations` INSERT | Dropped open authenticated create — `getOrCreateOrg` already uses service-role |
| `invite_codes` / `integration_api_keys` | Still 0 authenticated policies; table COMMENTs document service-role-only |
| `sim_*` | Org-scoped / learner-own policies added (APIs remain service-role) |

**Still open:** Phase 1 RAG ingest lock + Studio Bearer allowlist; Phase 3 FORCE RLS (not recommended yet); sign `docs/trust/RLS_STORAGE_AUDIT_CHECKLIST.md`.

---

## 6. Next

1. Phase 1 PR: RAG + Bearer (app only) when you want that loop closed.  
2. Optional: prune stale `profiles` / `auth.users` from pilot leftovers (human keep-list).  
3. Sign trust checklist after a quiet week with Cavi.
