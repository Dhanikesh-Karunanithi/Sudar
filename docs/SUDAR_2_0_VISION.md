# Sudar 2.0 — SudarNotes (Conversational Learning) Vision

**Status:** Experiment (branch `experiment/sudar-2.0-conversational`)  
**Product name (learner UI):** **SudarNotes** (route still `/journey`)  
**Product stance:** Coexistence with Sudar 1.x course Learn — not a replacement yet  
**Tagline:** *Learns with you, for you.*

---

## 1. Why this exists

Online learning has been stuck in a content-first shape for twenty years:

1. Someone authors a course (or SCORM package).
2. Learners open modules in order.
3. A quiz appears at the end.
4. An AI chat widget may sit in the corner and answer questions about that content.

Sudar 1.x already improved this dramatically — modalities, Digital Learner Twin, longitudinal tutor memory, adaptive paths. But the **primary interface** is still “open a course.”

**SudarNotes / Sudar 2.0 inverts the product:** the tutor *is* the learning experience. Content is co-authored into a living notebook inside conversation, guided by a pedagogical turn engine (intake → socratic / teach / check / replan / note_craft).

**Teaching OS update (July 2026):** The shared **claim / mastery / pedagogy** spine is no longer “later only” — see [TEACHING_OS.md](TEACHING_OS.md). SudarNotes remains a **delivery client** of that spine (alongside courses, Sim, flashcards). Personalization is still the *path* through shared claims, not a unique course file per learner.

This is the research and product evolution toward **Conversational Learning**.

---

## 2. How learning technology evolves

| Era | Primary interface | Sequencing | Assessment | Personalization |
|-----|-------------------|------------|------------|-----------------|
| **LMS** | Course catalog + SCORM player | Fixed syllabus | End-of-module quiz | Cohort / role assignment |
| **LXP** | Feed / skills / search | Soft recommendations | Still mostly quizzes | Preference + engagement signals |
| **Sudar 1.x** | Course viewer + modalities + assistive tutor | Authored modules; adaptive path order | Quizzes + Twin signals | Twin, overlays, tutor memory |
| **SudarNotes (2.0)** | Shared workspace with Sudar (living notebook + dialogue + voice) | Hybrid adaptive modes per turn | Soft conversational checks + Twin | Twin + session working memory + replan |

### What we are not building (yet)

- A 2D/3D virtual world (WorkAdventure / SudarPlay was retired).
- A chat widget bolted to an existing course page (that already exists).
- Immediate replacement of Studio course authoring or the course Learn UX.
- Org-set compliance goals and full Studio graph curator (later phases).
  - *Update:* Minimal Studio **Domains** claim curator exists; richer graph UI still deferred.

---

## 3. The core loop

```
Goal → Diagnostic → Curriculum Graph → Socratic Dialogue → Embedded Check → Replan
```

1. **Goal** — Learner describes an aspiration in their own words (org-set goals later).
2. **Diagnostic** — Short guided conversation; Twin fields update (`known_concepts`, `struggles_with`, explanation style).
3. **Curriculum graph** — Shared domain of concepts + prerequisites + assessable claims; personalization is the *path*, not a copy of content per learner.
4. **Socratic dialogue** — Pedagogical states: probing → productive struggle → explaining → testing → replanning.
5. **Embedded check** — Explain-it-back / apply / catch-the-error mapped to node claims.
6. **Replan** — Skip ahead, fill a prerequisite gap, or slow down; Twin + path update under memory cadence.

---

## 4. Coexistence map (1.x and 2.0)

| Surface | Role |
|---------|------|
| **Courses / Paths / Progress** | Unchanged Sudar 1.x — still the default for authored training |
| **Floating tutor / course tutor** | Assistive help *inside* courses |
| **Sudar’s Memory** | Twin transparency — shared across both surfaces |
| **SudarNotes (`/journey`)** | Parallel Conversational Learning experience (this experiment) |

Learners may use both. Journey does not deprecate courses; if the experiment fails, abandon the branch.

### Kill criteria

Abandon or rethink if, after a real pilot domain + dialogue engine:

- Learners prefer course viewer for the same outcomes and ignore Journey.
- Token cost cannot be bounded with cadence + graph cache + tiered models.
- Pedagogy collapses to “chat that lectures” with no measurable mastery gains.

---

## 5. Presence, chat, and living notebook

**Target product:** Same Sudar tutor — branded logo in text mode; **voice orb only when Voice is on**.

| Layer | Role |
|-------|------|
| **Docked Sudar** (right, collapsible) | Shared `SudarChatPanel` with **Chats** history. Collapse with **Focus study** to widen the notebook. Floating FAB hidden on `/journey`. |
| **SudarNotes notebook** (left) | Living cards: Sudar **suggests**, learner **accepts/edits**; working memory strip (goal, active concept, open questions). Tools use **accepted** notes only. |
| **Voice orb** | Interactive presence when Voice is enabled — not a logo replacement. |

**Teaching style:** Hybrid adaptive modes (intake / socratic / teach / check / replan / note_craft). Short conversational turns — **no roadmap-first dumps**. Soft explain-back checks every few turns. Optional YouTube/embeds only when the learner asks.

---

## 6. Cost principles

Extend existing tutor memory cadence (learner + org governance):

- Cache shared curriculum graph retrieval.
- Keep Twin snippets small every turn.
- Cadence-gate Twin extraction and replan LLM calls.
- Tier models: cheap for routine turns; stronger for diagnostic / replan / ambiguous checks.
- Digest conversation history (existing consolidate-memory pattern).

---

## 7. First-session storyboard

See [SUDAR_2_0_STORYBOARD.md](SUDAR_2_0_STORYBOARD.md). Walk it in Learn at **`/journey`** (experiment branch; enable with `NEXT_PUBLIC_SUDAR_JOURNEY=1`, or leave unset in local development).

---

## 8. Build phases (after Phase 0 review)

1. Schema + seed one domain from an existing course; journey sessions.
2. Dialogue API + pedagogical FSM; Twin diagnostic; embedded checks → mastery.
3. Production voice path + cadence / tiered models.
4. Live graph visualization + telemetry.
5. Minimal Studio domain curator (optional).

---

## 9. Click-path walkthrough (live)

1. Run Learn on this branch with Journey enabled (and tutor LLM keys configured as usual).
2. Open **SudarNotes** — living notebook left, **docked Sudar** right (no floating overlay).
3. Pick a starter in the chat empty state (or type a goal).
4. Watch Sudar intake / teach in chat; suggested note cards appear for Accept — not auto-dumped roadmaps or soft web search.
5. Optional: toggle **Voice** for the reactive orb (mic presence; typing still sends).
6. **Courses** remain available in parallel.

---

*SudarNotes — Conversational Learning.*  
*Branch may be deleted without affecting Sudar 1.x mainline.*
