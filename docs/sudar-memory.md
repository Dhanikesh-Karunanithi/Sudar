# Sudar's Longitudinal Memory

Sudar's AI tutor **Sudar** uses a **longitudinal learner memory** so that every response is personalised across sessions and courses. This document describes how it works and where it lives in the codebase.

---

## What Sudar Remembers

Sudar does not forget between sessions. The system maintains:

- **Known concepts** — Topics the learner has demonstrated understanding of (inferred from interactions).
- **Struggles** — Topics where the learner has shown confusion or asked for repeated help.
- **Learning style notes** — How they prefer explanations (e.g. examples-first, step-by-step).
- **Prior courses** — Enrollments and progress on other courses, so Sudar can connect concepts across learning.
- **Conversation history** — Recent exchanges in the current session (and summarised context from past sessions).

Sudar uses this to personalise every answer: reference prior struggles, match explanation style, and connect to what the learner already knows.

---

## Governance: how often an LLM “learns” the learner

Some memory fields are updated with **small LLM calls** (trait extraction after a tutor message; optional **digest** summarisation on a schedule). Learners and organisations control **cadence** to support data minimisation:

| Control | Where | What it does |
|--------|--------|----------------|
| **Post-message profile inference** | Learn → **My Memory** → Learning preferences → *How often AI updates your profile from chat* (`tutor_memory_llm_cadence` in `learner_profiles.learner_preferences`) | `every_message` (default), `daily`, `weekly`, or `off`. When throttled, Sudar skips the extraction LLM until the interval has passed; `ai_tutor_context.tutor_memory_llm_last_extraction_at` records the last run. |
| **Long-range digest spacing** | Same panel → *Minimum days between long-range summaries* (`memory_digest_cadence_days`: 1, 7, or 30) when *Long-range memory summary* is on | The consolidate cron only runs the digest LLM when at least this many days have passed since `consolidated_interaction_at`. |
| **Org disable / floors** | Studio → **Org settings** → *AI personalization & privacy* → *Tutor memory — LLM learning cadence* (`organisations.settings.ai_compliance`) | `tutor_llm_memory_extraction_policy`: `learner_controlled` or `disabled_org_wide` (no LLM extraction or digest for members). Optional floors: `tutor_llm_memory_min_interval_hours`, `memory_digest_min_interval_days_org` (learner choice is capped to the **slower** of learner vs org). |

**Code:** `sudar-learn/src/lib/learner/tutorMemoryCadence.ts` (policy math), `sudar-learn/src/app/api/tutor/query/route.ts` (gated `updateLearnerMemory`), `sudar-learn/src/app/api/cron/consolidate-learner-memory/route.ts` (gated digest).

---

## Where It Lives

### Data

- **`learner_profiles.ai_tutor_context`** (Supabase) — JSON object holding the Digital Learner Twin summary used by Sudar: `known_concepts`, `struggles_with`, `learning_style_notes`, `self_reported_background`, `learning_goals`, `preferred_explanation_style`, `interaction_count`, optional `consolidated_interaction_digest` / `consolidated_interaction_at`, and `tutor_memory_llm_last_extraction_at` when LLM extraction has run.
- **`learner_profiles.learner_preferences`** — JSON for learner toggles including memory cadence fields above.
- **`ai_interactions`** (Supabase) — Tutor Q&A logged here (`user_message`, `ai_response`, `context_used`). Used for history and digest input.

### Code

- **Learn API — Tutor query and memory update**  
  [sudar-learn/src/app/api/tutor/query/route.ts](../sudar-learn/src/app/api/tutor/query/route.ts)  
  - Loads `learner_profiles.ai_tutor_context` and prior enrollments.  
  - Builds a system prompt that includes "Learner Memory" (known concepts, struggles, style, prior courses).  
  - Sends the user message plus recent conversation history to the AI.  
  - Writes each exchange to `ai_interactions` and `learning_events` (when in a course).  
  - Calls `updateLearnerMemory()` only when cadence + org policy allow it.

- **Learn — My Memory page**  
  Learners can view and edit what Sudar knows about them: [sudar-learn/src/app/(dashboard)/memory/](../sudar-learn/src/app/(dashboard)/memory/).

- **Digest cron**  
  [sudar-learn/src/app/api/cron/consolidate-learner-memory/route.ts](../sudar-learn/src/app/api/cron/consolidate-learner-memory/route.ts) — scheduled digest LLM; respects learner digest cadence, org policy, and new content since last consolidation.

---

## Why This Matters

Most "AI in LMS" implementations are **stateless** — they do not remember the learner between sessions. Sudar is built so that Sudar **remembers** and **adapts**, while giving learners and admins explicit levers over **how often** model inference updates stored memory — a core differentiator for trust and compliance storytelling.

---

*Sudar — Learns with you, for you.*
