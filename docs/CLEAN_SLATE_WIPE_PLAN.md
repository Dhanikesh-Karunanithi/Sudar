# Clean-slate wipe — dependency list + backup confirmation

**Status:** Wipe **executed** 2026-09-15. Cavi provisioned. Jobsy orphan tables dropped.  
**Cloudflare:** Option B — leave Learn on Vercel proxy; staging purpose unchanged.

After wipe: provision org **Cavi**; archive Talisma/Foundever docs; apply post-rebuild RLS Phase 2 (profiles / org_members insert / sim_* / invite_codes policies) — shelf note in [RLS_RAG_BEARER_SUBPLAN.md](RLS_RAG_BEARER_SUBPLAN.md).

---

## 1. Local backup (confirmed)

| Item | Value |
|------|--------|
| Location | `.local-backups/clean-slate-<timestamp>/` under repo root |
| Git | **Ignored** via `.local-backups/` in `.gitignore` — do not commit/push |
| Contents | Per-table JSON + `_manifest.json` + `README.txt` |
| Script | `scripts/ops/backup-clean-slate-local.mjs` |

If the dump finished successfully in this session, the folder path will be cited in the chat summary. Re-run anytime:

```bash
node --env-file=sudar-studio/.env.local scripts/ops/backup-clean-slate-local.mjs
```

---

## 2. Orgs that will be deleted (all 7)

| Name | Slug | Plan |
|------|------|------|
| Dhanikesh Karunanithi's Team | `dhanikesh-karunanithi-s-team-416617` | free |
| Andres Montenegro's Workspace | `workspace-d1ae97db` | free |
| Pavithra Gowri S's Workspace | `workspace-620ce0c6` | free |
| Talisma_Early | `talisma-early-d737a0` | enterprise |
| Foundever | `foundever` | enterprise |
| Cursor Education Portfolio | `cursor-education-portfolio-89c5fb` | enterprise |
| My Workspace | `workspace-63710723` | free |

Then provision fresh: **Cavi**.

---

## 3. Current row counts (exact)

| Table | Rows |
|-------|------|
| organisations | 7 |
| org_members | 12 |
| courses | 21 |
| modules | 62 |
| enrollments | 20 |
| invite_codes | 4 |
| learning_events | 2877 |
| ai_interactions | 135 |
| learning_paths | 1 |
| learning_domains | 1 |
| sim_scenarios | 4 |
| sim_sessions | 5 |
| profiles | 23 (**kept**) |
| learner_profiles | 1 (**schema kept**; row may remain but org refs nulled) |

---

## 4. Full FK dependency list (into wipe roots)

### Into `courses`

| Child | Column | ON DELETE |
|-------|--------|-----------|
| modules | course_id | **CASCADE** |
| analytics_daily_course | course_id | CASCADE |
| analytics_daily_module | course_id | CASCADE |
| content_chunks | course_id | CASCADE |
| course_org_tags | course_id | CASCADE |
| enrollments | course_id | SET NULL |
| knowledge_bases | course_id | SET NULL |
| learning_domains | source_course_id | SET NULL |
| learning_events | course_id | SET NULL |
| sim_sessions | course_id | SET NULL |

### Into `modules`

| Child | Column | ON DELETE |
|-------|--------|-----------|
| ai_interactions | module_id | SET NULL |
| analytics_daily_module | module_id | CASCADE |
| content_chunks | module_id | SET NULL |
| learning_events | module_id | SET NULL |
| sim_sessions | module_id | SET NULL |

### Into `organisations` (biggest surface)

| Child | Column | ON DELETE |
|-------|--------|-----------|
| courses | org_id | **RESTRICT** (must delete courses first) |
| learning_paths | org_id | **RESTRICT** |
| org_members | org_id | **RESTRICT** |
| org_branding | org_id | **RESTRICT** |
| agent_runs | org_id | CASCADE |
| ai_usage_* | org_id | CASCADE |
| analytics_* | org_id | CASCADE |
| content_generation_jobs | org_id | CASCADE |
| integration_api_keys | org_id | CASCADE |
| kb_ingest_queue / knowledge_bases | org_id | CASCADE |
| learner_groups / learner_performance_records | org_id | CASCADE |
| learning_domains | org_id | CASCADE → claims / claim_edges / mastery |
| learning_sessions | org_id | SET NULL |
| notification_campaigns / templates | org_id | CASCADE |
| org_invites / org_tags / tag_groups | org_id | CASCADE |
| profiles.org_id / active_org_id | org_id | **SET NULL** (profiles stay) |
| sim_crm_skins / sim_scenarios / sim_sessions | org_id | **CASCADE** |
| skills | org_id | SET NULL |
| early_access_feedback | org_id | SET NULL |

### Into `learning_paths` / `sim_*` (second-order)

| Child | Parent | ON DELETE |
|-------|--------|-----------|
| certifications | learning_paths | **RESTRICT** (delete certs before paths) |
| enrollments.path_id | learning_paths | SET NULL |
| sim_crm_skins / sim_sessions | sim_scenarios | CASCADE |
| sim_transcripts / sim_rubric_results | sim_sessions | CASCADE |
| modules.sim_scenario_id | sim_scenarios | SET NULL |
| learning_claims / claim_edges | learning_domains | CASCADE |

### Into `org_members`

No other tables FK to `org_members` (membership is leaf). Safe to delete after RESTRICT children of org are cleared.

---

## 5. What stays (schema + data intent)

