# Sudar Teaching OS

**Status:** In build (Phases 0–5 spine)  
**Tagline:** *Learns with you, for you.*  
**Rule:** Surfaces are interchangeable delivery. The product is the closed loop — not any one UI layout.

---

## 1. What this is

Sudar evolves from a course-centric LMS + assistive tutor into a **learner-bound Teaching Operating System**:

- **Shared claim graph** — assessable statements + prerequisites (not a unique course file per learner).
- **Claim mastery** — `p_know`, confidence, spaced `next_review_at` per learner × claim.
- **Learning sessions** — surface-agnostic containers (course, conversational, sim, flashcards, ALP, …).
- **Pedagogy engine** — one brain: intake → probe → teach → check → practice → replan → consolidate.
- **Twin as control plane** — steers mode, path, and review; mastery table is source of truth for “what they know.”
- **Unified scheduler (NBA v2)** — overdue reviews → failed claims → prereq gaps → continue session → course → sim → explore.

SudarNotes / Journey is **one client** of the pedagogy engine, not the system definition.

---

## 2. Core concepts

| Concept | Definition |
|--------|------------|
| **Claim** | Atomic assessable statement (`stem`, misconceptions[], bloom, evidence_types[]) |
| **Domain graph** | Org-scoped, versioned set of claims + edges (`prerequisite`, `related`) |
| **Mastery** | Per learner×claim: `p_know`, `last_evidence_at`, `next_review_at`, SM-2-ish scheduling fields |
| **Learning session** | Goal, active_claim_ids, mode, artifacts[]; any surface attaches |
| **Pedagogy mode** | `intake \| probe \| teach \| check \| practice \| replan \| consolidate` |
| **Artifact** | Accepted note / flashcard / overlay / sim debrief — linked to claim_ids |

**Personalization** = path, pedagogy, modality, practice, spaced revisit — **not** forking full course rows per learner.

---

## 3. Closed loop

```
Goal → Session → PedagogyEngine → Surface renders → Evidence → Mastery + Twin → Scheduler → next
```

Every teach path must have a check path. Checks write `learner_claim_mastery` + `learning_events` (`claim_check`, `claim_mastery_update`, `review_due_served`, `session_replan`).

---

## 4. System of record

| Concern | Owner |
|--------|--------|
| Twin, mastery, NBA, pedagogy, tutor BFF | **sudar-learn** |
| TTS, Sim AI, Agents gateway, SudarVid | sudar-intelligence / sidecars |
| Domain curator, course↔claim links, claim analytics | **sudar-studio** |

Do not treat stub Intelligence `/api/learner/*` routes as truth.

---

## 5. Database

Migration: `supabase/migrations/20260728120000_teaching_os_spine.sql`

- `learning_domains`, `learning_claims`, `claim_edges`, `claim_content_links`
- `learner_claim_mastery`, `learning_sessions`

---

## 6. Key code

| Area | Path |
|------|------|
| Types | `sudar-learn/src/types/teaching.ts` |
| Graph / mastery / scheduler / session | `sudar-learn/src/lib/teaching/*` |
| Pedagogy engine | `sudar-learn/src/lib/teaching/pedagogyEngine.ts` |
| SudarNotes adapter | `sudar-learn/src/lib/sudarNotes/turnEngine.ts` (thin) |
| NBA v2 | `sudar-learn/src/lib/intelligence/nextBestActionEngine.ts` |
| Seed | `sudar-learn/src/lib/teaching/seedDomainFromCourse.ts` |
| Studio curator | `sudar-studio` domain / claims APIs + UI |
| Depth helpers | `sudar-learn/src/lib/teaching/depth.ts` |

---

## 7. Kill criteria (conversational open learning)

Stop expanding surfaces until fixed if:

- No measurable mastery lift vs course-only for the same claims
- Token cost unbounded despite cadence + tiering
- Pedagogy collapses to lecture-chat with no checks

---

## 8. Phases

0. Contract + types (this doc)  
1. Schema + libs + seed one course  
2. Pedagogy engine + Twin + NBA v2  
3. Wire surfaces (course, flashcards, Sim, dashboard, Memory, ALP)  
4. Studio domain curator + import + claim analytics  
5. Transfer / teach-back, misconceptions, metacognition, offline packs, claim credentials  

---

*Sudar Teaching OS — shared content, personal trajectory.*
