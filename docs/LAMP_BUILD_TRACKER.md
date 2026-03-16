# LAMP / ALP — Build Tracker

**Purpose**: Single place to track progress on the LAMP build-first plan. Cursor agents must update this file when they start or complete a task from [docs/LAMP_BUILD_PLAN.md](LAMP_BUILD_PLAN.md).

**Instructions for agents**:
- When you **start** a task: set its **Status** to `In progress` and set **Last updated** below to today’s date.
- When you **complete** a task: set its **Status** to `Done`, set **Last updated** to today’s date, and add a short **Note** (e.g. file created, endpoint documented).
- Leave **Status** as `Not started` until work begins. Do not remove or rename task IDs.
- When a completed task affects what the **paper** claims (e.g. a new shipped feature): update [docs/research/paper.tex](research/paper.tex) and/or [docs/LAMP-Updated-Draft.md](LAMP-Updated-Draft.md) per [docs/research/PAPER_SYNC.md](research/PAPER_SYNC.md) so the paper stays aligned with the build.

**Last updated**: 2026-03-15

---

## Phase 1 — Build

| ID | Task | Status | Note |
|----|------|--------|------|
| B1 | ALP API documentation (docs/ALP_API.md or ECOSYSTEM subsection) | Done | docs/ALP_API.md created; event ingestion, learner/tutor/next-action, SCORM/xAPI. |
| B2 | SudarMemory — event ingestion from Moodle/LRS into ALP | Done | POST /api/alp/events in Learn; ALP_API_KEY auth; docs/ALP_API.md updated. |
| B3 | SudarChat — tutor in Moodle (block or LTI) | Done | POST /api/alp/tutor/query in Learn; Moodle block calls this. |
| B4 | SudarRecommend — next-action block in Moodle dashboard | Done | POST /api/alp/next-action in Learn; Moodle block calls this. |
| B5 | Pilot plan (docs/PILOT_PLAN.md) | Done | docs/PILOT_PLAN.md created; partners, criteria, data, RQ link. |

**Phase 1 gate**: All of B1–B5 Done before starting Phase 2.

---

## Phase 2 — Paper

| ID | Task | Status | Note |
|----|------|--------|------|
| P1 | Background — AI plugins and learning analytics in LMSs | Done | §2 new subsection; Moodle/LearnWise/analytics vs Sudar+ALP. |
| P2 | System Design — From stateless to stateful tutors | Done | §3.3 paragraph on stateless→stateful, Twin in learner_profiles. |
| P3 | ALP — API and data-flow in paper | Done | §3.6 API surface, event ingestion, ALP proxies, docs/ALP_API.md, SCORM/xAPI/LRS. |
| P4 | Economics — Costing methodology | Done | §4.5 costing methodology para; §5 cost-per-outcome in future studies. |
| P5 | Evaluation — Planned evaluation design + pilot sentence | Done | §5 RQ1–RQ3, designs, metrics, analysis; pilot plan in repo. |
| P6 | Privacy and governance | Done | §6 Privacy and governance: tenancy, retention, view/correct, opt-out, FERPA/GDPR, Edge-TTS. |
| P7 | Limitations — Research-oriented threats | Done | Model validity (IRT/BKT); bias/equity; generalisation across LMSs. |
| P8 | Claude / AI tooling (paper + OSS application statements) | Done | Acknowledgments: AI-assisted dev; 3 statements for Claude-for-OSS. |

**Phase 2 gate**: All of P1–P8 Done before Phase 3 (or in parallel with pilot prep).

---

## Phase 3 — Pilot & OSS

| ID | Task | Status | Note |
|----|------|--------|------|
| O1 | Pilot with at least one partner (data per PILOT_PLAN.md) | Not started | |
| O2 | Submit Claude-for-OSS application | Not started | |

---

## Summary

| Phase | Done | Total |
|-------|------|------|
| Phase 1 (Build) | 5 | 5 |
| Phase 2 (Paper) | 8 | 8 |
| Phase 3 (Pilot & OSS) | 0 | 2 |

*(Update the Done counts when you mark tasks Done.)*