| Keep | Notes |
|------|--------|
| **Table schemas** for everything | No `DROP TABLE` |
| **`profiles`** | Rows kept; `org_id` / `active_org_id` nulled via SET NULL |
| **`learner_profiles`** | Schema + row(s) kept (user twin shell) |
| **`auth.users`** | Untouched (Supabase Auth) |
| **Platform config** | e.g. `access_tier_config`, `ai_model_pricing`, `notification_categories`, gamification catalogs (`achievements`, `quests`, …) if not org-scoped |
| **`jobsy_*`** | Untouched (unrelated; confirm if you want those wiped too) |

### Org-scoped `sim_*` data — important

Wiping **organisations** will **CASCADE-delete** `sim_scenarios`, `sim_sessions`, transcripts, rubric results.  
**Schema** for `sim_*` remains. **Seed/scenario data does not.**  
If you want empty sim tables but re-seed later, that is fine. Say if you want scenarios exported separately first (already in local backup JSON).

### Orphan / optional wipe (recommend include)

These are empty or pilot-tied and will be empty after org wipe anyway; we should **TRUNCATE/DELETE** explicitly so SET NULL orphans don’t linger:

- `learning_events`, `ai_interactions` (even if course_id nulled)
- `invite_codes` (all)
- `usage_limits` if user-scoped leftovers matter
- `sudar_notes_sessions` (user pedagogical state — **flag for you**: wipe or keep?)

---

## 6. Safe delete order (after your go)

Because of **RESTRICT**:

1. `certifications`  
2. `learning_paths` (after certs)  
3. Explicit wipe of telemetry: `learning_events`, `ai_interactions`, `ai_usage_*`, analytics_*  
4. `enrollments`  
5. `modules` / `courses` (or delete courses → CASCADE modules)  
6. Org children that RESTRICT: `org_branding`, `org_members`  
7. CASCADE children can go with orgs, or delete orgs last after RESTRICT cleared  
8. `DELETE FROM organisations`  
9. `DELETE FROM invite_codes`  
10. Null leftover FKs / TRUNCATE SET NULL orphans as needed  
11. Provision **Cavi** via retargeted `provision-pilot-org.mjs`  
12. Archive docs (PILOT_ONBOARDING historical, etc.)

No DROP TABLE. Prefer a single SQL migration or scripted transactional deletes with counts logged.

---

## 7. Cloudflare staging vs prod — what the conflict actually is

Cloudflare bindings MCP auth timed out; diagnosis from **in-repo Worker config** (authoritative for what was deployed):

[`workers/sudar-staging-vercel/wrangler.jsonc`](../workers/sudar-staging-vercel/wrangler.jsonc) attaches **custom domains**:

- `learn.thesudar.com` ← **production Learn hostname**
- `staging.learn.thesudar.com`
- `staging.studio.thesudar.com`

And [`src/index.ts`](../workers/sudar-staging-vercel/src/index.ts) proxies:

- `learn.thesudar.com` → `sudar-learn.vercel.app`
- staging hosts → Vercel Learn/Studio

**Conflict:** Cloudflare allows **one** Worker (or Pages project) to own a given custom domain.  
Meanwhile CI ([`sudar-learn-cloudflare.yml`](../.github/workflows/sudar-learn-cloudflare.yml)) deploys OpenNext Worker **`sudar-learn`**, which historically also wanted `learn.thesudar.com`.

**Why it happened:** Free Workers CPU (Error **1102**) on course SSR → July 2026 mitigation moved **production Learn** onto the same “staging” edge proxy → Vercel ([UPDATES.md](../UPDATES.md) 2026-07-13). So “staging” Worker is also serving **prod Learn**.

| Hostname | Intended | Actual (per wrangler) |
|----------|----------|------------------------|
| `learn.thesudar.com` | Prod OpenNext Worker | **Vercel via `sudar-staging-vercel`** |
| `studio.thesudar.com` | Prod OpenNext Worker | Not on staging proxy (likely still OpenNext / separate) |
| `staging.learn` / `staging.studio` | Staging for testers | Vercel via same proxy Worker — **OK to keep** |

### Fix options (do not apply until you choose)

**A — Recommended for clean coexistence**

1. Rename mentally: `sudar-staging-vercel` → “edge proxy to Vercel” (or rename Worker).  
2. **Keep** `staging.learn` / `staging.studio` on that proxy → Vercel (your early-access sandbox — unchanged purpose).  
3. For **prod Learn**: either  
   - **Paid Workers** + reattach `learn.thesudar.com` to OpenNext `sudar-learn` and **remove** `learn.thesudar.com` from staging proxy routes, **or**  
   - Keep Learn on Vercel permanently but move prod route to a dedicated Worker (`sudar-learn-vercel-proxy`) so “staging” isn’t also “prod.”  
4. Never list the same hostname in two wrangler `routes` / custom domains.

**B — Leave as-is for now**

Staging stays; prod Learn stays on Vercel behind CF. Document that OpenNext CF deploy for Learn is **not** the public hostname until Paid/reattach. No silent workaround beyond what’s already live.

**Your ask:** leave staging running, don’t merge toward prod identity — **compatible with A** if we only strip `learn.thesudar.com` from the staging Worker when/if prod returns to OpenNext; staging hostnames stay.

---

## 8. Confirm before wipe

Reply **go** (optionally with notes) after checking:

- [ ] Backup folder exists under `.local-backups/`  
- [ ] OK to delete **all 7 orgs** (including personal workspaces + Cursor portfolio)  
- [ ] OK that **sim_* rows** cascade away (schema kept)  
- [ ] Wipe or keep **`sudar_notes_sessions`**?  
- [ ] Wipe or keep **`jobsy_*`**?  
- [ ] Cloudflare: prefer **A** (document + later reattach) or **B** (leave Learn on Vercel proxy)

No deletes until you say go.
