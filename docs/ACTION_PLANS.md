# Sudar — Action Plans (Executable)

This document defines concrete action plans that align with `STRATEGIC_PATH.md`.  
Each plan has **objectives**, **tasks** (with hints), and **acceptance criteria**.  
Tasks can be executed by a single agent or split across multiple agents when workstreams are independent.

---

## Action Plan A — Creator Velocity (Studio)

**Objective**: Admins can assign a learning path to learners and set due dates; assignments and due dates are visible.  
**Strategic pillar**: Outcomes and compliance + Democratize creation.  
**Apps**: byteos-studio only (Learn consumption in Plan B/C).

### A1. Path assignment UI (Studio)
- **Task**: Add an “Assign” flow on the path detail page (`byteos-studio/src/app/(dashboard)/paths/[id]/page.tsx` or a new subpage) that:
  - Lets the admin select one or more learners (from `profiles` in the same org, or from a simple list).
  - Creates `enrollments` rows with `path_id`, `user_id`, `enrolled_by`, optional `due_date`.
- **Hint**: Reuse `createAdminClient()` and existing enrollments API pattern; ensure `course_id` is null and `path_id` is set. For learner list, fetch `profiles` joined with `org_members` for the current org.
- **Acceptance**: Admin can open a path, click “Assign”, pick learners and a due date, submit; enrollments appear in DB and (after Plan B) in Learn.

### A2. Due date on assignment
- **Task**: In the Assign flow, add an optional date picker for `due_date`; persist to `enrollments.due_date`.
- **Hint**: Schema already has `enrollments.due_date`; only need to pass it in the insert/update.
- **Acceptance**: Enrollments created via Assign have correct `due_date` when set.

### A3. List assigned learners on path (Studio)
- **Task**: On the path detail page, show a section “Assigned learners” listing enrollments for this path (user name, progress %, due date, status).
- **Hint**: Fetch `enrollments` where `path_id = path.id`, join `profiles` for names.
- **Acceptance**: Admin sees who is assigned, their progress, and due date.

**Definition of done for Plan A**: Assign path + due date from Studio; see assigned learners and due dates on path detail.

---

## Action Plan B — Learner Polish (Learn)

**Objective**: Learners see certificates as “Print / Save as PDF” and see upcoming deadlines when they have due dates.  
**Strategic pillar**: Outcomes and compliance + Learner-first.  
**Apps**: byteos-learn only.

### B1. Certificate Print / Save as PDF (Learn)
- **Task**: On the public certificate page (`byteos-learn/src/app/cert/[code]/page.tsx`), ensure “Print / Save as PDF” is obvious and reliable (e.g. dedicated button that calls `window.print()`, print-specific CSS so only the certificate card is printed).
- **Hint**: Use a client component for the button if needed; add `@media print { ... }` to hide nav/actions and show only the cert card.
- **Acceptance**: User can click one button and get a print dialog (or “Save as PDF” in that dialog) with only the certificate content.

### B2. Upcoming deadlines on dashboard (Learn)
- **Task**: On the learner dashboard (`byteos-learn/src/app/(dashboard)/page.tsx`), fetch enrollments (course or path) that have `due_date` in the future; show an “Upcoming deadlines” or “Due soon” card with title, due date, and link to course/path.
- **Hint**: Query `enrollments` where `user_id = currentUser` and `due_date >= today`, order by `due_date` asc; resolve course/path title from `courses` or `learning_paths`.
- **Acceptance**: When enrollments have due dates, learner sees a clear list/card with next due items and can click through.

**Definition of done for Plan B**: Certificate print/PDF works; dashboard shows upcoming deadlines when present.

---

## Action Plan C — Compliance & Visibility (Studio + Learn)

**Objective**: Studio has a simple compliance view (who is assigned, due when, at-risk/overdue); Learn surfaces “Required” or “Due soon” where relevant.  
**Strategic pillar**: Outcomes and compliance.  
**Apps**: byteos-studio (compliance view), byteos-learn (required/due soon badges or section).

### C1. Compliance view (Studio)
- **Task**: Add a “Compliance” or “Assignments” page under Studio (e.g. `byteos-studio/src/app/(dashboard)/compliance/page.tsx`) that lists path enrollments (and optionally course enrollments) with: learner name, path/course title, due date, status (on track / at risk / overdue), progress %.
- **Hint**: “Overdue” = `due_date < today` and not completed; “At risk” = due within 7 days and not completed; “On track” = due later or completed. Use `createAdminClient()`, join enrollments + profiles + learning_paths.
- **Acceptance**: Admin can open Compliance and see a table/filtered list of assignments with due dates and status.

### C2. Required / Due soon on Learn dashboard
- **Task**: On the Learn dashboard, if the learner has path or course enrollments with `due_date`, show a “Required” or “Due soon” section (or integrate into “Upcoming deadlines” from B2) with clear labels and links.
- **Hint**: Can merge with B2 “Upcoming deadlines”; distinguish “mandatory path” vs “due date” if useful.
- **Acceptance**: Learner sees which items are required or due soon and can act on them.

**Definition of done for Plan C**: Compliance view in Studio; Learn dashboard surfaces required/due soon clearly.

---

## Execution Order and Agents

