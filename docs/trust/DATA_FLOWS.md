# Data flows (summary)

Canonical schema: [ECOSYSTEM.md](../../ECOSYSTEM.md) Section 5.

## Learner journey (Sudar Learn)

1. Authenticates via Supabase Auth → `profiles`.
2. Reads published `courses`, `modules`, `learning_paths` (scoped by org).
3. Tutor chat → Learn API `/api/tutor/query` → optional RAG → model provider (e.g. Together) with server-side keys.
4. Interactions persisted in `ai_interactions` and `learning_events` when configured.
5. **Digital Learner Twin rollups** — Learn `POST /api/learner/twin-rollup` aggregates recent `learning_events` into `learner_profiles` (e.g. `modality_scores`, engagement fields). Throttled; also triggered after meaningful events and on dashboard load.
6. **Next best action (NBA)** — Learn `POST /api/intelligence/next-action` scores **published courses** for enrollment recommendations and stores the result in `learner_profiles.next_best_action`. It is not a full “next step in-lesson” planner unless product copy states that scope.

### Row Level Security (important nuance)

- Supabase **RLS** on `learner_profiles`, `learning_events`, and `ai_interactions` restricts **learner direct** access to their own rows (`user_id = auth.uid()`). See `supabase/migrations/20260317000000_rls_learner_tables.sql`.
- **Server routes** in Learn and Studio typically use the **service role / admin Supabase client**, which **bypasses RLS**. Security for those paths relies on app-layer auth, org scoping, and operational access control—not on RLS alone.

### Model providers and training

- Learner content sent to an LLM is governed by the **provider’s commercial terms** and your **DPA** (e.g. whether prompts/responses are used to train foundation models). This is **not enforced in application code**; configure providers accordingly and list them under [SUBPROCESSORS.md](SUBPROCESSORS.md).

## Admin journey (Sudar Studio)

1. Same Supabase project; `org_members` determines role.
2. Course authoring, user management, org `settings` JSON (e.g. `ai_compliance`, `ai_models`).
3. Studio agent chat → `/api/agent/query` with org-scoped context.

## Intelligence service

Learn/Studio may call **Sudar Intelligence** (FastAPI). Treat service secrets (`INTELLIGENCE_SERVICE_SECRET`) as high sensitivity.

## Analytics engine (hybrid) data flow

1. Learn emits event telemetry (`learning_events`) with time quality payloads (`active_secs`, `total_secs` where available).
2. Supabase SQL rollups derive:
   - `analytics_daily_user`
   - `analytics_daily_course`
   - `analytics_daily_module`
   - `analytics_org_rollup`
   - `analytics_risk_signals`
3. Studio reads org-scoped aggregates via analytics API routes for dashboards and CSV export.
4. Learn reads per-user insight views via `/api/insights/*`.
5. Learner recommendation feedback is written to `analytics_feedback` (`accepted`, `dismissed`, `later`) to improve recommendation quality.
6. Sudar Intelligence can consume aggregate features for explainable recommendation outputs (`/api/learner/next-action-analytics`) without requiring raw chat content.
