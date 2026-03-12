# LAMP / ALP — Long-Term Build-First Plan

**Purpose**: Get the product (ALP API, Moodle connector, pilot readiness) to the desired state first; then update the LAMP paper to reflect what was built and any improvements discovered. Cursor agents must follow this plan and keep the tracker updated.

---

## For Cursor Agents — Required Before Any LAMP/ALP Work

1. **Read first**: [ECOSYSTEM.md](../ECOSYSTEM.md) (authoritative context) and [AGENTS.md](../AGENTS.md) (naming, stack, DO NOTs). Stay grounded in the three-app structure (Studio, Learn, Intelligence) and the canonical schema.
2. **After completing any task below**: Update [docs/LAMP_BUILD_TRACKER.md](LAMP_BUILD_TRACKER.md) — set that task’s **Status** to **Done**, set **Last updated** to the current date, and add a brief **Note** if useful (e.g. file path of what you added).
3. **When starting a task**: Optionally set that task’s Status to **In progress** in the tracker so others see work in progress.
4. **File paths**: Use the paths in this document; they are relative to the repo root. Studio = `byteos-studio/`, Learn = `byteos-learn/`, Intelligence = `byteos-intelligence/`.

---

## Strategy: Build First, Paper Second

- **Phase 1 (Build)**: ALP API documentation, Moodle ALP connector (SudarMemory, SudarChat, SudarRecommend), and pilot plan document. Delivers a working product and a single source of truth for what ALP is.
- **Phase 2 (Paper)**: Update the LAMP paper (`docs/LAMP-Updated-Draft.md`) with all planned revisions (novelty contrast, stateless→stateful, ALP API in paper, economics methodology, evaluation design, privacy, limitations, Claude acknowledgment). By then the build may have revealed new improvements to describe.
- **Phase 3 (Pilot & OSS)**: Pilot execution (with partners) and Claude-for-OSS application, using the paper and tracker as evidence.

---

## Phase 1 — Build (ALP API, Moodle Connector, Pilot Plan)

**Goal**: Product and docs ready so the paper can accurately describe ALP and the pilot can start.

### 1.1 ALP API documentation

| ID   | Task | Where | Acceptance |
|------|------|--------|------------|
| **B1** | Create the ALP-facing API spec in one place. | Add **docs/ALP_API.md** (or a dedicated subsection in ECOSYSTEM.md). | Doc exists; defines event ingestion (xAPI/SCORM → `learning_events`), learner Twin read/update, tutor (`POST /api/tutor/query`), next-action. Align with `byteos-intelligence/src/api/routes/` (learner.py, tutor.py) and ECOSYSTEM.md §6 (Learn → Intelligence). |

**Hints**:  
- Event ingestion: document expected fields (actor, verb, object, result, context) and mapping to `learning_events`.  
- Learner: `POST /api/learner/profile`, `POST /api/learner/next-action` (see [byteos-intelligence/src/api/routes/learner.py](../byteos-intelligence/src/api/routes/learner.py)).  
- Tutor: `POST /api/tutor/query` (see [byteos-intelligence/src/api/routes/tutor.py](../byteos-intelligence/src/api/routes/tutor.py)).  
- Include 2–3 sentences on SCORM for compatibility and xAPI/LRS for fine-grained tracking; ALP as intelligence layer on LRS.

**On completion**: Update [LAMP_BUILD_TRACKER.md](LAMP_BUILD_TRACKER.md) — B1 = Done.

---

### 1.2 Moodle ALP connector

Target: **Moodle 4.x** (largest addressable base; documented AI subsystem). Deliver SudarMemory, SudarChat, SudarRecommend. SudarStudio Embed and SudarAdapt are deferred until these are stable.

| ID   | Task | Where | Acceptance |
|------|------|--------|------------|
| **B2** | **SudarMemory** — Event ingestion from LMS into ALP. | New adapter (e.g. in repo or `byteos-intelligence`): accepts Moodle webhooks or LRS-style events; maps to schema; writes to `learning_events` and updates `learner_profiles` as per ALP_API.md. Document how Moodle (or xAPI/LRS) events are consumed. | ALP can receive and store events from Moodle (or a documented spec for the same). |
| **B3** | **SudarChat** — Tutor inside Moodle. | Moodle block or LTI that embeds the Sudar tutor UI; calls `POST /api/tutor/query` with learner ID and course context; reads Twin from ALP API (per ALP_API.md). | Learner can open Sudar chat from a Moodle course page and receive memory-aware tutor responses. |
| **B4** | **SudarRecommend** — Next-action in Moodle. | Moodle dashboard block that calls the next-action endpoint (per ALP_API.md) and renders the recommendation card. | Moodle dashboard shows Sudar recommendation card when ALP is configured. |

**Hints**:  
- Reuse existing Intelligence endpoints; do not duplicate logic. Auth: document how Moodle user is mapped to ALP/Supabase learner (e.g. LTI or shared user store).  
- If a full Moodle plugin is out of scope initially, a “spec + mock” or a minimal LTI that calls Intelligence is acceptable as a first milestone; document in tracker.