| Plan | Can run in parallel with | Suggested order |
|------|---------------------------|-----------------|
| A (Studio) | B | A1 → A2 → A3 (then B) |
| B (Learn) | A | B1 → B2 (can start after A1 if needed) |
| C (Studio + Learn) | — | After A and B (depends on assign + due_date) |

**Using multiple agents**:  
- **Agent 1**: Execute Plan A (Studio: assign path, due date, list assigned learners).  
- **Agent 2**: Execute Plan B (Learn: certificate print, upcoming deadlines).  
- **Agent 3**: After A and B, execute Plan C (compliance view + required/due soon on Learn).

Or execute sequentially: A → B → C.

---

## Action Plan D — LAMP / ALP (Build-First, Then Paper)

**Objective**: Build ALP API, Moodle connector, and pilot plan first; then update the LAMP paper to reflect what was built; finally run pilot and apply for Claude-for-OSS.  
**Strategic pillar**: Visibility, research credibility, and ecosystem (ALP).

**Authoritative plan and tracker**:
- **Long-term plan (build-first)**: [docs/LAMP_BUILD_PLAN.md](LAMP_BUILD_PLAN.md) — read this for full task descriptions, file paths, and acceptance criteria. Cursor agents must follow it and stay grounded via ECOSYSTEM.md and AGENTS.md.
- **Progress tracker**: [docs/LAMP_BUILD_TRACKER.md](LAMP_BUILD_TRACKER.md) — update this when starting or completing any task (set Status to In progress / Done, update Last updated).

**Execution order**: **Phase 1 Build** (B1 → B2–B4 → B5) → **Phase 2 Paper** (P1–P8) → **Phase 3** (O1 pilot, O2 Claude-for-OSS). Build first so the paper can accurately describe ALP and any improvements found during the build.

### Task map (full detail in docs/LAMP_BUILD_PLAN.md; status in docs/LAMP_BUILD_TRACKER.md)

| Phase | IDs | What |
|-------|-----|------|
| **1 — Build** | B1 | ALP API doc (docs/ALP_API.md or ECOSYSTEM subsection) |
| | B2 | SudarMemory — event ingestion from Moodle/LRS |
| | B3 | SudarChat — tutor in Moodle (block or LTI) |
| | B4 | SudarRecommend — next-action block in Moodle |
| | B5 | Pilot plan (docs/PILOT_PLAN.md) |
| **2 — Paper** | P1–P8 | LAMP paper revisions (Background, stateless→stateful, ALP in paper, economics, evaluation, privacy, limitations, Claude) |
| **3 — Pilot & OSS** | O1 | Pilot with partner(s); O2 = Claude-for-OSS application |

**Definition of done for Plan D**: Phase 1 (B1–B5) Done → Phase 2 (P1–P8) Done → Phase 3 (O1, O2) Done. Track all status in **docs/LAMP_BUILD_TRACKER.md**.

---

## Execution Order and Agents

| Plan | Can run in parallel with | Suggested order |
|------|---------------------------|-----------------|
| A (Studio) | B | A1 → A2 → A3 (then B) |
| B (Learn) | A | B1 → B2 (can start after A1 if needed) |
| C (Studio + Learn) | — | After A and B (depends on assign + due_date) |
| D (LAMP & ALP) | — | Phase 1: B1→B2–B4→B5 (build); Phase 2: P1–P8 (paper); Phase 3: O1, O2. See docs/LAMP_BUILD_PLAN.md; track in docs/LAMP_BUILD_TRACKER.md. |

**Using multiple agents**:  
- **Agent 1**: Execute Plan A (Studio: assign path, due date, list assigned learners).  
- **Agent 2**: Execute Plan B (Learn: certificate print, upcoming deadlines).  
- **Agent 3**: After A and B, execute Plan C (compliance view + required/due soon on Learn).  
- **Plan D**: Execute in phase order: **Build first** (B1 → B2–B4 → B5), then **Paper** (P1–P8), then **Pilot & OSS** (O1, O2). See docs/LAMP_BUILD_PLAN.md; update docs/LAMP_BUILD_TRACKER.md on each task completion.

Or execute sequentially: A → B → C; then Phase 1 → Phase 2 → Phase 3 for Plan D.

---

## Completion Checklist (Update as Done)

**Plans A–C**
- [x] **A1** Path assignment UI (Studio)
- [x] **A2** Due date on assignment
- [x] **A3** List assigned learners on path (Studio)
- [x] **B1** Certificate Print / Save as PDF (Learn)
- [x] **B2** Upcoming deadlines on dashboard (Learn)
- [x] **C1** Compliance view (Studio)
- [x] **C2** Required / Due soon on Learn dashboard

**Plan D — LAMP / ALP (build-first; track in docs/LAMP_BUILD_TRACKER.md)**
- [ ] **B1** ALP API documentation
- [ ] **B2** SudarMemory — event ingestion
- [ ] **B3** SudarChat — tutor in Moodle
- [ ] **B4** SudarRecommend — next-action in Moodle
- [ ] **B5** Pilot plan (docs/PILOT_PLAN.md)
- [ ] **P1–P8** Paper revisions (see LAMP_BUILD_PLAN.md)
- [ ] **O1** Pilot with partner(s); **O2** Claude-for-OSS application

---

*Last updated: Plan D switched to build-first; see docs/LAMP_BUILD_PLAN.md and docs/LAMP_BUILD_TRACKER.md.*
