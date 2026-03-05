# Sudar's Longitudinal Memory

ByteOS's AI tutor **Sudar** uses a **longitudinal learner memory** so that every response is personalised across sessions and courses. This document describes how it works and where it lives in the codebase.

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

## Where It Lives

### Data

- **`learner_profiles.ai_tutor_context`** (Supabase) — JSON object holding the Digital Learner Twin summary used by Sudar: `known_concepts`, `struggles_with`, `learning_style_notes`, `self_reported_background`, `learning_goals`, `preferred_explanation_style`, `interaction_count`, etc.
- **`ai_interactions`** (Supabase) — Every tutor Q&A is logged here (`user_message`, `ai_response`, `context_used`). Used for history and for async updates to `ai_tutor_context`.

### Code

- **Learn API — Tutor query and memory update**  
  [byteos-learn/src/app/api/tutor/query/route.ts](../byteos-learn/src/app/api/tutor/query/route.ts)  
  - Loads `learner_profiles.ai_tutor_context` and prior enrollments.  
  - Builds a system prompt that includes "Learner Memory" (known concepts, struggles, style, prior courses).  
  - Sends the user message plus recent conversation history to the AI.  
  - Writes each exchange to `ai_interactions` and `learning_events`.  
  - Calls `updateLearnerMemory()` to asynchronously update `ai_tutor_context` from the interaction (e.g. new concept understood, struggle identified, style note).

- **Learn — My Memory page**  
  Learners can view and edit what Sudar knows about them: [byteos-learn/src/app/(dashboard)/memory/](../byteos-learn/src/app/(dashboard)/memory/).

---

## Why This Matters

Most "AI in LMS" implementations are **stateless** — they do not remember the learner between sessions. ByteOS is built so that Sudar **remembers** and **adapts**: "Last time you struggled with X, so here's a different way…" is a core differentiator. This document exists so that newcomers and contributors can see that Sudar's memory is real and implemented, not planned.

---

*ByteOS — Learns with you, for you.*
