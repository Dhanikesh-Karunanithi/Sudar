# Quiz personalization strategy (Sudar Learn)

This document describes phased options for adapting assessments without surprising learners or bypassing org compliance. Canonical module quizzes in `modules.quiz` remain the **shared** baseline for all learners unless a product decision explicitly adds alternatives.

## Current behavior

- **One quiz per module** in stored content; all learners see the same items.
- **`quiz_attempt` events** may include `wrong_topics`; these merge into `learner_profiles.ai_tutor_context.struggles_with` (see `POST /api/events`).
- The **AI tutor** can provide extra practice (e.g. “another question”) in chat; that is **supplemental**, not a graded substitute.

## Phase C1 — Supplemental adaptive practice (recommended first)

**Goal:** Target weak topics without changing certificate or completion quizzes.

- Surface a **“Practice more on this topic”** action after a quiz or from Memory insights, calling the tutor or a dedicated API with **module content + wrong topic**.
- Store outputs only as **enrollment-scoped overlays** or chat history, not as authoritative scores.
- **Compliance:** Respect `organisations.settings.ai_compliance` (generative personalization, consent, retention). Log `learning_events` with minimal payloads (no full model dumps).

## Phase C2 — Tagged question banks

**Goal:** Deterministic, auditable per-learner selection.

- Extend module quiz schema with **tags** per item (e.g. skill or concept id).
- At runtime, select **N** items from a pool by matching tags to learner gaps (from memory + course events).
- **Pros:** Explainable (“you were assigned items tagged X”). **Cons:** Authoring cost; requires Studio tooling.

## Phase C3 — AI-generated quiz items

**Goal:** Net-new questions from module text.

- Requires **human or policy gate**: preview, sampling, and org opt-in.
- Higher risk for **high-stakes or compliance** courses; prefer C2 for those.

## Decision checklist

| Question | C1 supplemental | C2 tagged bank | C3 generative |
|----------|-----------------|----------------|---------------|
| Same graded quiz for everyone? | Yes | Optional parallel pool | Risky |
| Auditable by L&D? | Chat/overlay review | Yes | Needs workflow |
| Uses learner memory | Yes | Yes | Yes |

## Related code

- Events: [`src/app/api/events/route.ts`](../src/app/api/events/route.ts) (`quiz_attempt` → memory).
- Course personalization memory (includes course-scoped quiz signals): [`src/lib/personalization/memoryContext.ts`](../src/lib/personalization/memoryContext.ts).