**On completion**: Update tracker — B2, B3, B4 = Done (or In progress / Done per task).

---

### 1.3 Pilot plan document

| ID   | Task | Where | Acceptance |
|------|------|--------|------------|
| **B5** | Create pilot plan. | Add **docs/PILOT_PLAN.md**. | Doc exists with: target partners (e.g. one university, one corporate L&D) and outreach status; success criteria (adoption, engagement, early learning metrics); data collection and anonymisation for a follow-up paper. Can reference “Planned evaluation design” (RQ1–RQ3) to be added in Phase 2 paper. |

**On completion**: Update tracker — B5 = Done.

---

## Phase 2 — Paper (LAMP Revisions)

**Goal**: LAMP paper reflects the built product and meets reviewer expectations (novelty, methodology, evaluation plan, limitations). Do this after Phase 1 so the paper can cite ALP_API.md and the Moodle connector.

**File**: [docs/LAMP-Updated-Draft.md](LAMP-Updated-Draft.md)

| ID   | Task | Section / location | Acceptance |
|------|------|---------------------|------------|
| **P1** | Background — AI plugins and learning analytics in LMSs today. | §2, after “AI in higher education and LMS,” before Learn Your Way. | New subsection: Moodle AI subsystem (Provider/Placement), third-party (e.g. LearnWise-style), analytics plugins; contrast sentence that Sudar+ALP offer persistent cross-course learner model and LMS-agnostic intelligence. |
| **P2** | System Design — From stateless to stateful tutors. | §3.3 (AI Tutor), after reactive/proactive paragraph. | New paragraph: stateless vs stateful; workarounds (summarisation, JSON save) as per-course; Digital Learner Twin in `learner_profiles` as principled, cross-course, inspectable answer. |
| **P3** | ALP — API and data-flow in paper. | §3.6, after integration diagram, before “No data migration.” | API/contract list aligned with docs/ALP_API.md; 2–3 sentences on SCORM/xAPI/LRS and ALP as intelligence layer on LRS. |
| **P4** | Economics — Costing methodology. | §4.5, before 4.5.1. | New “Costing methodology and assumptions” subsection (tokens, prices, sessions/month, hosting); 1–2 numbers for inference-cost collapse; in evaluation/future work, add “cost per unit improvement” vs commercial LMS+AI. |
| **P5** | Evaluation — Planned evaluation design. | §5. | RQs (e.g. RQ1: outcomes vs LMS; RQ2: memory and repeated errors/dropout; RQ3: cost per learning gain); designs; metrics; analysis plan. Add one sentence that pilot plan is in repo and results in a subsequent paper. |
| **P6** | Privacy and governance. | Before or inside §6. | Subsection: tenancy, retention, view/correct, opt-out; FERPA/GDPR; Edge-TTS licensing and production options (Azure AI Speech or open-source TTS). |
| **P7** | Limitations — Research-oriented threats. | §6 Limitations. | Add: model validity (Twin from proxies; no IRT/BKT); bias/equity (future work); generalisation across LMSs (Moodle vs Canvas/Blackboard; document and evaluate). |
| **P8** | Claude / AI tooling. | §4 or Acknowledgments. | One sentence on AI-assisted development (e.g. Claude for architecture, docs, learning-science consistency). Prepare 2–3 short statements for Claude-for-OSS application (project value, enterprises, OSS impact). |

**On completion**: Update tracker — P1–P8 = Done.

---

## Phase 3 — Pilot & OSS

| ID   | Task | Acceptance |
|------|------|------------|
| **O1** | Run pilot with at least one partner (university or corporate L&D). | Pilot uses Sudar/ALP; data collected per PILOT_PLAN.md; results reported (internally or in follow-up paper). |
| **O2** | Submit Claude-for-OSS application. | Application submitted at https://claude.com/contact-sales/claude-for-oss with project-specific statements (from P8); mention Sudar, LAMP paper, ALP, Moodle connector, pilot plan. |

**On completion**: Update tracker — O1, O2 = Done.

---

## Tracker and Execution Order

- **Tracker**: [docs/LAMP_BUILD_TRACKER.md](LAMP_BUILD_TRACKER.md) — single source of truth for status. Every agent must update it when completing (or starting) a task.
- **Order**: Phase 1 (B1 → B2 → B3 → B4 → B5) → Phase 2 (P1 → … → P8) → Phase 3 (O1, O2). B2–B4 can be parallelised by different agents if interfaces are agreed (ALP_API.md first).

---

**Integration layer (Studio)**  
Admins manage ALP and embed from **Sudar Studio → Integrations** (Organization section): Learn base URL, API key setup note, and pointers for embedding the tutor and next-action widget. Optional env: `NEXT_PUBLIC_LEARN_APP_URL` in Studio.

---

## References

- **ECOSYSTEM.md** — Schema, Learn → Intelligence routes, build phases.  
- **AGENTS.md** — App boundaries, naming, DO NOTs.  
- **docs/LAMP-Updated-Draft.md** — Paper to update in Phase 2.  
- **docs/ACTION_PLANS.md** — Plan D (LAMP) references this build-first plan and the tracker.
