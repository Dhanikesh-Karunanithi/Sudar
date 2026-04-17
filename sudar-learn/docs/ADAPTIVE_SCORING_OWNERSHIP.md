# Adaptive scoring ownership (Sudar Learn vs Sudar Intelligence)

## Single source of truth

**Learner-facing adaptive behavior that ships today is implemented in Sudar Learn (`sudar-learn`), not in the Python `sudar-intelligence` service.**

- **Next Best Action**, **tutor query** (with full learner memory), **course/path personalization** APIs, **path enrollment sequencing** (`personalized_sequence`), and **event-driven memory updates** run in the Next.js app and talk to Supabase directly.
- The **`sudar-intelligence`** FastAPI routes under `learner` profile update and `next-action` are **stubs** (placeholder responses). They must not be treated as the live adaptive engine until implemented and wired to the same Supabase contracts.

## Why this matters

Duplicating scoring logic in both TypeScript and Python would create inconsistent recommendations, double maintenance, and conflicting updates to `learner_profiles`.

## Recommended direction

1. **Short term:** Treat **Learn** as the canonical implementation for adaptive UX (dashboard, tutor, personalization, path ordering).
2. **If** a Python service should own heavy batch or offline jobs later, it should **read/write the same tables** (`learner_profiles`, `learning_events`, `enrollments`) with shared types and idempotent updates — not parallel heuristics.
3. **Before** enabling Intelligence endpoints in production, replace stubs with real logic **or** proxy to Learn’s behavior to avoid split-brain behavior.

## Key files (Learn)

- [`src/app/api/intelligence/next-action/route.ts`](../src/app/api/intelligence/next-action/route.ts)
- [`src/app/api/path-enrollments/route.ts`](../src/app/api/path-enrollments/route.ts)
- [`src/lib/personalization/memoryContext.ts`](../src/lib/personalization/memoryContext.ts)

## Key files (Intelligence — stubs)

- `sudar-intelligence/src/api/routes/learner.py` (`update_learner_profile`, `compute_next_action`)
