# Data flows (summary)

Canonical schema: [ECOSYSTEM.md](../../ECOSYSTEM.md) Section 5.

## Learner journey (Sudar Learn)

1. Authenticates via Supabase Auth → `profiles`.
2. Reads published `courses`, `modules`, `learning_paths` (scoped by org).
3. Tutor chat → Learn API `/api/tutor/query` → optional RAG → model provider (e.g. Together) with server-side keys.
4. Interactions persisted in `ai_interactions` and `learning_events` when configured.

## Admin journey (Sudar Studio)

1. Same Supabase project; `org_members` determines role.
2. Course authoring, user management, org `settings` JSON (e.g. `ai_compliance`, `ai_models`).
3. Studio agent chat → `/api/agent/query` with org-scoped context.

## Intelligence service

Learn/Studio may call **Sudar Intelligence** (FastAPI). Treat service secrets (`INTELLIGENCE_SERVICE_SECRET`) as high sensitivity.
